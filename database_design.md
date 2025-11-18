# Thiết kế Cơ sở dữ liệu (CSDL) bảng

## Message:

- id (string): Id của message
- conversationId (string): Id của cuộc hội thoại (khóa ngoại)
- text (string): văn bản cảu message
- sender (`user` | `bot`): xác định người gửi là người dùng hoặc bot
- timestamp (string): chuỗi thể hiện thời gian tạo dữ liệu, ví dụ: `2025-11-18T07:00:00.000Z`

## Conversation: cuộc hội thoại của người dùng

- id (string): Id của cuộc hội thoại
- timestamp (string): chuỗi thể hiện thời gian tạo dữ liệu
- message (List[Message]): danh sách các messages

## LawyerDocument: tài liệu luật ở phía luật sư

- id (string): Id của tài liệu
- name (string): tên của tài liệu
- type (string): phân loại của tài liệu
- issueDate (string): ngày ban hành tài liệu, ví dụ: `2025-11-18T00:00:00.000Z`
- uploadDate (string): ngày tải lên tài liệu
- size (string): chuỗi thể hiện kích thước file, ví dụ `2.4 MB`
- reviewStatus (`pending` | `reviewed` | `approved` | `rejected`): trạng thái của tài liệu ở phía luật sư, lần lượt theo thứ tự là 'Chờ xem xét', 'Đã xem xét', 'Đã phê duyệt', 'Bị từ chối'
- feedback (Optional[string]): nhận xét của luật sư dành cho tài liệu
- reviewDate (Optional[string]): ngày tài liệu được xem xét
- uploadedBy (string): tên của luật sư
- dataScientistFeedback (Optional[string]): nhận xét của data scientist dành cho tài liệu

## RetrievalMatch: thông tin truy vấn

- id (string): Id của thông tin truy vấn
- userQuery (string): văn bản câu hỏi của người dùng
- chatbotResponse (string): văn bản câu trả lời của bot
- retrievedSnippet (string): văn bản được truy xuất từ vector database
- documentSource (string): tên của tài liệu được truy xuất, là `LawyerDocument.name`
- similarityScore (number): điểm giống nhau giữa câu hỏi và văn bản được truy xuất
- timestamp (string): chuỗi thể hiện thời gian tạo dữ liệu
- status (`accurate` | `partial` | `inaccurate`): phân loại trạng thái của khớp truy vấn

## DatabaseDocument: tài liệu luật ở phía Data Scientist, liên quan đến vector database

- id (string): Id của tài liệu
- name (string): tên của tài liệu
- type (string): phân loại của tài liệu
- uploadedBy (string): tên của luật sư tải lên tài liệu
- uploadDate (string): ngày tải lên tài liệu
- lawyerFeedback (Optional[string]): nhận xét của luật sư dành cho tài liệu
- lawyerAction (`add` | `remove`): hành động của luật sư, phân loaik dựa vào `LawyerDocument.reviewStatus`
- reviewedBy (Optional[string]): tên của luật sư nhân xét tài liệu
- reviewDate (Optional[string]): ngày tài liệu được xem xét
- dsApproved (boolean): tài liệu có được Data Scientist phê duyệt hay không?
- appliedToDatabase (boolean): tài liệu có được áp dụng vào vector database hay không?
