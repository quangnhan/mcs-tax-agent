from datetime import datetime
from sqlalchemy.dialects.postgresql import ENUM
from extensions import db

role_enum = ENUM(
    "admin",
    "user",
    "lawyer",
    "data_scientist",
    name="role_enum",
    create_type=False,
)

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    name = db.Column(db.Text)
    role = db.Column(role_enum, nullable=False, default="user")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    uploaded_documents = db.relationship(
        "Document",
        foreign_keys="Document.upload_lawyer_id",
        backref="uploader",
    )
    assigned_documents = db.relationship(
        "Document",
        foreign_keys="Document.assigned_lawyer_id",
        backref="assignee",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
