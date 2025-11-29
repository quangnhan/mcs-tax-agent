-- This schema is also represented in SQLAlchemy models + auto_migrate.py
-- Kept here for reference or manual apply if needed.

CREATE TYPE role_enum AS ENUM ('admin','user','lawyer','data_scientist');
CREATE TYPE document_status AS ENUM ('pending','reviewed','approved','rejected');
CREATE TYPE message_sender AS ENUM ('user','bot');
CREATE TYPE retrieval_accuracy AS ENUM ('accurate','partial','inaccurate');

-- user, documents, document_audit_log, conversation, message, retrieval_match
