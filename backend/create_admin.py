import getpass
from werkzeug.security import generate_password_hash
from flask import Flask
from extensions import db
from models.user import User
import config

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = config.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    from extensions import jwt
    app.config["JWT_SECRET_KEY"] = config.JWT_SECRET_KEY
    db.init_app(app)
    jwt.init_app(app)
    return app

def main():
    app = create_app()
    with app.app_context():
        db.create_all()
        print("=== Create admin user ===")
        email = input("Admin email: ").strip()
        name = input("Admin name: ").strip() or "Admin"
        password = getpass.getpass("Admin password: ")
        if User.query.filter_by(email=email).first():
            print("User already exists.")
            return
        user = User(
            email=email,
            name=name,
            password_hash=generate_password_hash(password),
            role="admin",
        )
        db.session.add(user)
        db.session.commit()
        print("Admin user created.")

if __name__ == "__main__":
    main()
