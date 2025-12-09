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
SOURCE_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "vector_database", "data")

# Data from vector_database/data - first 8 files
source_files = [
    "01_1998_QĐ-UB.txt",
    "01_1998_TT-LTBLĐTBXH-BTC-BKHĐT.txt",
    "01_1999_TCBĐ-TT.txt",
    "01_1999_TTLT-LĐTBXH-TCCP.txt",
    "01_2001_QĐ-BNN-TCCB.txt",
    "01_2001_TT-TGCP.txt",
    "01_2001_TTLT-BLĐTBXH-BTC.txt",
    "01_2002_CT-BLĐTBXH.txt",
]

# Status spread equally: 2 pending, 2 reviewed, 2 approved, 2 rejected
statuses = ["pending", "pending", "reviewed", "reviewed", "approved", "approved", "rejected", "rejected"]

documents_data = []
for idx, filename in enumerate(source_files):
    documents_data.append({
        "source_filename": filename,
        "title": filename.replace(".txt", "").replace("_", " "),
        "original_filename": filename,
        "stored_filename": f"seed_{idx}_{filename}",
        "mime_type": "text/plain",
        "status": statuses[idx]
    })

def seed_data():
    with app.app_context():
        print("Starting data seeding...")
        
        # 0. Clear vector database
        print("Clearing vector database...")
        try:
            from agent.vector_db import client, QDRANT_COLLECTION
            if client.collection_exists(QDRANT_COLLECTION):
                client.delete_collection(QDRANT_COLLECTION)
                print(f"Deleted collection '{QDRANT_COLLECTION}'")
            # Recreate collection
            from agent.vector_db import embeddings, QDRANT_COLLECTION
            from qdrant_client.http.models import Distance, VectorParams
            dummy_vec = embeddings.embed_query("test")
            vector_size = len(dummy_vec)
            client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            print(f"Recreated collection '{QDRANT_COLLECTION}'")
        except Exception as e:
            print(f"Warning: Could not clear vector database: {e}")
        
        # 1. Clean up existing data
        print("Cleaning up existing data...")
        # Order matters due to foreign keys
        db.session.execute(text("TRUNCATE TABLE retrieval_match, message, document_audit_log, conversation, documents, \"user\" RESTART IDENTITY CASCADE;"))
        db.session.commit()
        print("Data cleaned.")
        
        # 2. Create Users
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
        lawyer1 = User.query.filter_by(email="lawyer1@taxlaw.vn").first()
        lawyer2 = User.query.filter_by(email="lawyer2@taxlaw.vn").first()
        lawyer3 = User.query.filter_by(email="lawyer3@taxlaw.vn").first()
        normal_user = User.query.filter_by(email="user@taxlaw.vn").first()
        
        # 3. Copy files and Insert Documents
        print("Seeding documents...")
        import shutil
        
        # Ensure upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        for i, doc_data in enumerate(documents_data):
            # Source file path
            source_path = os.path.join(SOURCE_DATA_DIR, doc_data["source_filename"])
            
            if not os.path.exists(source_path):
                print(f"Warning: Source file {doc_data['source_filename']} not found. Skipping.")
                continue
            
            # Destination file path
            dest_path = os.path.join(UPLOAD_DIR, doc_data["stored_filename"])
            
            # Copy file
            shutil.copy2(source_path, dest_path)
            print(f"Copied {doc_data['source_filename']} to {dest_path}")
            
            # Get file size
            size_bytes = os.path.getsize(dest_path)

            # Distribute uploads among lawyers
            # 0,3,6 -> lawyer1
            # 1,4,7 -> lawyer2
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
                size_bytes=size_bytes,
                file_path=dest_path,
                upload_lawyer_id=uploader_id,
                assigned_lawyer_id=assigned_lawyer_id,
                status=doc_data["status"],
                in_vector_db=False,  # Will be set to True after indexing
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(new_doc)
            db.session.flush()  # Get the ID
            
            # Index approved documents
            if doc_data["status"] == "approved":
                print(f"Indexing approved document: {doc_data['title']}...")
                try:
                    from agent.document_service import DocumentService
                    
                    # Read file content
                    with open(dest_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Index to vector DB
                    DocumentService.index_document(content, new_doc.id)
                    
                    # Mark as indexed
                    new_doc.in_vector_db = True
                    print(f"Successfully indexed document ID {new_doc.id}")
                except Exception as e:
                    print(f"Failed to index document {doc_data['title']}: {e}")
            
            print(f"Added document: {doc_data['title']} (status: {doc_data['status']})")
        
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

        # # 5. Additional data for distribution chart
        # # We need more accurate, partial, and inaccurate matches to see a good chart
        # import random
        
        # queries = [
        #     ("Thuế suất thuế TNDN là bao nhiêu?", "Thuế suất phổ thông là 20%.", 0.92, "accurate"),
        #     ("Cách tính thuế TNCN?", "Thuế TNCN tính theo biểu lũy tiến từng phần.", 0.88, "accurate"),
        #     ("Khi nào phải quyết toán thuế?", "Hạn chót là ngày cuối cùng của tháng thứ 3 kể từ ngày kết thúc năm dương lịch.", 0.85, "accurate"),
            
        #     ("Thuế VAT hàng thiết yếu?", "Thông thường là 10%, một số mặt hàng 5%.", 0.75, "partial"),
        #     ("Quy định về hóa đơn điện tử?", "Bắt buộc sử dụng hóa đơn điện tử từ 1/7/2022.", 0.65, "partial"),
        #     ("Chi phí được trừ khi tính thuế?", "Các khoản chi thực tế phát sinh liên quan đến hoạt động sản xuất kinh doanh.", 0.60, "partial"),
        #     ("Đăng ký mã số thuế ở đâu?", "Tại cơ quan thuế quản lý trực tiếp.", 0.55, "partial"),
            
        #     ("Lịch nghỉ tết âm lịch?", "Không có thông tin trong văn bản thuế.", 0.45, "inaccurate"),
        #     ("Thời tiết Hà Nội hôm nay?", "Tôi chỉ trả lời về thuế.", 0.12, "inaccurate"),
        #     ("Giá vàng hôm nay?", "Tôi không biết.", 0.05, "inaccurate"),
        #     ("Ai là người giàu nhất Việt Nam?", "Không liên quan đến thuế.", 0.20, "inaccurate"),
        # ]
        
        # for q, a, score, status in queries:
        #     m = RetrievalMatch(
        #         conversation_id=conv.id,
        #         user_query=q,
        #         chatbot_response=a,
        #         retrieved_snippet=f"Snippet for {q}...",
        #         document_source="sample_doc.pdf",
        #         similarity_score=score,
        #         status=status,
        #         created_at=datetime.utcnow()
        #     )
        #     db.session.add(m)
        
        # db.session.commit()
        # print(f"Added {len(queries)} additional retrieval matches.")

        print("Data seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
