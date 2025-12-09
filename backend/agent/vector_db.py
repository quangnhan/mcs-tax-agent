# backend/agent/vector_db.py
from tqdm import tqdm
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

# === Configuration ===
QDRANT_URL = "http://localhost:6333"  # Change if Qdrant runs elsewhere
QDRANT_COLLECTION = "tax_documentation"
EMBEDDING_MODEL = "keepitreal/vietnamese-sbert"
BATCH_SIZE = 32  # Qdrant handles larger batches well

# ======================
# Embedding model
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={"device": "cpu"},  # change to "cuda" if GPU available
    encode_kwargs={"normalize_embeddings": True},  # recommended for cosine similarity
)

# Qdrant client
client = QdrantClient(url=QDRANT_URL, prefer_grpc=True)  # GRPC is faster

# Ensure collection exists with correct vector config
if not client.collection_exists(QDRANT_COLLECTION):
    # Get embedding dimension
    dummy_vec = embeddings.embed_query("test")
    vector_size = len(dummy_vec)

    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )
    print(f"Created Qdrant collection '{QDRANT_COLLECTION}' with dim={vector_size}")
else:
    print(f"Collection '{QDRANT_COLLECTION}' already exists")

# LangChain Qdrant vector store wrapper
vectorstore = QdrantVectorStore(
    client=client,
    collection_name=QDRANT_COLLECTION,
    embedding=embeddings,
)


def insert_documents(documents):
    """
    Insert a list of LangChain Document objects into Qdrant.
    documents: list of langchain_core.documents.Document
    """
    texts = [doc.page_content for doc in documents]
    metadatas = [doc.metadata for doc in documents]

    print(f"Inserting {len(texts)} documents into Qdrant (batch size: {BATCH_SIZE})...")

    for i in tqdm(range(0, len(texts), BATCH_SIZE), desc="Adding to Qdrant"):
        batch_texts = texts[i : i + BATCH_SIZE]
        batch_metadatas = metadatas[i : i + BATCH_SIZE]

        # Let QdrantVectorStore handle embedding + upsert in one call
        vectorstore.add_texts(
            texts=batch_texts,
            metadatas=batch_metadatas,
            batch_size=BATCH_SIZE,  # optional, but helps with large batches
        )

    print("All documents successfully inserted into Qdrant!")


def similarity_search(question: str, k: int = 6):
    """
    Perform similarity search and return LangChain Document objects
    with full page_content and metadata (especially 'source').

    Args:
        question (str): User question in Vietnamese
        k (int): Number of most relevant chunks to return (default 6)

    Returns:
        List[(Document, float)]: List of tuples (Document, score)
    """
    if not question.strip():
        return []

    docs_with_scores = vectorstore.similarity_search_with_score(question, k=k)

    # Return raw list of (doc, score)
    return docs_with_scores


# ================================================================
# Quick test when running the file directly
# ================================================================
if __name__ == "__main__":
    test_docs = [
        Document(
            page_content="Thuế thu nhập cá nhân từ tiền lương được tính theo biểu lũy tiến từng phần từ 5% đến 35%.",
            metadata={"source": "luat-thue-tncn-2024.pdf"},
        ),
        Document(
            page_content="Mức giảm trừ gia cảnh hiện hành là 11 triệu đồng/tháng cho người nộp thuế.",
            metadata={"source": "nghidinh-2024.pdf"},
        ),
    ]
    insert_documents(test_docs)

    # Test the new function
    results = similarity_search("Thuế thu nhập cá nhân tính như thế nào?", k=2)
    for i, doc in enumerate(results, 1):
        print(f"\n--- Result {i} ---")
        print("Source :", doc.metadata.get("source"))
        print("Snippet:", doc.page_content[:200])
