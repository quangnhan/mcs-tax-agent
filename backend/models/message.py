from datetime import datetime
from sqlalchemy.dialects.postgresql import ENUM
from extensions import db

sender_enum = ENUM("user", "bot", name="message_sender", create_type=False)

class Message(db.Model):
    __tablename__ = "message"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey("conversation.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender = db.Column(sender_enum, nullable=False)
    text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
