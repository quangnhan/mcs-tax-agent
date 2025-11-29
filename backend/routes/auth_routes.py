from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from extensions import db
from models.user import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    additional_claims = {"role": user.role}
    token = create_access_token(
        identity=str(user.id),              # identity MUST be a string
        additional_claims=additional_claims
    )
    
    return jsonify({
        "token": token,
        "user": user.to_dict(),
    })
