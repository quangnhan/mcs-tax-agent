
# 📘 TaxLaw Project (27112025_OK)

## 1. Giới thiệu dự án
TaxLaw Project là hệ thống quản lý – lưu trữ – xét duyệt – truy vết tài liệu pháp lý dành cho các tổ chức tư vấn thuế – pháp lý.

Hệ thống bao gồm:
- Backend: Flask, PostgreSQL, SQLAlchemy, JWT
- Frontend: HTML + Bootstrap + JavaScript thuần
- Document Storage: Upload PDF
- Document Workflow: pending → reviewed → approved / rejected
- Audit Log Tracking
- User Role Management (admin, lawyer)
- Retrieval API (AI-ready)
- Conversation API
- Swagger API Documentation

---

## 2. Chạy Backend

### 2.1. Tạo môi trường ảo
```
cd backend
python -m venv .venv
```

### 2.2. Kích hoạt môi trường ảo
Windows:
```
.venv\Scripts\activate
```

Mac/Linux:
```
source .venv/bin/activate
```

### 2.3. Cài đặt thư viện
```
pip install -r requirements.txt
```

### 2.4. Khởi tạo Database (KHÔNG cần create_admin.py)
```
python init_db.py
```

Script này sẽ tự động:
- Tạo database `taxlaw_db` nếu chưa có
- Tạo toàn bộ bảng
- Tạo tài khoản:
  - email: admin@taxlaw.vn  
  - password: admin@123  
  - role: admin  

### 2.5. Chạy Backend
```
python app.py
```

Backend chạy tại:
```
http://127.0.0.1:5000
```

---

## 3. Chạy Frontend

### 3.1. Dùng server đơn giản của Python
```
cd frontend
python -m http.server 8000
```

### 3.2. Truy cập UI
```
http://localhost:8000
```

---

## 4. Swagger API Documentation

Mở:
```
http://127.0.0.1:5000/swagger
```

### 4.1. Lấy token
```
POST /auth/login
{
  "email": "admin@taxlaw.vn",
  "password": "admin@123"
}
```

### 4.2. Nhập token vào Swagger
Nhấn **Authorize** → nhập:
```
Bearer <token>
```

Sau đó có thể test toàn bộ API.

---

## 5. Database Init (init_db.py)

### Script thực hiện:
- Kết nối PostgreSQL
- Tạo database `taxlaw_db`
- Tạo bảng: users, documents, document_audit_log, conversations, messages, retrieval_match
- Tạo ENUM `document_status`
- Seed user admin mặc định

### Không cần chạy:
```
create_admin.py
```

---

## 6. Modules & Chức năng

### 🔐 Auth Module
- Đăng nhập lấy JWT Token
- Lưu user info (id, role)

### 📄 Document Module
- Upload tài liệu PDF
- Danh sách tài liệu
- Xem chi tiết
- Xem nội dung PDF
- Audit log theo tài liệu
- Quy trình:
  - pending → reviewed (lawyer)
  - reviewed → approved/rejected (admin)
- Xóa tài liệu

### 👨‍💼 Admin Module
- Danh sách người dùng trong hệ thống

### 🔍 Retrieval Module
- Truy vấn tìm tài liệu (AI-ready)
- Lưu log truy vấn

### 💬 Conversation Module
- Gửi message
- Lấy danh sách messages theo conversation

### 🖥 Frontend UI
- Login page
- Dashboard + Charts
- Document list + status actions
- Document detail + PDF viewer
- Audit log viewer
- User list (admin)

---

## 7. Cấu trúc thư mục

```
taxlaw_project/
│── backend/
│   ├── app.py
│   ├── config.py
│   ├── init_db.py
│   ├── models/
│   ├── routes/
│   ├── uploaded_docs/
│
└── frontend/
    ├── index.html
    ├── dashboard.html
    ├── document_detail.html
    ├── js/
    ├── css/
```

---

## 8. Kiểm thử nhanh toàn hệ thống

### Backend:
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
python app.py
```

### Frontend:
```
cd frontend
python -m http.server 8000
```

### Truy cập:
- UI: http://localhost:8000  
- API Docs: http://127.0.0.1:5000/swagger  
- Login test:
  - email: admin@taxlaw.vn  
  - password: admin@123

---

## 9. Kết luận

Dự án đã sẵn sàng triển khai / bàn giao.
Nếu muốn bổ sung:
- ERD Diagram  
- API Endpoints Table  
- Deployment Guide (Docker/Ubuntu)  
- Role Matrix  

Chỉ cần yêu cầu và tôi sẽ thêm ngay.
