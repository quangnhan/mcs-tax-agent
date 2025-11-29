import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from extensions import db
from models.document import Document
from models.document_audit_log import DocumentAuditLog

document_bp = Blueprint("documents", __name__)


# ---------------------------------------------------------
# Helper – Kiểm tra role
# ---------------------------------------------------------
def require_role(roles):
    claims = get_jwt()
    if claims.get("role") not in roles:
        return False
    return True


# =============================================================================
# ORIGINAL API 1 – CREATE DOCUMENT
# (GIỮ NGUYÊN THEO SOURCE CŨ - KHÔNG XOÁ)
# =============================================================================
@document_bp.post("/create")
@jwt_required()
def create_document():
    if not require_role(["admin", "lawyer"]):
        return jsonify({"error": "Permission denied"}), 403

    title = request.form.get("title")
    file = request.files.get("file")

    if not title or not file:
        return jsonify({"error": "Missing title or file"}), 400

    # Lưu file vào thư mục UPLOAD_FOLDER
    stored_name = f"{uuid.uuid4().hex}_{file.filename}"
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)

    save_path = os.path.join(upload_folder, stored_name)
    file.save(save_path)

    user_id = int(get_jwt_identity())

    # Ghi DB
    doc = Document(
        title=title,
        description=request.form.get("description"),
        tax_type=request.form.get("tax_type"),
        original_filename=file.filename,
        stored_filename=stored_name,
        mime_type=file.mimetype,
        size_bytes=os.path.getsize(save_path),
        file_path=save_path,
        upload_lawyer_id=user_id,
        status="pending",
        created_at=func.now(),
    )

    db.session.add(doc)
    db.session.commit()

    # Audit Log
    log = DocumentAuditLog(
        document_id=doc.id,
        action="create",
        old_status=None,
        new_status="pending",
        user_id=user_id,
        message="Document created"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Document created", "document": doc.to_row()})


# =============================================================================
# ORIGINAL API 2 – LIST DOCUMENTS
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.get("/list")
@jwt_required()
def list_documents():
    docs = Document.query.order_by(Document.id.desc()).all()
    return jsonify({"documents": [d.to_row() for d in docs]})


# =============================================================================
# ORIGINAL API 3 – REVIEW DOCUMENT (LAWYER)
# (GIỮ NGUYÊN ĐỂ TƯƠNG THÍCH NGƯỢC)
# =============================================================================
@document_bp.post("/<int:doc_id>/review")
@jwt_required()
def review_document(doc_id):
    if not require_role(["lawyer"]):
        return jsonify({"error": "Permission denied"}), 403

    doc = Document.query.get_or_404(doc_id)
    data = request.get_json() or {}
    feedback = data.get("feedback")

    old_status = doc.status
    doc.status = "reviewed"
    doc.lawyer_feedback = feedback
    doc.review_date = func.now()

    user_id = int(get_jwt_identity())

    log = DocumentAuditLog(
        document_id=doc.id,
        action="review",
        old_status=old_status,
        new_status="reviewed",
        user_id=user_id,
        message=feedback or "Reviewed"
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Reviewed"})


# =============================================================================
# ORIGINAL API 4 – APPROVE DOCUMENT (ADMIN)
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.post("/<int:doc_id>/approve")
@jwt_required()
def approve_document(doc_id):
    if not require_role(["admin"]):
        return jsonify({"error": "Permission denied"}), 403

    doc = Document.query.get_or_404(doc_id)
    old_status = doc.status
    doc.status = "approved"

    user_id = int(get_jwt_identity())

    log = DocumentAuditLog(
        document_id=doc.id,
        action="approve",
        old_status=old_status,
        new_status="approved",
        user_id=user_id,
        message="Approved"
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Approved"})


# =============================================================================
# ORIGINAL API 5 – REJECT DOCUMENT (ADMIN)
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.post("/<int:doc_id>/reject")
@jwt_required()
def reject_document(doc_id):
    if not require_role(["admin"]):
        return jsonify({"error": "Permission denied"}), 403

    doc = Document.query.get_or_404(doc_id)
    data = request.get_json() or {}
    msg = data.get("message")

    old_status = doc.status
    doc.status = "rejected"

    user_id = int(get_jwt_identity())

    log = DocumentAuditLog(
        document_id=doc.id,
        action="reject",
        old_status=old_status,
        new_status="rejected",
        user_id=user_id,
        message=msg
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Rejected"})


# =============================================================================
# ORIGINAL API 6 – DELETE DOCUMENT (ADMIN)
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.delete("/<int:doc_id>")
@jwt_required()
def delete_document(doc_id):
    if not require_role(["admin"]):
        return jsonify({"error": "Permission denied"}), 403

    doc = Document.query.get_or_404(doc_id)

    # Xóa file vật lý
    file_path = getattr(doc, "file_path", None)
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    user_id = int(get_jwt_identity())

    log = DocumentAuditLog(
        document_id=doc.id,
        action="delete",
        old_status=doc.status,
        new_status=None,
        user_id=user_id,
        message="Document deleted"
    )

    db.session.add(log)
    db.session.delete(doc)
    db.session.commit()

    return jsonify({"message": "Deleted"})


# =============================================================================
# 🔥 NEW API – UNIFIED STATUS UPDATE
# KHÔNG XOÁ CODE CŨ, CHỈ BỔ SUNG
# FE DROPDOWN SẼ GỌI API NÀY
# =============================================================================
@document_bp.patch("/<int:doc_id>/status")
@jwt_required()
def update_document_status(doc_id):
    """
    API cập nhật trạng thái tài liệu:
    - status: pending / reviewed / approved / rejected
    - feedback: nhận xét (review) hoặc lý do (reject)
    Luôn ghi log vào DocumentAuditLog.
    """

    # Giới hạn role: lawyer + admin
    if not require_role(["admin", "lawyer"]):
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json() or {}
    new_status = str(data.get("status", "")).strip().lower()
    feedback = data.get("feedback")

    valid_status = ["pending", "reviewed", "approved", "rejected"]
    if new_status not in valid_status:
        return jsonify({"error": "Invalid status"}), 400

    doc = Document.query.get_or_404(doc_id)
    old_status = doc.status
    user_id = int(get_jwt_identity())

    # Không thay đổi gì
    if old_status == new_status:
        return jsonify({"message": "No change", "status": old_status}), 200

    # Cập nhật trạng thái
    doc.status = new_status
    doc.updated_at = func.now()

    # REVIEW → lawyer_feedback + review_date
    if new_status == "reviewed":
        if hasattr(doc, "lawyer_feedback") and feedback:
            doc.lawyer_feedback = feedback
        if hasattr(doc, "review_date"):
            doc.review_date = func.now()

    # REJECT → lưu feedback như lý do từ chối
    if new_status == "rejected":
        if hasattr(doc, "lawyer_feedback") and feedback:
            doc.lawyer_feedback = feedback

    # APPROVE → không cần thêm trường, chỉ đổi status

    db.session.commit()

    # Audit Log
    msg = f"Status changed from {old_status} → {new_status}"
    if feedback:
        msg += f" | feedback: {feedback}"

    log = DocumentAuditLog(
        document_id=doc.id,
        action="status_change",
        old_status=old_status,
        new_status=new_status,
        user_id=user_id,
        message=msg,
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Status updated",
        "status": new_status,
        "feedback": feedback
    }), 200


# =============================================================================
# ORIGINAL API 7 – GET DOCUMENT DETAIL
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.get("/<int:doc_id>")
@jwt_required()
def get_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    return jsonify({
        "id": doc.id,
        "title": doc.title,
        "status": doc.status,
        "file_path": doc.file_path,
        "stored_filename": doc.stored_filename,
    })


# =============================================================================
# ORIGINAL API 8 – GET AUDIT LOG
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.get("/<int:doc_id>/audit")
@jwt_required()
def get_document_audit(doc_id):
    logs = DocumentAuditLog.query.filter_by(document_id=doc_id).all()
    result = []
    for log in logs:
        result.append({
            "timestamp": log.created_at.isoformat(),
            "action": log.action,
            "old_value": log.old_status,
            "new_value": log.new_status,
            "user_email": log.user.email if log.user else "",
            "message": log.message
        })
    return jsonify(result)


# =============================================================================
# ORIGINAL API 9 – VIEW FILE
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.get("/<int:doc_id>/file")
def view_document_file(doc_id):
    doc = Document.query.get_or_404(doc_id)

    if not doc.file_path or not os.path.exists(doc.file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(
        doc.file_path,
        mimetype="application/pdf",
        as_attachment=False
    )
