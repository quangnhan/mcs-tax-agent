import os
from datetime import datetime
from app import app
from extensions import db
from models.user import User
from models.document import Document
from models.conversation import Conversation
from models.message import Message
from models.retrieval_match import RetrievalMatch
from models.document_audit_log import DocumentAuditLog
from werkzeug.security import generate_password_hash
from sqlalchemy import text

# Define the base path for uploaded documents
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploaded_docs")

# Data from SQL dump
documents_data = [
    {
        "title": "2_TÀI CHÍNH VÀ QUẢN LÝ TÀI CHÍNH NÂNG CAO",
        "original_filename": "2_TÀI CHÍNH VÀ QUẢN LÝ TÀI CHÍNH NÂNG CAO.pdf",
        "stored_filename": "b8d8ad400f99431bbf6d9a7df1cfa728_2_TÀI CHÍNH VÀ QUẢN LÝ TÀI CHÍNH NÂNG CAO.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 1674844,
        "status": "pending"
    },
    {
        "title": "3_THUẾ VÀ QUẢN LÝ THUẾ NÂNG CAO",
        "original_filename": "3_THUẾ VÀ QUẢN LÝ THUẾ NÂNG CAO.pdf",
        "stored_filename": "46ae88b4f0d24a80812449d2046de69e_3_THUẾ VÀ QUẢN LÝ THUẾ NÂNG CAO.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 3731551,
        "status": "pending"
    },
    {
        "title": "4_KẾ TOÁN TÀI CHÍNH, KẾ TOÁN QUẢN TRỊ NÂNG CAO",
        "original_filename": "4_KẾ TOÁN TÀI CHÍNH, KẾ TOÁN QUẢN TRỊ NÂNG CAO.pdf",
        "stored_filename": "acd9fb54529943edabe233a3efac887e_4_KẾ TOÁN TÀI CHÍNH, KẾ TOÁN QUẢN TRỊ NÂNG CAO.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 3188286,
        "status": "pending"
    },
    {
        "title": "1_PHÁP LUẬT VỀ KINH TẾ VÀ LUẬT DOANH NGHIỆP",
        "original_filename": "1_PHÁP LUẬT VỀ KINH TẾ VÀ LUẬT DOANH NGHIỆP.pdf",
        "stored_filename": "38925197063a441c8875f8959e16fdf7_1_PHÁP LUẬT VỀ KINH TẾ VÀ LUẬT DOANH NGHIỆP.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 1599136,
        "status": "approved"
    },
    {
        "title": "7_NGOẠI NGỮ (TIẾNG ANH)",
        "original_filename": "7_NGOẠI NGỮ (TIẾNG ANH).pdf",
        "stored_filename": "96c71af557854b5085a22eaed3e8fcea_7_NGOẠI NGỮ (TIẾNG ANH).pdf",
        "mime_type": "application/pdf",
        "size_bytes": 597709,
        "status": "rejected"
    },
    {
        "title": "6_PHÂN TÍCH HOẠT ĐỘNG TÀI CHÍNH NÂNG CAO",
        "original_filename": "6_PHÂN TÍCH HOẠT ĐỘNG TÀI CHÍNH NÂNG CAO.pdf",
        "stored_filename": "934220d83b5c4b31abfd52928da19ea3_6_PHÂN TÍCH HOẠT ĐỘNG TÀI CHÍNH NÂNG CAO.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 1722514,
        "status": "approved"
    },
    {
        "title": "5_KIỂM TOÁN VÀ DỊCH VỤ ĐẢM BẢO NÂNG CAO",
        "original_filename": "5_KIỂM TOÁN VÀ DỊCH VỤ ĐẢM BẢO NÂNG CAO.pdf",
        "stored_filename": "21c9a1cfd4d6402bbbc8cc4f44a52348_5_KIỂM TOÁN VÀ DỊCH VỤ ĐẢM BẢO NÂNG CAO.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 3418924,
        "status": "reviewed"
    }
]

def seed_data():
    with app.app_context():
        print("Starting data seeding...")
        
        # 0. Clean up existing data
        print("Cleaning up existing data...")
        # Order matters due to foreign keys
        db.session.execute(text("TRUNCATE TABLE retrieval_match, message, document_audit_log, conversation, documents, \"user\" RESTART IDENTITY CASCADE;"))
        db.session.commit()
        print("Data cleaned.")
        
        # 1. Create Users
        print("Creating users...")
        
        # Admin
        admin = User(
            email="admin@taxlaw.vn",
            password_hash=generate_password_hash("admin@123"),
            name="Administrator",
            role="admin"
        )
        db.session.add(admin)
        
        # Other credentials
        CREDENTIALS = [
            { "username": 'user', "password": 'user123', "role": 'user' },
            { "username": 'lawyer1', "password": 'lawyer123', "role": 'lawyer' },
            { "username": 'lawyer2', "password": 'lawyer123', "role": 'lawyer' },
            { "username": 'lawyer3', "password": 'lawyer123', "role": 'lawyer' },
            { "username": 'scientist', "password": 'scientist123', "role": 'data_scientist' },
        ]

        created_users = {}
        
        for creds in CREDENTIALS:
            username = creds["username"]
            password = creds["password"]
            email = f"{username}@taxlaw.vn"
            
            db_role = creds["role"]
            
            new_user = User(
                email=email,
                password_hash=generate_password_hash(password),
                name=username.capitalize(),
                role=db_role
            )
            db.session.add(new_user)
            created_users[db_role] = new_user
            print(f"Added user: {email} with role {db_role}")
            
        db.session.commit()
        
        # Need to refresh objects to get IDs
        # admin is already bound, others in created_users dictionary
        # Explicitly query if needed or trust session refresh
        lawyer1 = User.query.filter_by(email="lawyer1@taxlaw.vn").first()
        lawyer2 = User.query.filter_by(email="lawyer2@taxlaw.vn").first()
        lawyer3 = User.query.filter_by(email="lawyer3@taxlaw.vn").first()
        normal_user = User.query.filter_by(email="user@taxlaw.vn").first()
        
        # 2. Insert Documents
        print("Seeding documents...")
        for i, doc_data in enumerate(documents_data):
            # Construct correct absolute file path
            file_path = os.path.join(UPLOAD_DIR, doc_data["stored_filename"])
            
            # Check if file actually exists on disk
            if not os.path.exists(file_path):
                print(f"Warning: File {doc_data['stored_filename']} not found in {UPLOAD_DIR}. Skipping.")
                continue

            # Distribute uploads among lawyers
            # 0,3,6 -> lawyer1
            # 1,4 -> lawyer2
            # 2,5 -> lawyer3
            if i % 3 == 0:
                uploader_id = lawyer1.id if lawyer1 else admin.id
            elif i % 3 == 1:
                uploader_id = lawyer2.id if lawyer2 else admin.id
            else:
                uploader_id = lawyer3.id if lawyer3 else admin.id
            
            # REQUIREMENT: second lawyer's documents (lawyer2) are assigned to the first lawyer (lawyer1)
            assigned_lawyer_id = None
            if uploader_id == (lawyer2.id if lawyer2 else -1):
                assigned_lawyer_id = lawyer1.id if lawyer1 else None

            new_doc = Document(
                title=doc_data["title"],
                original_filename=doc_data["original_filename"],
                stored_filename=doc_data["stored_filename"],
                mime_type=doc_data["mime_type"],
                size_bytes=doc_data["size_bytes"],
                file_path=file_path,
                upload_lawyer_id=uploader_id,
                assigned_lawyer_id=assigned_lawyer_id,
                status=doc_data["status"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(new_doc)
            print(f"Added document: {doc_data['title']}")
        
        db.session.commit()

        # 3. Create Sample Conversation
        print("Seeding conversations...")
        # Use normal user if available, else admin
        conv_user_id = normal_user.id if normal_user else admin.id
        
        conv = Conversation(user_id=conv_user_id)
        db.session.add(conv)
        db.session.commit()
        
        # Add messages
        msgs = [
            Message(conversation_id=conv.id, sender="user", text="Xin chào, tôi cần tìm hiểu về luật thuế thu nhập cá nhân."),
            Message(conversation_id=conv.id, sender="bot", text="Chào bạn, tôi có thể giúp gì cho bạn về luật thuế thu nhập cá nhân?"),
            Message(conversation_id=conv.id, sender="user", text="Mức giảm trừ gia cảnh hiện nay là bao nhiêu?"),
            Message(conversation_id=conv.id, sender="bot", text="Hiện nay, mức giảm trừ gia cảnh là 11 triệu đồng/tháng đối với người nộp thuế và 4,4 triệu đồng/tháng đối với mỗi người phụ thuộc.")
        ]
        db.session.add_all(msgs)
        db.session.commit()
        print("Added sample conversation and messages.")

        # 4. Create Sample Retrieval Match
        print("Seeding retrieval matches...")
        match = RetrievalMatch(
            conversation_id=conv.id,
            user_query="Mức giảm trừ gia cảnh hiện nay là bao nhiêu?",
            chatbot_response="Hiện nay, mức giảm trừ gia cảnh là 11 triệu đồng/tháng đối với người nộp thuế và 4,4 triệu đồng/tháng đối với mỗi người phụ thuộc.",
            retrieved_snippet="Điều 1. Mức giảm trừ gia cảnh\n1. Mức giảm trừ đối với đối tượng nộp thuế là 11 triệu đồng/tháng (132 triệu đồng/năm);\n2. Mức giảm trừ đối với mỗi người phụ thuộc là 4,4 triệu đồng/tháng.",
            document_source="Nghị quyết 954/2020/UBTVQH14",
            similarity_score=0.95,
            status="accurate",
            created_at=datetime.utcnow()
        )
        db.session.add(match)
        db.session.commit()
        print("Added sample retrieval match.")

        print("Data seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
