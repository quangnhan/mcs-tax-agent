# backend/agent/vector_db.py
import chromadb
from tqdm import tqdm
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# === Configuration ===
CHROMA_HOST = "localhost"
CHROMA_PORT = 8000
CHROMA_COLLECTION = "tax_documentation"
EMBEDDING_MODEL = "keepitreal/vietnamese-sbert"
BATCH_SIZE = 16

# ======================
# Embedding (unchanged)
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL, model_kwargs={"device": "cpu"}
)

# PersistentClient: Connects directly to Docker's persisted volume (no HTTP/tenant issues)
# Path matches your volume mount: /chroma/chroma
# client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
client = chromadb.PersistentClient(
    path="/chroma/chroma",  # Inside container path
    settings=chromadb.Settings(anonymized_telemetry=False, allow_reset=True),
)

# Ensure collection exists
try:
    collection = client.get_collection("tax_documentation")
except:
    collection = client.create_collection("tax_documentation")

# LangChain wrapper
vectorstore = Chroma(
    client=client,
    collection_name="tax_documentation",
    embedding_function=embeddings,
    persist_directory="/chroma/chroma",  # Sync with client
)


def insert_documents(texts):
    for i in tqdm(
        range(0, len(texts), BATCH_SIZE), desc="Embedding and adding to Chroma"
    ):
        batch = texts[i : i + BATCH_SIZE]

        # Chroma will handle embeddings internally OR use yours
        batch_embeddings = embeddings.embed_documents([t.page_content for t in batch])

        vectorstore.add_texts(
            texts=[t.page_content for t in batch], embeddings=batch_embeddings
        )
