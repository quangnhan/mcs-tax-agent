# MCS Tax Agent - Project Setup Guide

This guide will walk you through setting up and running the complete MCS Tax Agent system, including the frontend, backend, database, and vector database components.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your system:

- **Node.js** (v16 or higher) - [Download & Installation Guide](https://nodejs.org/en/download/)
- **Python** (v3.8 or higher) - [Download & Installation Guide](https://www.python.org/downloads/)
- **PostgreSQL** (v12 or higher) - [Download & Installation Guide](https://www.postgresql.org/download/)
- **Docker & Docker Compose** - [Download & Installation Guide](https://docs.docker.com/get-docker/)
- **Git** - [Download & Installation Guide](https://git-scm.com/downloads)

---

## 🐳 Step 1: Start Docker Services

The project uses Docker Compose to manage the Qdrant vector database service.

### Start Docker Services

```bash
docker-compose up -d
```

This command will:
- Pull the latest Qdrant image from Docker Hub
- Start the Qdrant vector database container
- Expose ports 6333 (REST API & Web UI) and 6334 (gRPC)
- Create a persistent volume at `./qdrant_data` for data storage

### Verify Docker Services

Check that the Qdrant service is running:

```bash
docker-compose ps
```

You should see the `qdrant_instance` container in the "Up" state.

---

## 🗄️ Step 2: Setup PostgreSQL Database

PostgreSQL is used as the main relational database for the application.

### Installation Reference

- **Official PostgreSQL Documentation**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
- **macOS**: `brew install postgresql`
- **Windows**: Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)

### Environment Setup

1. **Start PostgreSQL Service**:

   ```bash
   # Linux/macOS
   sudo service postgresql start
   
   # macOS (Homebrew)
   brew services start postgresql
   
   # Windows
   # PostgreSQL service starts automatically after installation
   ```

2. **Verify PostgreSQL is Running**:

   ```bash
   psql --version
   ```

3. **Configure Database Connection** (if needed):
   
   The backend will automatically create the `taxlaw_db` database. Ensure PostgreSQL is accessible on `localhost:5432` with default credentials, or update the connection settings in `backend/config.py`.

---

## 🔍 Step 3: Setup Qdrant Vector Database

Qdrant is used for semantic search and document retrieval using vector embeddings.

### Installation Reference

- **Official Qdrant Documentation**: [https://qdrant.tech/documentation/](https://qdrant.tech/documentation/)
- **Docker Installation**: [https://qdrant.tech/documentation/quick-start/](https://qdrant.tech/documentation/quick-start/)

### Access Qdrant Dashboard

Once Docker services are running, access the Qdrant Web UI:

```
http://localhost:6333/dashboard
```

From the dashboard, you can:
- View collections and vectors
- Monitor storage and performance
- Test search queries
- Manage vector database configurations

### Verify Qdrant API

Test the REST API endpoint:

```bash
curl http://localhost:6333/collections
```

---

## 🔧 Step 4: Setup Backend (Flask)

The backend is built with Flask and handles API requests, authentication, document management, and vector search.

### Installation Reference

For detailed backend setup instructions, see: **[backend/README.md](backend/README.md)**

### Environment Setup

1. **Navigate to Backend Directory**:

   ```bash
   cd backend
   ```

2. **Create Virtual Environment**:

   ```bash
   python -m venv .venv
   ```

3. **Activate Virtual Environment**:

   **Linux/macOS**:
   ```bash
   source .venv/bin/activate
   ```

   **Windows**:
   ```bash
   .venv\Scripts\activate
   ```

4. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

5. **Initialize Database**:

   ```bash
   python init_db.py
   ```

   This script will:
   - Create the `taxlaw_db` database (if it doesn't exist)
   - Create all required tables
   - Create a default admin account:
     - Email: `admin@taxlaw.vn`
     - Password: `admin@123`
     - Role: `admin`

### Seed Data

To populate the database with sample documents and data:

```bash
python seed_data.py
```

This script will:
- Clear the existing vector database
- Upload sample PDF documents from `vector_database/data`
- Create documents with various statuses (pending, reviewed, approved, rejected)
- Index approved documents to the Qdrant vector database
- Create sample users, conversations, and audit logs

### Run Backend Server

```bash
python app.py
```

The backend will start at:
```
http://127.0.0.1:5000
```

### Verify Backend

- **API Documentation (Swagger)**: [http://127.0.0.1:5000/swagger](http://127.0.0.1:5000/swagger)
- **Health Check**: [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health) (if available)

---

## 🎨 Step 5: Setup Frontend (ViteJS)

The frontend is built with ViteJS and provides the user interface for the tax agent application.

### Installation Reference

For detailed frontend setup instructions, see: **[frontend/README.md](frontend/README.md)**

- **Official ViteJS Documentation**: [https://vitejs.dev/guide/](https://vitejs.dev/guide/)

### Environment Setup

1. **Navigate to Frontend Directory**:

   ```bash
   cd frontend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

   Or using yarn:
   ```bash
   yarn install
   ```

### Run Frontend Development Server

```bash
npm run dev
```

Or using yarn:
```bash
yarn dev
```

The frontend will start at:
```
http://localhost:3000
```

### Verify Frontend

Open your browser and navigate to the URL shown in the terminal. You should see the Vietnamese Tax Law Dashboard login page.

---

## 🚀 Quick Start (All Services)

To start all services at once, follow these commands in order:

```bash
# 1. Start Docker services (Qdrant)
docker-compose up -d

# 2. Start Backend (in a new terminal)
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python app.py

# 3. Start Frontend (in another new terminal)
cd frontend
npm run dev
```

---

## 📊 Service URLs Summary

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | ViteJS Development Server |
| Backend API | http://127.0.0.1:5000 | Flask REST API |
| Qdrant API | http://localhost:6333 | Vector Database REST API |

---

## 🛑 Stopping Services

### Stop Frontend & Backend
Press `Ctrl+C` in the respective terminal windows.

### Stop Docker Services

```bash
docker-compose down
```

To also remove volumes and data:
```bash
docker-compose down -v
```

---

## 🐛 Troubleshooting

### PostgreSQL Connection Issues
- Ensure PostgreSQL service is running
- Check connection settings in `backend/config.py`
- Verify database credentials

### Qdrant Not Accessible
- Check Docker is running: `docker ps`
- Restart Docker services: `docker-compose restart`
- Check logs: `docker-compose logs qdrant`

### Backend Port Already in Use
- Change the port in `backend/app.py`
- Or kill the process using port 5000

### Frontend Port Already in Use
- ViteJS will automatically try the next available port
- Or specify a custom port in `frontend/vite.config.js`
