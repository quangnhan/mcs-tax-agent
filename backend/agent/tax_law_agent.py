# agent.py
from langchain_openai import ChatOpenAI
from .vector_db import similarity_search

llm = ChatOpenAI(
    model="deepseek/deepseek-r1-0528-qwen3-8b",
    base_url="http://localhost:1234/v1",
    api_key="any",
    temperature=0.0,
    max_tokens=1024,
)

PROMPT = """
Bạn là chuyên gia pháp luật thuế Việt Nam.
Chỉ trả lời dựa hoàn toàn vào ngữ cảnh dưới đây.
Nếu không có đủ thông tin → trả lời: "Không đủ dữ liệu trong hệ thống hiện tại."

Ngữ cảnh:
{context}

Câu hỏi: {question}

Trả lời ngắn gọn, chính xác bằng tiếng Việt:
"""


class TaxLawAgent:
    @staticmethod
    def ask(question: str, k: int = 6):
        docs_with_scores = similarity_search(question, k=k)
        
        # Unpack just docs for context
        docs = [doc for doc, _ in docs_with_scores]
        
        context = "\n\n".join([d.page_content for d in docs])
        answer = llm.invoke(
            PROMPT.format(context=context, question=question)
        ).content.strip()

        sources = [
            {
                "filename": doc.metadata.get("source", "unknown"),
                "snippet": (
                    doc.page_content[:500] + "..."
                    if len(doc.page_content) > 500
                    else doc.page_content
                ),
                "score": float(score) # Convert numpy float if needed
            }
            for doc, score in docs_with_scores
        ]
        
        # Determine best score
        best_score = max([s for _, s in docs_with_scores]) if docs_with_scores else 0.0
        
        return {"answer": answer, "sources": sources, "best_score": float(best_score)}
