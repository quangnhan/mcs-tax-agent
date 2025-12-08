from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.conversation import Conversation
from models.message import Message
from sqlalchemy import desc
from agent.tax_law_agent import TaxLawAgent
from datetime import datetime

convo_bp = Blueprint("conversation", __name__)

@convo_bp.get("/")
@jwt_required()
def get_conversations():
    user_id = int(get_jwt_identity())
    conversations = Conversation.query.filter_by(user_id=user_id).order_by(desc(Conversation.created_at)).all()
    
    results = []
    for conv in conversations:
        # Get messages for this conversation
        messages = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at).all()
        msg_list = [{
            "id": str(m.id),
            "text": m.text,
            "sender": m.sender,
            "timestamp": m.created_at.isoformat()
        } for m in messages]
        
        results.append({
            "id": str(conv.id),
            "timestamp": conv.created_at.isoformat(),
            "messages": msg_list
        })
        
    return jsonify(results)

@convo_bp.post("/start")
@jwt_required()
def start_conversation():
    user_id = int(get_jwt_identity())
    conv = Conversation(user_id=user_id)
    db.session.add(conv)
    db.session.commit()
    
    return jsonify({
        "id": str(conv.id),
        "timestamp": conv.created_at.isoformat(),
        "messages": []
    })

@convo_bp.post("/<int:conv_id>/message")
@jwt_required()
def add_message(conv_id):
    user_id = int(get_jwt_identity())
    # Verify ownership
    conv = Conversation.query.filter_by(id=conv_id, user_id=user_id).first()
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404

    data = request.get_json() or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Empty message"}), 400

    # 1. Save User Message
    user_msg = Message(conversation_id=conv_id, sender="user", text=text)
    db.session.add(user_msg)
    db.session.commit()

    # 2. Call Agent
    try:
        # Note: TaxLawAgent.ask might need to be async or handled via a task queue in production
        # For now, we call it synchronously
        agent_response = TaxLawAgent.ask(text)
        bot_text = agent_response.get("answer", "Xin lỗi, tôi không thể trả lời lúc này.")
    except Exception as e:
        print(f"Agent Error: {e}")
        bot_text = "Đã xảy ra lỗi khi xử lý yêu cầu của bạn."

    # 3. Save Bot Message
    bot_msg = Message(conversation_id=conv_id, sender="bot", text=bot_text)
    db.session.add(bot_msg)
    
    # Update conversation timestamp to bring it to top
    # Note: created_at is usually immutable, but for sorting purposes in this simple app we might want to update it
    # or add an updated_at field. The SQL schema has created_at. 
    # Let's just update created_at for now to keep it simple with existing schema
    conv.created_at = datetime.utcnow()
    
    db.session.commit()

    return jsonify({
        "userMessage": {
            "id": str(user_msg.id),
            "text": user_msg.text,
            "sender": user_msg.sender,
            "timestamp": user_msg.created_at.isoformat()
        },
        "botMessage": {
            "id": str(bot_msg.id),
            "text": bot_msg.text,
            "sender": bot_msg.sender,
            "timestamp": bot_msg.created_at.isoformat()
        }
    })

@convo_bp.delete("/<int:conv_id>")
@jwt_required()
def delete_conversation(conv_id):
    user_id = int(get_jwt_identity())
    conv = Conversation.query.filter_by(id=conv_id, user_id=user_id).first()
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404
        
    db.session.delete(conv)
    db.session.commit()
    return jsonify({"message": "Deleted successfully"})
