// Mock API service that simulates localhost API calls
// This replaces direct state manipulation with API calls that return mock data

// ==================== TYPES ====================

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface Conversation {
  id: string;
  timestamp: string;
  messages: Message[];
}

export interface LawyerDocument {
  id: string;
  name: string;
  type: string;
  issueDate: string;
  uploadDate: string;
  size: string;
  reviewStatus: 'pending' | 'reviewed' | 'approved' | 'rejected';
  feedback?: string;
  reviewDate?: string;
  uploadedBy: string;
  dataScientistFeedback?: string;
}

export interface RetrievalMatch {
  id: string;
  userQuery: string;
  chatbotResponse: string;
  retrievedSnippet: string;
  documentSource: string;
  similarityScore: number;
  timestamp: string;
  status: 'accurate' | 'partial' | 'inaccurate';
}

export interface DatabaseDocument {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
  lawyerFeedback?: string;
  lawyerAction: 'add' | 'remove';
  reviewedBy?: string;
  reviewDate?: string;
  dsApproved: boolean;
  appliedToDatabase: boolean;
}

// ==================== MOCK DATA STORE ====================

let mockConversations: Conversation[] = [
  {
    id: '1',
    timestamp: new Date(2024, 10, 3, 14, 30).toISOString(),
    messages: [
      { id: '1-1', conversationId: '1', text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?', sender: 'bot', timestamp: new Date(2024, 10, 3, 14, 25).toISOString() },
      { id: '1-2', conversationId: '1', text: 'Mức thuế suất TNCN áp dụng như thế nào?', sender: 'user', timestamp: new Date(2024, 10, 3, 14, 30).toISOString() },
      { id: '1-3', conversationId: '1', text: 'Theo Luật Thuế Thu nhập cá nhân số 04/2007/QH12, mức thuế suất TNCN được áp dụng theo biểu lũy tiến từng phần với các mức từ 5% đến 35%.', sender: 'bot', timestamp: new Date(2024, 10, 3, 14, 30).toISOString() },
    ]
  },
  {
    id: '2',
    timestamp: new Date(2024, 10, 2, 10, 15).toISOString(),
    messages: [
      { id: '2-1', conversationId: '2', text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?', sender: 'bot', timestamp: new Date(2024, 10, 2, 10, 10).toISOString() },
      { id: '2-2', conversationId: '2', text: 'Hạn nộp tờ khai thuế quý là khi nào?', sender: 'user', timestamp: new Date(2024, 10, 2, 10, 15).toISOString() },
      { id: '2-3', conversationId: '2', text: 'Hạn nộp tờ khai thuế GTGT theo quý là ngày cuối cùng của tháng đầu quý tiếp theo.', sender: 'bot', timestamp: new Date(2024, 10, 2, 10, 16).toISOString() },
    ]
  },
  {
    id: '3',
    timestamp: new Date(2024, 10, 1, 16, 45).toISOString(),
    messages: [
      { id: '3-1', conversationId: '3', text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?', sender: 'bot', timestamp: new Date(2024, 10, 1, 16, 40).toISOString() },
      { id: '3-2', conversationId: '3', text: 'Cách tính thuế GTGT đầu vào', sender: 'user', timestamp: new Date(2024, 10, 1, 16, 45).toISOString() },
      { id: '3-3', conversationId: '3', text: 'Thuế GTGT đầu vào là số thuế GTGT ghi trên hóa đơn mua hàng hóa, dịch vụ được khấu trừ khi tính thuế GTGT phải nộp.', sender: 'bot', timestamp: new Date(2024, 10, 1, 16, 46).toISOString() },
    ]
  },
];

let mockDocuments: LawyerDocument[] = [
  { id: '1', name: 'Luật Thuế TNCN 2024.pdf', type: 'Luật Thuế TNCN', issueDate: new Date(2024, 0, 1).toISOString(), uploadDate: new Date(2024, 10, 1).toISOString(), size: '2.4 MB', reviewStatus: 'approved', reviewDate: new Date(2024, 10, 2).toISOString(), feedback: 'Tài liệu chính xác, đầy đủ. Phù hợp với quy định hiện hành.', uploadedBy: 'Luật sư Trần Thị B' },
  { id: '2', name: 'Thông tư 111-2013-TT-BTC.pdf', type: 'Thông tư', issueDate: new Date(2013, 8, 15).toISOString(), uploadDate: new Date(2024, 9, 20).toISOString(), size: '1.8 MB', reviewStatus: 'reviewed', reviewDate: new Date(2024, 9, 22).toISOString(), feedback: 'Đã xem xét. Cần cập nhật theo thông tư mới nhất.', uploadedBy: 'Luật sư Trần Thị B' },
  { id: '3', name: 'Nghị định 126-2020-NĐ-CP.docx', type: 'Nghị định', issueDate: new Date(2020, 9, 19).toISOString(), uploadDate: new Date(2024, 9, 15).toISOString(), size: '956 KB', reviewStatus: 'pending', uploadedBy: 'Luật sư Trần Thị B' },
  { id: '4', name: 'Luật Thuế GTGT 2024.pdf', type: 'Luật Thuế GTGT', issueDate: new Date(2024, 0, 1).toISOString(), uploadDate: new Date(2024, 9, 10).toISOString(), size: '3.2 MB', reviewStatus: 'approved', reviewDate: new Date(2024, 9, 12).toISOString(), feedback: 'Văn bản hợp lệ và cập nhật.', uploadedBy: 'Luật sư Trần Thị B' },
  { id: '5', name: 'Hướng dẫn khai thuế DN.pdf', type: 'Hướng dẫn', issueDate: new Date(2023, 11, 1).toISOString(), uploadDate: new Date(2024, 8, 5).toISOString(), size: '1.5 MB', reviewStatus: 'pending', uploadedBy: 'Luật sư Trần Thị B' },
  { id: '6', name: 'Tài liệu lỗi thời.pdf', type: 'Hướng dẫn', issueDate: new Date(2019, 5, 1).toISOString(), uploadDate: new Date(2024, 8, 1).toISOString(), size: '800 KB', reviewStatus: 'rejected', reviewDate: new Date(2024, 10, 8).toISOString(), feedback: 'Tài liệu đã lỗi thời, cần cập nhật theo quy định mới.', uploadedBy: 'Luật sư Trần Thị B', dataScientistFeedback: 'Tài liệu không phù hợp với hệ thống hiện tại. Yêu cầu xem xét lại hoặc cập nhật.' },
];

let mockRetrievalMatches: RetrievalMatch[] = [
  {
    id: '1',
    userQuery: 'Mức thuế suất TNCN áp dụng như thế nào?',
    chatbotResponse: 'Theo Luật Thuế Thu nhập cá nhân, mức thuế suất TNCN được áp dụng theo biểu lũy tiến từng phần với các mức từ 5% đến 35%.',
    retrievedSnippet: 'Điều 22. Biểu thuế lũy tiến từng phần đối với thu nhập từ tiền lương, tiền công: Bậc 1: Đến 5 triệu đồng - 5%, Bậc 2: Trên 5 đến 10 triệu đồng - 10%, Bậc 3: Trên 10 đến 18 triệu đồng - 15%, Bậc 4: Trên 18 đến 32 triệu đồng - 20%, Bậc 5: Trên 32 đến 52 triệu đồng - 25%, Bậc 6: Trên 52 đến 80 triệu đồng - 30%, Bậc 7: Trên 80 triệu đồng - 35%.',
    documentSource: 'Luật Thuế TNCN 2024.pdf',
    similarityScore: 0.92,
    timestamp: new Date(2024, 10, 3, 14, 30).toISOString(),
    status: 'accurate'
  },
  {
    id: '2',
    userQuery: 'Hạn nộp tờ khai thuế quý là khi nào?',
    chatbotResponse: 'Theo quy định, doanh nghiệp phải nộp tờ khai thuế GTGT theo quý chậm nhất là ngày cuối cùng của tháng đầu tiên của quý tiếp theo.',
    retrievedSnippet: 'Điều 44. Thời hạn nộp tờ khai thuế: Đối với khai thuế theo quý: chậm nhất là ngày thứ 30 của tháng đầu quý sau.',
    documentSource: 'Thông tư 111-2013-TT-BTC.pdf',
    similarityScore: 0.88,
    timestamp: new Date(2024, 10, 2, 16, 45).toISOString(),
    status: 'accurate'
  },
  {
    id: '3',
    userQuery: 'Cách tính thuế GTGT đầu vào',
    chatbotResponse: 'Thuế GTGT đầu vào được tính dựa trên hóa đơn hợp pháp của hàng hóa, dịch vụ mua vào phục vụ sản xuất kinh doanh.',
    retrievedSnippet: 'Điều 15. Thuế GTGT đầu vào được khấu trừ: Thuế GTGT đầu vào của hàng hóa, dịch vụ sử dụng cho sản xuất, kinh doanh hàng hóa, dịch vụ chịu thuế GTGT.',
    documentSource: 'Luật Thuế GTGT 2024.pdf',
    similarityScore: 0.79,
    timestamp: new Date(2024, 10, 2, 11, 20).toISOString(),
    status: 'partial'
  },
  {
    id: '4',
    userQuery: 'Thuế môn bài là gì?',
    chatbotResponse: 'Xin lỗi, tôi không tìm thấy thông tin cụ thể về vấn đề này trong cơ sở dữ liệu.',
    retrievedSnippet: 'N/A',
    documentSource: 'N/A',
    similarityScore: 0.32,
    timestamp: new Date(2024, 10, 2, 11, 20).toISOString(),
    status: 'inaccurate'
  },
  {
    id: '5',
    userQuery: 'Thuế suất doanh nghiệp nhỏ và vừa',
    chatbotResponse: 'Doanh nghiệp nhỏ và vừa có thể được áp dụng mức thuế suất ưu đãi 17% đối với phần thu nhập không vượt quá 200 tỷ đồng/năm, theo Nghị định 126/2020/NĐ-CP.',
    retrievedSnippet: 'Điều 9. Thuế suất ưu đãi: Doanh nghiệp nhỏ và vừa có doanh thu từ hoạt động SXKD không quá 200 tỷ đồng/năm được áp dụng thuế suất thuế TNDN là 17% đối với phần thu nhập chịu thuế từ hoạt động này.',
    documentSource: 'Nghị định 126-2020-NĐ-CP.docx',
    similarityScore: 0.85,
    timestamp: new Date(2024, 10, 1, 9, 15).toISOString(),
    status: 'accurate'
  },
];

let mockDatabaseDocuments: DatabaseDocument[] = [
  { 
    id: '1', 
    name: 'Luật Thuế TNCN 2024.pdf', 
    type: 'Luật Thuế TNCN', 
    uploadedBy: 'Luật sư Trần Thị B',
    uploadDate: new Date(2024, 10, 2).toISOString(),
    lawyerFeedback: 'Tài liệu chính xác, đầy đủ. Phù hợp với quy định hiện hành.',
    lawyerAction: 'add',
    reviewedBy: 'Luật sư Nguyễn Văn A',
    reviewDate: new Date(2024, 10, 2).toISOString(),
    dsApproved: true,
    appliedToDatabase: true
  },
  { 
    id: '2', 
    name: 'Thông tư 111-2013-TT-BTC.pdf', 
    type: 'Thông tư', 
    uploadedBy: 'Luật sư Trần Thị B',
    uploadDate: new Date(2024, 9, 22).toISOString(),
    lawyerFeedback: 'Đã xem xét. Cần cập nhật theo thông tư mới nhất.',
    lawyerAction: 'add',
    reviewedBy: 'Luật sư Nguyễn Văn A',
    reviewDate: new Date(2024, 9, 22).toISOString(),
    dsApproved: true,
    appliedToDatabase: true
  },
  { 
    id: '3', 
    name: 'Nghị định 126-2020-NĐ-CP.docx', 
    type: 'Nghị định', 
    uploadedBy: 'Luật sư Trần Thị B',
    uploadDate: new Date(2024, 9, 15).toISOString(),
    lawyerFeedback: 'Đang chờ đánh giá chi tiết',
    lawyerAction: 'add',
    reviewedBy: 'Luật sư Nguyễn Văn A',
    reviewDate: new Date(2024, 9, 15).toISOString(),
    dsApproved: false,
    appliedToDatabase: false
  },
  { 
    id: '4', 
    name: 'Luật Thuế GTGT 2024.pdf', 
    type: 'Luật Thuế GTGT', 
    uploadedBy: 'Luật sư Nguyễn Văn C',
    uploadDate: new Date(2024, 9, 10).toISOString(),
    lawyerFeedback: 'Văn bản hợp lệ và cập nhật.',
    lawyerAction: 'add',
    reviewedBy: 'Luật sư Trần Thị B',
    reviewDate: new Date(2024, 9, 12).toISOString(),
    dsApproved: true,
    appliedToDatabase: true
  },
  { 
    id: '5', 
    name: 'Luật cũ 2020.pdf', 
    type: 'Luật đã hết hiệu lực', 
    uploadedBy: 'Luật sư Nguyễn Văn C',
    uploadDate: new Date(2024, 9, 5).toISOString(),
    lawyerFeedback: 'Văn bản đã hết hiệu lực, cần loại bỏ khỏi hệ thống.',
    lawyerAction: 'remove',
    reviewedBy: 'Luật sư Trần Thị B',
    reviewDate: new Date(2024, 9, 10).toISOString(),
    dsApproved: true,
    appliedToDatabase: false
  },
  { 
    id: '6', 
    name: 'Hướng dẫn khai thuế DN.pdf', 
    type: 'Hướng dẫn', 
    uploadedBy: 'Luật sư Trần Thị B',
    uploadDate: new Date(2024, 8, 5).toISOString(),
    lawyerFeedback: 'Tài liệu cần xem xét thêm.',
    lawyerAction: 'add',
    reviewedBy: 'Luật sư Nguyễn Văn A',
    reviewDate: new Date(2024, 8, 5).toISOString(),
    dsApproved: false,
    appliedToDatabase: false
  },
];

// ==================== HELPER FUNCTIONS ====================

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== USER CHAT API ====================

export const userChatAPI = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    await delay(300);
    return [...mockConversations];
  },

  // Get messages for a specific conversation
  getConversationMessages: async (conversationId: string): Promise<Message[]> => {
    await delay(200);
    const conv = mockConversations.find(c => c.id === conversationId);
    return conv ? [...conv.messages] : [];
  },

  // Create new conversation
  createConversation: async (): Promise<Conversation> => {
    await delay(300);
    const newId = Date.now().toString();
    const welcomeMessage: Message = {
      id: `${newId}-1`,
      conversationId: newId,
      text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };
    
    const newConv: Conversation = {
      id: newId,
      timestamp: new Date().toISOString(),
      messages: [welcomeMessage],
    };
    
    mockConversations.unshift(newConv);
    return newConv;
  },

  // Send message and get bot response
  sendMessage: async (conversationId: string, message: string): Promise<{ userMessage: Message, botMessage: Message }> => {
    await delay(1000); // Simulate bot thinking time
    
    const userMessage: Message = {
      id: `${conversationId}-${Date.now()}`,
      conversationId,
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const botMessage: Message = {
      id: `${conversationId}-${Date.now() + 1}`,
      conversationId,
      text: 'Theo Luật Thuế Thu nhập cá nhân số 04/2007/QH12, mức thuế suất TNCN được áp dụng theo biểu lũy tiến từng phần với các mức từ 5% đến 35% tùy thuộc vào thu nhập chịu thuế. Bạn có muốn biết chi tiết về các bậc thuế không?',
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };

    // Update conversation in mock store
    const convIndex = mockConversations.findIndex(c => c.id === conversationId);
    if (convIndex !== -1) {
      mockConversations[convIndex].messages.push(userMessage, botMessage);
      mockConversations[convIndex].timestamp = new Date().toISOString();
    }

    return { userMessage, botMessage };
  },

  // Delete conversation
  deleteConversation: async (conversationId: string): Promise<boolean> => {
    await delay(200);
    mockConversations = mockConversations.filter(c => c.id !== conversationId);
    return true;
  },
};

// ==================== LAWYER DOCUMENT API ====================

export const lawyerDocumentAPI = {
  // Get all documents
  getDocuments: async (): Promise<LawyerDocument[]> => {
    await delay(300);
    return [...mockDocuments];
  },

  // Upload new document
  uploadDocument: async (document: Omit<LawyerDocument, 'id'>): Promise<LawyerDocument> => {
    await delay(500);
    const newDoc: LawyerDocument = {
      ...document,
      id: Date.now().toString(),
    };
    mockDocuments.push(newDoc);
    return newDoc;
  },

  // Review document
  reviewDocument: async (
    documentId: string,
    reviewStatus: 'reviewed' | 'approved',
    feedback: string
  ): Promise<LawyerDocument> => {
    await delay(400);
    const docIndex = mockDocuments.findIndex(d => d.id === documentId);
    if (docIndex === -1) throw new Error('Document not found');

    mockDocuments[docIndex] = {
      ...mockDocuments[docIndex],
      reviewStatus,
      feedback,
      reviewDate: new Date().toISOString(),
    };

    return mockDocuments[docIndex];
  },

  // Remove document
  removeDocument: async (documentId: string): Promise<boolean> => {
    await delay(300);
    mockDocuments = mockDocuments.filter(d => d.id !== documentId);
    return true;
  },
};

// ==================== DATA SCIENTIST API ====================

export const dataScientistAPI = {
  // Get retrieval matches
  getRetrievalMatches: async (): Promise<RetrievalMatch[]> => {
    await delay(400);
    return [...mockRetrievalMatches];
  },

  // Get database documents
  getDatabaseDocuments: async (): Promise<DatabaseDocument[]> => {
    await delay(300);
    return [...mockDatabaseDocuments];
  },

  // Update document status
  updateDocumentStatus: async (
    documentId: string,
    dsApproved: boolean,
    appliedToDatabase: boolean
  ): Promise<DatabaseDocument> => {
    await delay(500);
    const docIndex = mockDatabaseDocuments.findIndex(d => d.id === documentId);
    if (docIndex === -1) throw new Error('Document not found');

    mockDatabaseDocuments[docIndex] = {
      ...mockDatabaseDocuments[docIndex],
      dsApproved,
      appliedToDatabase,
    };

    return mockDatabaseDocuments[docIndex];
  },

  // Remove document from database
  removeDocument: async (documentId: string): Promise<boolean> => {
    await delay(400);
    mockDatabaseDocuments = mockDatabaseDocuments.filter(d => d.id !== documentId);
    return true;
  },

  // Batch process documents
  batchProcessDocuments: async (documentIds: string[], action: 'approve' | 'remove'): Promise<boolean> => {
    await delay(1500);
    if (action === 'remove') {
      mockDatabaseDocuments = mockDatabaseDocuments.filter(d => !documentIds.includes(d.id));
    } else {
      documentIds.forEach(id => {
        const docIndex = mockDatabaseDocuments.findIndex(d => d.id === id);
        if (docIndex !== -1) {
          mockDatabaseDocuments[docIndex].dsApproved = true;
          mockDatabaseDocuments[docIndex].appliedToDatabase = true;
        }
      });
    }
    return true;
  },

  // Export retrieval data
  exportRetrievalData: async (): Promise<string> => {
    await delay(500);
    return JSON.stringify(mockRetrievalMatches, null, 2);
  },
};
