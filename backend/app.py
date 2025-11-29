from flask import Flask, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import config
from extensions import db, jwt
from auto_migrate import ensure_schema
from routes.auth_routes import auth_bp
from routes.document_routes import document_bp
from routes.admin_routes import admin_bp
from routes.conversation_routes import convo_bp
from routes.retrieval_routes import retrieval_bp
from flask_swagger_ui import get_swaggerui_blueprint
import os

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = config.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = config.JWT_SECRET_KEY
    app.config["UPLOAD_FOLDER"] = config.UPLOAD_FOLDER

    CORS(app, origins="*", supports_credentials=True)

    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(document_bp, url_prefix="/documents")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(convo_bp, url_prefix="/conversation")
    app.register_blueprint(retrieval_bp, url_prefix="/retrieval")

    @app.get("/")
    def index():
        return jsonify({"message": "TaxLaw Project API running"})

    # -----------------------
    # SWAGGER UI
    # -----------------------
    SWAGGER_URL = "/swagger"
    API_URL = "/swagger.yaml"

    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={"app_name": "TaxLaw API"}
    )

    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    @app.route("/swagger.yaml")
    def swagger_spec():
        root = os.path.dirname(os.path.abspath(__file__))
        return send_file(os.path.join(root, "swagger.yaml"))

    return app

app = create_app()
if __name__ == "__main__":
    with app.app_context():
        ensure_schema(app)
    app.run(port=5000, debug=True)
