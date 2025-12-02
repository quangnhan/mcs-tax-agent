# vector_db.py
import chromadb
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# Shared embedding model
embeddings = HuggingFaceEmbeddings(
    model_name="keepitreal/vietnamese-sbert",
    model_kwargs={"device": "cpu"}
)

# Chroma client (point to your Docker/local server)
client = chromadb.HttpClient(host="localhost", port=8000)

# Shared vectorstore
vectorstore = Chroma(
    client=client,
    collection_name="tax_documentation",
    embedding_function=embeddings
)

def get_vectorstore():
    return vectorstore