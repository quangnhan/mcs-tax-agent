--
-- PostgreSQL database dump
--

\restrict DLVHhsIu7vBKiysLCJ4egaMy6NM2mbqKFKhDlopHF28Gidzwh6k2oeP9BoUdydN

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: document_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_status AS ENUM (
    'pending',
    'reviewed',
    'approved',
    'rejected'
);


ALTER TYPE public.document_status OWNER TO postgres;

--
-- Name: message_sender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_sender AS ENUM (
    'user',
    'bot'
);


ALTER TYPE public.message_sender OWNER TO postgres;

--
-- Name: retrieval_accuracy; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.retrieval_accuracy AS ENUM (
    'accurate',
    'partial',
    'inaccurate'
);


ALTER TYPE public.retrieval_accuracy OWNER TO postgres;

--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_enum AS ENUM (
    'admin',
    'user',
    'lawyer',
    'data_scientist'
);


ALTER TYPE public.role_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation (
    id integer NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversation OWNER TO postgres;

--
-- Name: conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversation_id_seq OWNER TO postgres;

--
-- Name: conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversation_id_seq OWNED BY public.conversation.id;


--
-- Name: document_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_audit_log (
    id integer NOT NULL,
    document_id integer,
    action text NOT NULL,
    old_status public.document_status,
    new_status public.document_status,
    user_id integer,
    message text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.document_audit_log OWNER TO postgres;

--
-- Name: document_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_audit_log_id_seq OWNER TO postgres;

--
-- Name: document_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_audit_log_id_seq OWNED BY public.document_audit_log.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    tax_type character varying(50),
    issue_date date,
    original_filename text,
    stored_filename text,
    mime_type text,
    size_bytes bigint,
    file_path text,
    upload_lawyer_id integer,
    assigned_lawyer_id integer,
    status public.document_status DEFAULT 'pending'::public.document_status,
    lawyer_feedback text,
    review_date timestamp with time zone,
    data_scientist_feedback text,
    in_vector_db boolean DEFAULT false,
    applied_to_vector boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message (
    id integer NOT NULL,
    conversation_id integer,
    sender public.message_sender NOT NULL,
    text text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.message OWNER TO postgres;

--
-- Name: message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_id_seq OWNER TO postgres;

--
-- Name: message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.message_id_seq OWNED BY public.message.id;


--
-- Name: retrieval_match; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.retrieval_match (
    id integer NOT NULL,
    conversation_id integer,
    user_query text,
    chatbot_response text,
    retrieved_snippet text,
    document_source text,
    similarity_score double precision,
    status public.retrieval_accuracy,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.retrieval_match OWNER TO postgres;

--
-- Name: retrieval_match_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.retrieval_match_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retrieval_match_id_seq OWNER TO postgres;

--
-- Name: retrieval_match_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.retrieval_match_id_seq OWNED BY public.retrieval_match.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text,
    role public.role_enum DEFAULT 'user'::public.role_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: conversation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation ALTER COLUMN id SET DEFAULT nextval('public.conversation_id_seq'::regclass);


--
-- Name: document_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_audit_log ALTER COLUMN id SET DEFAULT nextval('public.document_audit_log_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: message id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message ALTER COLUMN id SET DEFAULT nextval('public.message_id_seq'::regclass);


--
-- Name: retrieval_match id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retrieval_match ALTER COLUMN id SET DEFAULT nextval('public.retrieval_match_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversation (id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: document_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_audit_log (id, document_id, action, old_status, new_status, user_id, message, created_at) FROM stdin;
1	1	create	\N	pending	2	Document created	2025-11-25 07:23:37.08948+07
4	3	create	\N	pending	2	Document created	2025-11-26 10:11:19.446255+07
5	4	create	\N	pending	2	Document created	2025-11-26 10:11:38.812935+07
6	5	create	\N	pending	2	Document created	2025-11-26 10:12:01.82583+07
7	6	create	\N	pending	2	Document created	2025-11-26 10:12:15.534533+07
8	7	create	\N	pending	2	Document created	2025-11-26 10:12:44.22201+07
9	8	create	\N	pending	2	Document created	2025-11-26 10:12:59.891531+07
12	1	approve	pending	approved	2	Approved	2025-11-26 10:14:11.775334+07
13	1	reject	approved	rejected	2	sai	2025-11-26 10:14:26.351982+07
14	1	approve	rejected	approved	2	Approved	2025-11-26 10:14:34.359786+07
20	8	reject	pending	rejected	2	sai cấu trúc	2025-11-27 03:24:49.565604+07
21	7	approve	pending	approved	2	Approved	2025-11-27 03:24:55.554696+07
22	6	status_change	pending	reviewed	2	Status changed from pending → reviewed	2025-11-27 06:15:21.294037+07
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, description, tax_type, issue_date, original_filename, stored_filename, mime_type, size_bytes, file_path, upload_lawyer_id, assigned_lawyer_id, status, lawyer_feedback, review_date, data_scientist_feedback, in_vector_db, applied_to_vector, created_at, updated_at) FROM stdin;
3	2_TÀI CHÍNH VÀ QUẢN LÝ TÀI CHÍNH NÂNG CAO	\N	\N	\N	2_TÀI CHÍNH VÀ QUẢN LÝ TÀI CHÍNH NÂNG CAO.pdf	b8d8ad400f99431bbf6d9a7df1cfa728_2_TÀI CHÍNH VÀ QUẢN LÝ TÀI CHÍNH NÂNG CAO.pdf	application/pdf	1674844	E:\\Cao học\\HTTM\\Project\\26112025\\taxlaw_project\\backend\\uploaded_docs\\b8d8ad400f99431bbf6d9a7df1cfa728_2_TÀI CHÍNH VÀ QUẢN LÝ TÀI CHÍNH NÂNG CAO.pdf	2	\N	pending	\N	\N	\N	f	f	2025-11-26 17:11:19.441703+07	2025-11-26 10:11:19.441237+07
4	3_THUẾ VÀ QUẢN LÝ THUẾ NÂNG CAO	\N	\N	\N	3_THUẾ VÀ QUẢN LÝ THUẾ NÂNG CAO.pdf	46ae88b4f0d24a80812449d2046de69e_3_THUẾ VÀ QUẢN LÝ THUẾ NÂNG CAO.pdf	application/pdf	3731551	E:\\Cao học\\HTTM\\Project\\26112025\\taxlaw_project\\backend\\uploaded_docs\\46ae88b4f0d24a80812449d2046de69e_3_THUẾ VÀ QUẢN LÝ THUẾ NÂNG CAO.pdf	2	\N	pending	\N	\N	\N	f	f	2025-11-26 17:11:38.81217+07	2025-11-26 10:11:38.811976+07
5	4_KẾ TOÁN TÀI CHÍNH, KẾ TOÁN QUẢN TRỊ NÂNG CAO	\N	\N	\N	4_KẾ TOÁN TÀI CHÍNH, KẾ TOÁN QUẢN TRỊ NÂNG CAO.pdf	acd9fb54529943edabe233a3efac887e_4_KẾ TOÁN TÀI CHÍNH, KẾ TOÁN QUẢN TRỊ NÂNG CAO.pdf	application/pdf	3188286	E:\\Cao học\\HTTM\\Project\\26112025\\taxlaw_project\\backend\\uploaded_docs\\acd9fb54529943edabe233a3efac887e_4_KẾ TOÁN TÀI CHÍNH, KẾ TOÁN QUẢN TRỊ NÂNG CAO.pdf	2	\N	pending	\N	\N	\N	f	f	2025-11-26 17:12:01.823712+07	2025-11-26 10:12:01.822568+07
1	1_PHÁP LUẬT VỀ KINH TẾ VÀ LUẬT DOANH NGHIỆP	\N	\N	\N	1_PHÁP LUẬT VỀ KINH TẾ VÀ LUẬT DOANH NGHIỆP.pdf	38925197063a441c8875f8959e16fdf7_1_PHÁP LUẬT VỀ KINH TẾ VÀ LUẬT DOANH NGHIỆP.pdf	\N	\N	E:\\Cao học\\HTTM\\Project\\25112025\\taxlaw_project\\backend\\uploaded_docs\\38925197063a441c8875f8959e16fdf7_1_PHÁP LUẬT VỀ KINH TẾ VÀ LUẬT DOANH NGHIỆP.pdf	2	\N	approved	\N	\N	\N	f	f	2025-11-25 14:23:37.08508+07	2025-11-26 10:14:34.359458+07
8	7_NGOẠI NGỮ (TIẾNG ANH)	\N	\N	\N	7_NGOẠI NGỮ (TIẾNG ANH).pdf	96c71af557854b5085a22eaed3e8fcea_7_NGOẠI NGỮ (TIẾNG ANH).pdf	application/pdf	597709	E:\\Cao học\\HTTM\\Project\\26112025\\taxlaw_project\\backend\\uploaded_docs\\96c71af557854b5085a22eaed3e8fcea_7_NGOẠI NGỮ (TIẾNG ANH).pdf	2	\N	rejected	\N	\N	\N	f	f	2025-11-26 17:12:59.8877+07	2025-11-27 03:24:49.56444+07
7	6_PHÂN TÍCH HOẠT ĐỘNG TÀI CHÍNH NÂNG CAO	\N	\N	\N	6_PHÂN TÍCH HOẠT ĐỘNG TÀI CHÍNH NÂNG CAO.pdf	934220d83b5c4b31abfd52928da19ea3_6_PHÂN TÍCH HOẠT ĐỘNG TÀI CHÍNH NÂNG CAO.pdf	application/pdf	1722514	E:\\Cao học\\HTTM\\Project\\26112025\\taxlaw_project\\backend\\uploaded_docs\\934220d83b5c4b31abfd52928da19ea3_6_PHÂN TÍCH HOẠT ĐỘNG TÀI CHÍNH NÂNG CAO.pdf	2	\N	approved	\N	\N	\N	f	f	2025-11-26 17:12:44.218418+07	2025-11-27 03:24:55.553693+07
6	5_KIỂM TOÁN VÀ DỊCH VỤ ĐẢM BẢO NÂNG CAO	\N	\N	\N	5_KIỂM TOÁN VÀ DỊCH VỤ ĐẢM BẢO NÂNG CAO.pdf	21c9a1cfd4d6402bbbc8cc4f44a52348_5_KIỂM TOÁN VÀ DỊCH VỤ ĐẢM BẢO NÂNG CAO.pdf	application/pdf	3418924	E:\\Cao học\\HTTM\\Project\\26112025\\taxlaw_project\\backend\\uploaded_docs\\21c9a1cfd4d6402bbbc8cc4f44a52348_5_KIỂM TOÁN VÀ DỊCH VỤ ĐẢM BẢO NÂNG CAO.pdf	2	\N	reviewed	\N	2025-11-27 13:15:21.285371+07	\N	f	f	2025-11-26 17:12:15.531859+07	2025-11-27 13:15:21.285371+07
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message (id, conversation_id, sender, text, created_at) FROM stdin;
\.


--
-- Data for Name: retrieval_match; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.retrieval_match (id, conversation_id, user_query, chatbot_response, retrieved_snippet, document_source, similarity_score, status, created_at) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, email, password_hash, name, role, created_at, updated_at) FROM stdin;
2	admin@taxlaw.vn	scrypt:32768:8:1$VUgz94B3V4eZx8Xr$67018363fc60925b8f10b842443a7f3b57e69209f1fac3cd3a04e1381186463bf9abd03a88c47b8cbeb2b7aede4cd038219dbf7c528867004bc46aa1968eba0e	Admin	admin	2025-11-25 03:35:17.320727+07	2025-11-25 03:35:17.320727+07
\.


--
-- Name: conversation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversation_id_seq', 1, false);


--
-- Name: document_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_audit_log_id_seq', 27, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 13, true);


--
-- Name: message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_id_seq', 1, false);


--
-- Name: retrieval_match_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.retrieval_match_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 2, true);


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (id);


--
-- Name: document_audit_log document_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_audit_log
    ADD CONSTRAINT document_audit_log_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- Name: retrieval_match retrieval_match_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retrieval_match
    ADD CONSTRAINT retrieval_match_pkey PRIMARY KEY (id);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: conversation conversation_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: document_audit_log document_audit_log_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_audit_log
    ADD CONSTRAINT document_audit_log_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_audit_log document_audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_audit_log
    ADD CONSTRAINT document_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: documents documents_assigned_lawyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_lawyer_id_fkey FOREIGN KEY (assigned_lawyer_id) REFERENCES public."user"(id);


--
-- Name: documents documents_upload_lawyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_upload_lawyer_id_fkey FOREIGN KEY (upload_lawyer_id) REFERENCES public."user"(id);


--
-- Name: message message_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id) ON DELETE CASCADE;


--
-- Name: retrieval_match retrieval_match_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retrieval_match
    ADD CONSTRAINT retrieval_match_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict DLVHhsIu7vBKiysLCJ4egaMy6NM2mbqKFKhDlopHF28Gidzwh6k2oeP9BoUdydN

