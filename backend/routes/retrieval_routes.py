from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from extensions import db
from models.retrieval_match import RetrievalMatch

retrieval_bp = Blueprint("retrieval", __name__)

@retrieval_bp.post("/log")
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
