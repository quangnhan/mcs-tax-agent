from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db
from models.user import User
from models.document import Document
from models.document_audit_log import DocumentAuditLog

admin_bp = Blueprint("admin", __name__)

def require_admin():
    claims = get_jwt()
    return claims.get("role") == "admin"

@admin_bp.get("/users")
@jwt_required()
def list_users():
    if not require_admin():
        return jsonify({"error": "Permission denied"}), 403
    users = User.query.order_by(User.id).all()
    return jsonify([u.to_dict() for u in users])

@admin_bp.post("/assign")
@jwt_required()
def assign_lawyer():
    if not require_admin():
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json() or {}
    doc_id = data.get("document_id")
    lawyer_id = data.get("lawyer_id")

    doc = Document.query.get_or_404(doc_id)
    doc.assigned_lawyer_id = lawyer_id
    db.session.commit()

    return jsonify({"message": "Assigned"})

@admin_bp.get("/documents")
@jwt_required()
def admin_documents():
    if not require_admin():
        return jsonify({"error": "Permission denied"}), 403
    docs = Document.query.order_by(Document.created_at.desc()).all()
    return jsonify([d.to_row() for d in docs])

@admin_bp.get("/audit/<int:doc_id>")
@jwt_required()
def audit_for_document(doc_id):
    if not require_admin():
        return jsonify({"error": "Permission denied"}), 403
    logs = (
        DocumentAuditLog.query.filter_by(document_id=doc_id)
        .order_by(DocumentAuditLog.created_at.desc())
        .all()
    )
    return jsonify([l.to_row() for l in logs])
