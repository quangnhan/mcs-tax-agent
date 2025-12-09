from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from extensions import db
from models.retrieval_match import RetrievalMatch
from agent.tax_law_agent import TaxLawAgent

retrieval_bp = Blueprint("retrieval", __name__)


@retrieval_bp.post("/log123")
@jwt_required()
def log_retrieval():
    data = request.get_json() or {}
    r = RetrievalMatch(
        conversation_id=data.get("conversation_id"),
        user_query=data.get("user_query"),
        chatbot_response=data.get("chatbot_response"),
        retrieved_snippet=data.get("retrieved_snippet"),
        document_source=data.get("document_source"),
        similarity_score=data.get("similarity_score"),
        status=data.get("status"),
    )
    db.session.add(r)
    db.session.commit()
    return jsonify({"message": "logged"})


@retrieval_bp.get("/stats/similarity_distribution")
@jwt_required()
def feature_similarity_distribution():
    # Only Admin or Data Scientist
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    if claims.get("role") not in ["admin", "data_scientist"]:
        return jsonify({"error": "Permission denied"}), 403

    # We need to compute buckets
    # Ranges: 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
    matches = db.session.query(RetrievalMatch.similarity_score).all()
    
    buckets = {
        '0-20%': 0,
        '20-40%': 0,
        '40-60%': 0,
        '60-80%': 0,
        '80-100%': 0
    }
    
    for (score,) in matches:
        if score is None: 
            continue
        s = float(score)
        if s < 0.2:
            buckets['0-20%'] += 1
        elif s < 0.4:
            buckets['20-40%'] += 1
        elif s < 0.6:
            buckets['40-60%'] += 1
        elif s < 0.8:
            buckets['60-80%'] += 1
        else:
            buckets['80-100%'] += 1
            
    # Format for frontend Recharts
    data = [
        {"range": "0-20%", "count": buckets['0-20%']},
        {"range": "20-40%", "count": buckets['20-40%']},
        {"range": "40-60%", "count": buckets['40-60%']},
        {"range": "60-80%", "count": buckets['60-80%']},
        {"range": "80-100%", "count": buckets['80-100%']},
    ]
    
    return jsonify(data)


@retrieval_bp.route("/query", methods=["POST"])
def query_tax_agent():
    data = request.get_json() or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Please send a question"}), 400

    result = TaxLawAgent.ask(question)

    return jsonify(
        {"question": question, "answer": result["answer"], "sources": result["sources"]}
    )


@retrieval_bp.get("/list")
@jwt_required()
def list_retrieval_matches():
    # Only Admin or Data Scientist
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    if claims.get("role") not in ["admin", "data_scientist"]:
        return jsonify({"error": "Permission denied"}), 403

    matches = RetrievalMatch.query.order_by(RetrievalMatch.id.desc()).all()
    results = []
    for m in matches:
        results.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "user_query": m.user_query,
            "chatbot_response": m.chatbot_response,
            "retrieved_snippet": m.retrieved_snippet,
            "document_source": m.document_source,
            "similarity_score": m.similarity_score,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
    return jsonify(results)
