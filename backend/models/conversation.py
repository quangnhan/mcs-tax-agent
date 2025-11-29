from datetime import datetime
from extensions import db

class Conversation(db.Model):
    __tablename__ = "conversation"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    messages = db.relationship(
        "Message", backref="conversation", cascade="all, delete-orphan"
    )
    retrievals = db.relationship(
        "RetrievalMatch", backref="conversation", cascade="all, delete-orphan"
    )
