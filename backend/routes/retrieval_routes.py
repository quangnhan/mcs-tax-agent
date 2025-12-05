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
