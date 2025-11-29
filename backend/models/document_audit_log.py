from datetime import datetime
from sqlalchemy.dialects.postgresql import ENUM
from extensions import db

document_status = ENUM(
    "pending",
    "reviewed",
    "approved",
    "rejected",
    name="document_status",
    create_type=False,
)

class DocumentAuditLog(db.Model):
    __tablename__ = "document_audit_log"

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(
        db.Integer,
        db.ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    action = db.Column(db.Text, nullable=False)
    old_status = db.Column(document_status)
    new_status = db.Column(document_status)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    message = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")

    def to_row(self):
        return {
            "id": self.id,
            "action": self.action,
            "old_status": self.old_status,
            "new_status": self.new_status,
            "user_id": self.user_id,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
