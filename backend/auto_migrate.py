from extensions import db
from sqlalchemy import text

def ensure_enums(engine):
    # Create enums if missing, using IF NOT EXISTS where supported
    with engine.connect() as conn:
        conn.execute(text(
            "DO $$ BEGIN "
            "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN "
            "CREATE TYPE role_enum AS ENUM ('admin','user','lawyer','data_scientist'); "
            "END IF; "
            "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN "
            "CREATE TYPE document_status AS ENUM ('pending','reviewed','approved','rejected'); "
            "END IF; "
            "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_sender') THEN "
            "CREATE TYPE message_sender AS ENUM ('user','bot'); "
            "END IF; "
            "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'retrieval_accuracy') THEN "
            "CREATE TYPE retrieval_accuracy AS ENUM ('accurate','partial','inaccurate'); "
            "END IF; "
            "END $$;"
        ))
        conn.commit()

def ensure_schema(app):
    # Simple safe-mode: ensure enums then create_all for missing tables.
    engine = db.engine
    ensure_enums(engine)
    db.create_all()
