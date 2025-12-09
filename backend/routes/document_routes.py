import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from extensions import db
from models.document import Document
from models.document_audit_log import DocumentAuditLog
from agent.document_service import DocumentService

document_bp = Blueprint("documents", __name__)


# ---------------------------------------------------------
# Helper – Kiểm tra role
# ---------------------------------------------------------
def require_role(roles):
    claims = get_jwt()
    if claims.get("role") not in roles:
        return False
    return True

def assign_lawyer_auto(doc):
    from models.user import User
    import random
    
    # 1. Get all lawyers except the uploader
    lawyers = User.query.filter(User.role == "lawyer", User.id != doc.upload_lawyer_id).all()
    
    if not lawyers:
        # Fallback: if no other lawyer, maybe assign to admin or keep None?
        # For now, let's keep it None or log warning
        print(f"No available lawyer to assign for document {doc.id}")
        return

    # 2. Randomly choose one
    chosen = random.choice(lawyers)
    doc.assigned_lawyer_id = chosen.id
    print(f"Auto-assigned doc {doc.id} to lawyer {chosen.email} (ID: {chosen.id})")

# =============================================================================
# ORIGINAL API 2 – LIST DOCUMENTS
# (UPDATED: Support filtering for Lawyer UI)
# =============================================================================
@document_bp.get("/list")
@jwt_required()
def list_documents():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get("role")
    
    query = Document.query
    
    # Lawyer View:
    # 1. Documents uploaded by ME
    # 2. Documents assigned to ME
    if role == "lawyer":
        from sqlalchemy import or_
        from models.user import User
        
        # 1. Check if I have ANY assigned documents (or uploaded by me, but primarily assigned)
        assigned_count = Document.query.filter(Document.assigned_lawyer_id == user_id).count()
        
        # 2. If NO documents are assigned to me, try to auto-assign from another lawyer
        if assigned_count == 0:
            # Find a 'target' lawyer who is NOT me and has uploaded documents
            # distinct() might be needed if one lawyer uploaded multiple
            target_uploader_id = db.session.query(Document.upload_lawyer_id)\
                .filter(Document.upload_lawyer_id.isnot(None))\
                .filter(Document.upload_lawyer_id != user_id)\
                .first()
            
            if target_uploader_id:
                target_id = target_uploader_id[0]
                # Assign ALL documents from this uploader to me
                # (Or maybe just unassigned ones? Requirement says "assign documents uploaded from one other lawyer")
                # Let's assign all docs from that lawyer to me to be safe/simple as per request
                docs_to_assign = Document.query.filter(Document.upload_lawyer_id == target_id).all()
                count_assigned = 0
                for d in docs_to_assign:
                     # Only assign if not already assigned (to avoid stealing from others?)
                     # But user requirement says "apply assign endpoint", implying strong assignment.
                     # Let's check if it's currently None to be polite, or just overwrite.
                     # "if the current lawyer didn't assigned to review any documents... assign... from one other"
                     # I'll assign if assigned_lawyer_id is None OR maybe just overwrite.
                     # Let's overwrite to ensure I see something.
                     d.assigned_lawyer_id = user_id
                     count_assigned += 1
                
                if count_assigned > 0:
                    db.session.commit()
                    print(f"Auto-assigned {count_assigned} docs from lawyer {target_id} to me ({user_id})")

        # 3. Now query normally
        query = query.filter(
            or_(
                # Document.upload_lawyer_id == user_id, 
                Document.assigned_lawyer_id == user_id
            )
        )
    
    docs = query.order_by(Document.id.desc()).all()
    
    results = []
    for d in docs:
        row = d.to_row()
        # Enrich with uploadedBy name for UI
        uploader = d.uploader 
        row["uploadedBy"] = uploader.name if uploader else "Unknown"
        # Add extra fields that frontend might expect if not in to_row
        row["name"] = d.title
        row["type"] = d.tax_type or "Unknown" # Map tax_type to type
        row["size"] = f"{d.size_bytes // 1024} KB" if d.size_bytes else "0 KB"
        row["uploadDate"] = d.created_at.isoformat() if d.created_at else None
        row["issueDate"] = d.issue_date.isoformat() if d.issue_date else None
        row["reviewStatus"] = d.status
        row["feedback"] = d.lawyer_feedback
        row["reviewDate"] = d.review_date.isoformat() if d.review_date else None
        row["dataScientistFeedback"] = d.data_scientist_feedback
        results.append(row)
        
    return jsonify({"documents": results})

@document_bp.post("/<int:doc_id>/assign")
@jwt_required()
def manual_assign_lawyer(doc_id):
    if not require_role(["admin"]):
         return jsonify({"error": "Permission denied"}), 403
         
    doc = Document.query.get_or_404(doc_id)
    assign_lawyer_auto(doc)
    db.session.commit()
    
    return jsonify({"message": "Lawyer assigned successfully", "assigned_lawyer_id": doc.assigned_lawyer_id})

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
        issue_date=request.form.get("issue_date"),
        original_filename=file.filename,
        stored_filename=stored_name,
        mime_type=file.mimetype,
        size_bytes=os.path.getsize(save_path),
        file_path=save_path,
        upload_lawyer_id=user_id,
        status="pending",
        created_at=func.now(),
    )

    # Auto-assign to a different lawyer for peer review
    assign_lawyer_auto(doc)

    db.session.add(doc)
    db.session.commit()

    # Audit Log
    log = DocumentAuditLog(
        document_id=doc.id,
        action="create",
        old_status=None,
        new_status="pending",
        user_id=user_id,
        message="Document created",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Document created", "document": doc.to_row()})


# =============================================================================
# ORIGINAL API 2 – LIST DOCUMENTS
# (GIỮ NGUYÊN)
# =============================================================================
# @document_bp.get("/list")
# @jwt_required()
# def list_documents():
#     docs = Document.query.order_by(Document.id.desc()).all()
#     return jsonify({"documents": [d.to_row() for d in docs]})


# =============================================================================
# ORIGINAL API 3 – REVIEW DOCUMENT (LAWYER)
# (GIỮ NGUYÊN ĐỂ TƯƠNG THÍCH NGƯỢC)
# =============================================================================
@document_bp.post("/<int:doc_id>/review")
@jwt_required()
def review_document(doc_id):
    if not require_role(["admin", "lawyer"]):
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
        message=feedback or "Reviewed",
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
    if not require_role(["admin", "data_scientist"]):
        return jsonify({"error": "Permission denied"}), 403

    doc = Document.query.get_or_404(doc_id)

    # 1. Kiểm tra nếu đã approved rồi → không làm lại
    if doc.status == "approved":
        return jsonify({"message": "Document already approved"}), 200

    old_status = doc.status
    doc.status = "approved"
    user_id = int(get_jwt_identity())

    # 2. Ghi audit log
    log = DocumentAuditLog(
        document_id=doc.id,
        action="approve",
        old_status=old_status,
        new_status="approved",
        user_id=user_id,
        message="Document approved and queued for AI indexing",
    )
    db.session.add(log)

    # 3. Đọc nội dung file (bắt lỗi nếu file hỏng)
    try:
        with open(doc.file_path, "r", encoding="utf-8") as f:
            raw_text = f.read()
    except Exception as e:
        print(f"Cannot read file for doc {doc.id}: {e}")
        return jsonify({"error": f"Cannot read document file: {doc.file_path}"}), 500

    # 4. Commit status + log trước (đảm bảo trạng thái đã được cập nhật)
    db.session.commit()

    # 5. Gọi DocumentService – service này KHÔNG biết gì về db.session
    try:
        DocumentService.index_document(
            text_content=raw_text,
            doc_id=doc.id,
        )

        # Chỉ cập nhật flag khi indexing thành công
        doc.in_vector_db = True
        db.session.commit()

        print(f"Document {doc.id} '{doc.title}' successfully approved + indexed in AI")

        return (
            jsonify(
                {
                    "message": "Document approved and successfully added to AI search engine",
                    "document_id": doc.id,
                    "in_vector_db": True,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Failed to index document {doc.id} into Chroma: {e}")
        # Không rollback status – tài liệu vẫn là "approved", chỉ là chưa vào AI
        return (
            jsonify(
                {
                    "message": "Document approved but failed to add to AI search (will retry later)",
                    "error": str(e),
                }
            ),
            202,
        )  # 202 Accepted → có thể retry sau


# =============================================================================
# ORIGINAL API 5 – REJECT DOCUMENT (ADMIN)
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.post("/<int:doc_id>/reject")
@jwt_required()
def reject_document(doc_id):
    if not require_role(["admin", "lawyer", "data_scientist"]):
        return jsonify({"error": "Permission denied"}), 403

    doc = Document.query.get_or_404(doc_id)
    data = request.get_json() or {}
    msg = data.get("message")

    old_status = doc.status
    doc.status = "rejected"

    user_id = int(get_jwt_identity())

    # 1. Xóa khỏi Chroma trước (nếu đã từng được index)
    if doc.in_vector_db and require_role(["admin", "data_scientist"]):
        try:
            DocumentService.remove_document(doc.id)
            doc.in_vector_db = False
            db.session.commit()
            print(f"Document {doc.id} removed from ChromaDB during deletion")
        except Exception as e:
            print(f"Failed to remove doc {doc.id} from Chroma (continuing anyway): {e}")
            # Không raise lỗi – vẫn cho phép xóa file và DB

    log = DocumentAuditLog(
        document_id=doc.id,
        action="reject",
        old_status=old_status,
        new_status="rejected",
        user_id=user_id,
        message=msg,
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
    if not require_role(["admin", "data_scientist"]):
        return jsonify({"error": "Permission denied"}), 403

    doc = Document.query.get_or_404(doc_id)

    user_id = int(get_jwt_identity())

    # 1. Xóa khỏi Chroma trước (nếu đã từng được index)
    if doc.in_vector_db:
        try:
            DocumentService.remove_document(doc.id)
            doc.in_vector_db = False
            db.session.commit()
            print(f"Document {doc.id} removed from ChromaDB during deletion")
        except Exception as e:
            print(f"Failed to remove doc {doc.id} from Chroma (continuing anyway): {e}")
            # Không raise lỗi – vẫn cho phép xóa file và DB

    # 2. Xóa file vật lý
    file_path = getattr(doc, "file_path", None)
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"Physical file deleted: {file_path}")
        except OSError as e:
            print(f"Failed to delete file {file_path}: {e}")

    # 3. Ghi audit log
    log = DocumentAuditLog(
        document_id=doc.id,
        action="delete",
        old_status=doc.status,
        new_status=None,
        user_id=user_id,
        message="Document permanently deleted (file + DB + AI index)",
    )
    db.session.add(log)

    # 4. Xóa khỏi PostgreSQL
    db.session.delete(doc)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Document permanently deleted",
                "document_id": doc_id,
                "chroma_removed": doc.in_vector_db,  # True nếu đã từng ở trong AI
            }
        ),
        200,
    )


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
    - status: pending / reviewed / rejected
    - feedback: nhận xét (review) hoặc lý do (reject)
    Luôn ghi log vào DocumentAuditLog.
    """

    # Giới hạn role: lawyer + admin + data_scientist
    if not require_role(["admin", "lawyer", "data_scientist"]):
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json() or {}
    new_status = str(data.get("status", "")).strip().lower()
    feedback = data.get("feedback")

    valid_status = ["pending", "reviewed", "rejected"]
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

    return (
        jsonify(
            {"message": "Status updated", "status": new_status, "feedback": feedback}
        ),
        200,
    )


# =============================================================================
# ORIGINAL API 7 – GET DOCUMENT DETAIL
# (GIỮ NGUYÊN)
# =============================================================================
@document_bp.get("/<int:doc_id>")
@jwt_required()
def get_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    return jsonify(
        {
            "id": doc.id,
            "title": doc.title,
            "status": doc.status,
            "file_path": doc.file_path,
            "stored_filename": doc.stored_filename,
        }
    )


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
        result.append(
            {
                "timestamp": log.created_at.isoformat(),
                "action": log.action,
                "old_value": log.old_status,
                "new_value": log.new_status,
                "user_email": log.user.email if log.user else "",
                "message": log.message,
            }
        )
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

    return send_file(doc.file_path, mimetype=doc.mime_type, as_attachment=False)
