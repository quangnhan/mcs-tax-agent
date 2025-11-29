import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app import app
from extensions import db
from models.user import User
from werkzeug.security import generate_password_hash

DB_NAME = "taxlaw_db"
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_HOST = "localhost"
DB_PORT = "5432"


def create_database():
    """
    Tự động tạo DATABASE nếu chưa tồn tại
    """
    try:
        print(f"[INFO] Checking database '{DB_NAME}'...")

        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'")
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"[OK] Database '{DB_NAME}' created successfully.")
        else:
            print(f"[OK] Database '{DB_NAME}' already exists.")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[ERROR] Failed to create database: {e}")


from auto_migrate import ensure_schema

def create_tables_and_admin():
    """
    Tạo bảng + admin mặc định
    """
    with app.app_context():
        print("[INFO] Creating tables...")
        ensure_schema(app)
        print("[OK] Tables created successfully.")

        # Check existing admin
        admin = User.query.filter_by(email="admin@taxlaw.vn").first()
        if admin:
            print("[INFO] Admin user already exists.")
        else:
            print("[INFO] Creating default admin account...")
            new_admin = User(
                email="admin@taxlaw.vn",
                password_hash=generate_password_hash("admin@123"),
                name="Administrator",
                role="admin",
            )
            db.session.add(new_admin)
            db.session.commit()
            print("[OK] Admin user created: admin@taxlaw.vn / admin@123")


if __name__ == "__main__":
    print("======================================")
    print("  TAXLAW PROJECT – INIT DATABASE TOOL")
    print("======================================\n")

    create_database()
    create_tables_and_admin()

    print("\n======================================")
    print("  DATABASE INITIALIZATION COMPLETED")
    print("======================================")
