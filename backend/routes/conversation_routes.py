from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.conversation import Conversation
from models.message import Message

convo_bp = Blueprint("conversation", __name__)

@convo_bp.post("/start")
@jwt_required()
def start_conversation():
    user_id = int(get_jwt_identity())
    conv = Conversation(user_id=user_id)
    db.session.add(conv)
    db.session.commit()
    return jsonify({"conversation_id": conv.id})

@convo_bp.post("/<int:conv_id>/message")
@jwt_required()
def add_message(conv_id):
    data = request.get_json() or {}
    sender = data.get("sender", "user")
    text = data.get("text", "")
    msg = Message(conversation_id=conv_id, sender=sender, text=text)
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message_id": msg.id})
