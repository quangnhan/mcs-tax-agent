from datetime import datetime
from sqlalchemy.dialects.postgresql import ENUM
from extensions import db

accuracy_enum = ENUM(
    "accurate",
    "partial",
    "inaccurate",
    name="retrieval_accuracy",
    create_type=False,
)

class RetrievalMatch(db.Model):
    __tablename__ = "retrieval_match"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey("conversation.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_query = db.Column(db.Text)
    chatbot_response = db.Column(db.Text)
    retrieved_snippet = db.Column(db.Text)
    document_source = db.Column(db.Text)

    similarity_score = db.Column(db.Float)
    status = db.Column(accuracy_enum)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
