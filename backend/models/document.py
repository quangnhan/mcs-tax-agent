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

class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    tax_type = db.Column(db.String(50))
    issue_date = db.Column(db.Date)

    original_filename = db.Column(db.Text)
    stored_filename = db.Column(db.Text)
    mime_type = db.Column(db.Text)
    size_bytes = db.Column(db.BigInteger)
    file_path = db.Column(db.Text)

    upload_lawyer_id = db.Column(
        db.Integer, db.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    assigned_lawyer_id = db.Column(
        db.Integer, db.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )

    status = db.Column(document_status, default="pending")
    lawyer_feedback = db.Column(db.Text)
    review_date = db.Column(db.DateTime)
    data_scientist_feedback = db.Column(db.Text)

    in_vector_db = db.Column(db.Boolean, default=False)
    applied_to_vector = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    audit_logs = db.relationship(
        "DocumentAuditLog",
        backref="document",
        cascade="all, delete-orphan",
    )

    def to_row(self):
        return {
            "id": self.id,
            "title": self.title,
            "status": self.status,
            "tax_type": self.tax_type,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "upload_lawyer_id": self.upload_lawyer_id,
            "assigned_lawyer_id": self.assigned_lawyer_id,
            "in_vector_db": self.in_vector_db,
            "applied_to_vector": self.applied_to_vector,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
