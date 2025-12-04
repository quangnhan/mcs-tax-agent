# services/chroma_service.py
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument
from .vector_db import insert_documents
import logging
from typing import Dict, Any

# Global splitter – reused
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=100,
    separators=[
        "\nI.",
        "\nII.",
        "\nIII.",
        "\nIV.",
        "\nV.",
        "\n1.",
        "\n2.",
        "\n3.",
        "\n4.",
        "\n5.",
        "\na)",
        "\nb)",
        "\nc)",
        "\nd)",
        "\ne)",
        "\n\n",
        ". ",
        " ",
        "",
    ],
)


class DocumentService:
    """
    Pure service: Chỉ biết chunk + embed vào Chroma
    Không biết gì về SQLAlchemy, db.session, hay Document model
    """

    @staticmethod
    def index_document(text_content: str, doc_id: int) -> None:
        """
        Thêm tài liệu vào Chroma
        Args:
            text_content: nội dung đã đọc từ file
            doc_id: ID chính từ PostgreSQL (dùng để delete sau này)
        """
        try:
            # 1. Xóa phiên bản cũ trước (idempotent)
            DocumentService._delete_by_doc_id(doc_id)

            # 2. Chuẩn bị document
            clean_text = " ".join(text_content.strip().split()).lower()
            lc_doc = LCDocument(
                page_content=clean_text,
                metadata={
                    "doc_id": doc_id,
                },
            )

            # 3. Chunk
            chunks = _splitter.split_documents([lc_doc])

            # 4. Add to Chroma
            texts = []
            texts.extend(chunks)
            insert_documents(texts)

            logging.info(f"Indexed doc_id={doc_id} | {len(chunks)} chunks")

        except Exception as e:
            logging.error(f"Chroma indexing failed for doc_id={doc_id}: {e}")
            raise  # để API layer bắt và rollback nếu cần

    @staticmethod
    def remove_document(doc_id: int) -> None:
        """Xóa toàn bộ chunk của document này"""
        try:
            deleted_count = DocumentService._delete_by_doc_id(doc_id)
            if deleted_count > 0:
                logging.info(
                    f"Removed doc_id={doc_id} from Chroma ({deleted_count} chunks)"
                )
        except Exception as e:
            logging.error(f"Failed to remove doc_id={doc_id} from Chroma: {e}")
            raise

    @staticmethod
    def _delete_by_doc_id(doc_id: int) -> int:
        """Internal: xóa bằng metadata – không cần lưu ID"""
        try:
            collection = get_vectorstore()._collection
            results = collection.get(where={"doc_id": doc_id})
            if results["ids"]:
                collection.delete(ids=results["ids"])
                return len(results["ids"])
            return 0
        except Exception as e:
            logging.warning(f"Delete by doc_id failed: {e}")
            return 0
