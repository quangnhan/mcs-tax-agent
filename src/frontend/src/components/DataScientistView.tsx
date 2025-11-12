import { useState } from 'react';
import { FileText, Search, ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, Download, Loader2, Database, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface RetrievalMatch {
  id: string;
  userQuery: string;
  chatbotResponse: string;
  retrievedSnippet: string;
  documentSource: string;
  similarityScore: number;
  timestamp: Date;
  status: 'accurate' | 'partial' | 'inaccurate';
}

interface DatabaseDocument {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadDate: Date;
  lawyerFeedback?: string;
  lawyerAction: 'add' | 'remove';
  reviewedBy?: string;
  reviewDate?: Date;
  dsApproved: boolean;
  appliedToDatabase: boolean;
  isApplying?: boolean;
  selectedAction?: 'approve-add' | 'approve-remove' | 'reject-send-back' | 'remove-from-db' | 'sent-back';
}

export function DataScientistView() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fullTextDialog, setFullTextDialog] = useState<RetrievalMatch | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applyProgress, setApplyProgress] = useState(0);
  
  // Database documents
  const [databaseDocs, setDatabaseDocs] = useState<DatabaseDocument[]>([
    { 
      id: '1', 
      name: 'Luật Thuế TNCN 2024.pdf', 
      type: 'Luật Thuế TNCN', 
      uploadedBy: 'Luật sư Trần Thị B',
      uploadDate: new Date(2024, 10, 2),
      lawyerFeedback: 'Tài liệu chính xác, đầy đủ. Phù hợp với quy định hiện hành.',
      lawyerAction: 'add',
      reviewedBy: 'Luật sư Nguyễn Văn A',
      reviewDate: new Date(2024, 10, 2),
      dsApproved: true,
      appliedToDatabase: true
    },
    { 
      id: '2', 
      name: 'Thông tư 111-2013-TT-BTC.pdf', 
      type: 'Thông tư', 
      uploadedBy: 'Luật sư Trần Thị B',
      uploadDate: new Date(2024, 9, 22),
      lawyerFeedback: 'Đã xem xét. Cần cập nhật theo thông tư mới nhất.',
      lawyerAction: 'add',
      reviewedBy: 'Luật sư Nguyễn Văn A',
      reviewDate: new Date(2024, 9, 22),
      dsApproved: true,
      appliedToDatabase: true
    },
    { 
      id: '3', 
      name: 'Nghị định 126-2020-NĐ-CP.docx', 
      type: 'Nghị định', 
      uploadedBy: 'Luật sư Trần Thị B',
      uploadDate: new Date(2024, 9, 15),
      lawyerFeedback: 'Đang chờ đánh giá chi tiết',
      lawyerAction: 'add',
      reviewedBy: 'Luật sư Nguyễn Văn A',
      reviewDate: new Date(2024, 9, 15),
      dsApproved: false,
      appliedToDatabase: false
    },
    { 
      id: '4', 
      name: 'Luật Thuế GTGT 2024.pdf', 
      type: 'Luật Thuế GTGT', 
      uploadedBy: 'Luật sư Nguyễn Văn C',
      uploadDate: new Date(2024, 9, 10),
      lawyerFeedback: 'Văn bản hợp lệ và cập nhật.',
      lawyerAction: 'add',
      reviewedBy: 'Luật sư Trần Thị B',
      reviewDate: new Date(2024, 9, 12),
      dsApproved: true,
      appliedToDatabase: true
    },
    { 
      id: '5', 
      name: 'Luật cũ 2020.pdf', 
      type: 'Luật đã hết hiệu lực', 
      uploadedBy: 'Luật sư Nguyễn Văn C',
      uploadDate: new Date(2024, 9, 5),
      lawyerFeedback: 'Văn bản đã hết hiệu lực, cần loại bỏ khỏi hệ thống.',
      lawyerAction: 'remove',
      reviewedBy: 'Luật sư Trần Thị B',
      reviewDate: new Date(2024, 9, 10),
      dsApproved: true,
      appliedToDatabase: false
    },
    { 
      id: '6', 
      name: 'Hướng dẫn khai thuế DN.pdf', 
      type: 'Hướng dẫn', 
      uploadedBy: 'Luật sư Trần Thị B',
      uploadDate: new Date(2024, 8, 5),
      lawyerFeedback: 'Tài liệu cần xem xét thêm.',
      lawyerAction: 'add',
      reviewedBy: 'Luật sư Nguyễn Văn A',
      reviewDate: new Date(2024, 8, 5),
      dsApproved: false,
      appliedToDatabase: false
    },
  ]);

  // Similarity distribution data
  const similarityDistribution = [
    { range: '0-20%', count: 12 },
    { range: '20-40%', count: 28 },
    { range: '40-60%', count: 45 },
    { range: '60-80%', count: 156 },
    { range: '80-100%', count: 243 },
  ];

  const retrievalMatches: RetrievalMatch[] = [
    {
      id: '1',
      userQuery: 'Mức thuế suất TNCN áp dụng như thế nào?',
      chatbotResponse: 'Theo Luật Thuế Thu nhập cá nhân, mức thuế suất TNCN được áp dụng theo biểu lũy tiến từng phần với các mức từ 5% đến 35%.',
      retrievedSnippet: 'Điều 22. Biểu thuế lũy tiến từng phần đối với thu nhập từ tiền lương, tiền công: Bậc 1: Đến 5 triệu đồng - 5%, Bậc 2: Trên 5 đến 10 triệu đồng - 10%, Bậc 3: Trên 10 đến 18 triệu đồng - 15%, Bậc 4: Trên 18 đến 32 triệu đồng - 20%, Bậc 5: Trên 32 đến 52 triệu đồng - 25%, Bậc 6: Trên 52 đến 80 triệu đồng - 30%, Bậc 7: Trên 80 triệu đồng - 35%.',
      documentSource: 'Luật Thuế TNCN 2024.pdf',
      similarityScore: 0.92,
      timestamp: new Date(2024, 10, 3, 14, 30),
      status: 'accurate'
    },
    {
      id: '2',
      userQuery: 'Hạn nộp tờ khai thuế quý là khi nào?',
      chatbotResponse: 'Theo quy định, doanh nghiệp phải nộp tờ khai thuế GTGT theo quý chậm nhất là ngày cuối cùng của tháng đầu tiên của quý tiếp theo.',
      retrievedSnippet: 'Điều 44. Thời hạn nộp tờ khai thuế: Đối với khai thuế theo quý: chậm nhất là ngày thứ 30 của tháng đầu quý sau.',
      documentSource: 'Thông tư 111-2013-TT-BTC.pdf',
      similarityScore: 0.88,
      timestamp: new Date(2024, 10, 2, 16, 45),
      status: 'accurate'
    },
    {
      id: '3',
      userQuery: 'Cách tính thuế GTGT đầu vào',
      chatbotResponse: 'Thuế GTGT đầu vào được tính dựa trên hóa đơn hợp pháp của hàng hóa, dịch vụ mua vào phục vụ sản xuất kinh doanh.',
      retrievedSnippet: 'Điều 15. Thuế GTGT đầu vào được khấu trừ: Thuế GTGT đầu vào của hàng hóa, dịch vụ sử dụng cho sản xuất, kinh doanh hàng hóa, dịch vụ chịu thuế GTGT.',
      documentSource: 'Luật Thuế GTGT 2024.pdf',
      similarityScore: 0.79,
      timestamp: new Date(2024, 10, 2, 11, 20),
      status: 'partial'
    },
    {
      id: '4',
      userQuery: 'Thuế môn bài là gì?',
      chatbotResponse: 'Xin lỗi, tôi không tìm thấy thông tin cụ thể về vấn đề này trong cơ sở dữ liệu.',
      retrievedSnippet: 'N/A',
      documentSource: 'N/A',
      similarityScore: 0.32,
      timestamp: new Date(2024, 10, 2, 11, 20),
      status: 'inaccurate'
    },
    {
      id: '5',
      userQuery: 'Thuế suất doanh nghiệp nhỏ và vừa',
      chatbotResponse: 'Doanh nghiệp nhỏ và vừa có thể được áp dụng mức thuế suất ưu đãi 17% đối với phần thu nhập không vượt quá 200 tỷ đồng/năm, theo Nghị định 126/2020/NĐ-CP.',
      retrievedSnippet: 'Điều 9. Thuế suất ưu đãi: Doanh nghiệp nhỏ và vừa có doanh thu từ hoạt động SXKD không quá 200 tỷ đồng/năm được áp dụng thuế suất thuế TNDN là 17% đối với phần thu nhập chịu thuế từ hoạt động này.',
      documentSource: 'Nghị định 126-2020-NĐ-CP.docx',
      similarityScore: 0.85,
      timestamp: new Date(2024, 10, 1, 9, 15),
      status: 'accurate'
    },
  ];

  const toggleRowExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accurate':
        return { label: 'Chính xác', color: 'bg-green-500' };
      case 'partial':
        return { label: 'Một phần', color: 'bg-orange-500' };
      case 'inaccurate':
        return { label: 'Không chính xác', color: 'bg-red-500' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500' };
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(retrievalMatches, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `retrieval-matches-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleActionSelect = (docId: string, action: string) => {
    // If action is 'view', open dialog immediately
    if (action === 'view') {
      const doc = databaseDocs.find(d => d.id === docId);
      if (doc) {
        setFeedbackDialog(doc);
      }
      return;
    }
    
    // Otherwise, set the selected action
    setDatabaseDocs(databaseDocs.map(doc => 
      doc.id === docId ? { ...doc, selectedAction: action as DatabaseDocument['selectedAction'] } : doc
    ));
  };

  const applySelectedAction = async (docId: string) => {
    const doc = databaseDocs.find(d => d.id === docId);
    if (!doc || !doc.selectedAction) return;

    setDatabaseDocs(databaseDocs.map(d => 
      d.id === docId ? { ...d, isApplying: true } : d
    ));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Delete document from table for these actions:
    // - sent-back and remove-from-db (for applied documents)
    // - approve-remove (approving a lawyer's removal request)
    // - reject-send-back (rejecting any document, including removal requests)
    if (
      doc.selectedAction === 'sent-back' || 
      doc.selectedAction === 'remove-from-db' ||
      doc.selectedAction === 'approve-remove' ||
      doc.selectedAction === 'reject-send-back'
    ) {
      setDatabaseDocs(databaseDocs.filter(d => d.id !== docId));
      return;
    }

    setDatabaseDocs(databaseDocs.map(d => {
      if (d.id === docId) {
        switch (doc.selectedAction) {
          case 'approve-add':
            // Approve and add to database
            return { ...d, isApplying: false, dsApproved: true, appliedToDatabase: true, selectedAction: undefined };
          
          default:
            return { ...d, isApplying: false, selectedAction: undefined };
        }
      }
      return d;
    }));
  };

  const handleApplyAll = async () => {
    setIsApplyingAll(true);
    setApplyProgress(0);

    // Apply all documents that have selected actions
    const docsWithActions = databaseDocs.filter(d => d.selectedAction);
    const totalDocs = docsWithActions.length;

    if (totalDocs === 0) {
      setIsApplyingAll(false);
      return;
    }

    for (let i = 0; i < docsWithActions.length; i++) {
      await applySelectedAction(docsWithActions[i].id);
      setApplyProgress(((i + 1) / totalDocs) * 100);
    }

    setIsApplyingAll(false);
    setApplyProgress(0);
  };

  const [feedbackDialog, setFeedbackDialog] = useState<DatabaseDocument | null>(null);

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-gray-900">Dashboard Data Scientist</h2>
          <p className="text-gray-500">Tối ưu hóa cơ sở dữ liệu tài liệu luật thuế</p>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="database">Quản Lý Cơ Sở Dữ Liệu</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Similarity Distribution Chart */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-900">Phân phối độ tương đồng Retrieval</h3>
                  <p className="text-sm text-gray-500">Phân tích chất lượng truy xuất tài liệu</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={exportToJSON}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={similarityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#1E88E5" name="Số lượng truy vấn" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Retrieval Match Table */}
            <Card className="bg-white">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-6 h-6 text-[#1E88E5]" />
                  <h3 className="text-gray-900">Chi tiết Retrieval Matching</h3>
                </div>

                <div className="space-y-3">
                  {retrievalMatches.map((match) => {
                    const isExpanded = expandedRows.has(match.id);
                    const statusBadge = getStatusBadge(match.status);

                    return (
                      <Card key={match.id} className="border border-gray-200">
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600">Truy vấn:</p>
                                <p className="text-sm">{match.userQuery}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge className={statusBadge.color}>
                                  {statusBadge.label}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDate(match.timestamp)} {formatTime(match.timestamp)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Similarity: {(match.similarityScore * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFullTextDialog(match)}
                                className="gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Xem đầy đủ
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpanded(match.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                            {/* Chatbot Response */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-[#1E88E5]" />
                                <p className="text-sm text-gray-500">Phản hồi Chatbot:</p>
                              </div>
                              <p className="text-sm text-gray-700 pl-4">{match.chatbotResponse}</p>
                            </div>

                            {/* Retrieved Snippet */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <p className="text-sm text-gray-500">Văn bản được trích xuất:</p>
                              </div>
                              <p className="text-sm text-gray-700 pl-4 italic bg-gray-50 p-3 rounded">
                                "{match.retrievedSnippet}"
                              </p>
                              <p className="text-xs text-gray-500 mt-2 pl-4">
                                Nguồn: {match.documentSource}
                              </p>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            {/* Database Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng tài liệu</p>
                    <p className="text-gray-900">{databaseDocs.length}</p>
                  </div>
                  <Database className="w-8 h-8 text-[#1E88E5]" />
                </div>
              </Card>
              
              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Đã phê duyệt</p>
                    <p className="text-gray-900">{databaseDocs.filter(d => d.dsApproved).length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Đã áp dụng</p>
                    <p className="text-gray-900">{databaseDocs.filter(d => d.appliedToDatabase).length}</p>
                  </div>
                  <Database className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Hành động đã chọn</p>
                    <p className="text-gray-900">{databaseDocs.filter(d => d.selectedAction).length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-[#1E88E5]" />
                </div>
              </Card>
            </div>

            {/* Apply All Progress */}
            {isApplyingAll && (
              <Card className="p-4 bg-blue-50 border-[#1E88E5]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-900">Đang áp dụng tài liệu vào cơ sở dữ liệu...</p>
                    <p className="text-sm text-[#1E88E5]">{Math.round(applyProgress)}%</p>
                  </div>
                  <Progress value={applyProgress} className="h-2" />
                </div>
              </Card>
            )}

            {/* Documents Table */}
            <Card className="bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-900">Tất cả tài liệu trong hệ thống</h3>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 gap-2"
                    onClick={handleApplyAll}
                    disabled={isApplyingAll || databaseDocs.filter(d => d.selectedAction).length === 0}
                  >
                    {isApplyingAll ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang áp dụng...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        Apply All
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Phê duyệt hoặc từ chối tài liệu từ luật sư. Nhấn "Apply" để thực hiện hành động hoặc gửi lại cho luật sư.
                </p>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên tài liệu</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tải lên bởi</TableHead>
                      <TableHead>Hành động Luật sư</TableHead>
                      <TableHead>Trạng thái DB</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {databaseDocs.map((doc) => {
                      const getActionBadge = (action: string) => {
                        switch (action) {
                          case 'add':
                            return { label: 'Thêm mới', color: 'bg-green-500' };
                          case 'remove':
                            return { label: 'Xóa bỏ', color: 'bg-red-500' };
                          default:
                            return { label: 'Unknown', color: 'bg-gray-500' };
                        }
                      };

                      const actionBadge = getActionBadge(doc.lawyerAction);

                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#1E88E5]" />
                              <span>{doc.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{doc.type}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-[#1E88E5]">{doc.uploadedBy}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={actionBadge.color}>
                              {actionBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {doc.isApplying ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#1E88E5]" />
                                <span className="text-xs text-gray-500">Đang xử lý...</span>
                              </div>
                            ) : doc.appliedToDatabase ? (
                              <Badge className="bg-green-500">Đã áp dụng</Badge>
                            ) : (
                              <Badge variant="outline">Chưa áp dụng</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={doc.selectedAction || ''}
                                onValueChange={(value) => handleActionSelect(doc.id, value)}
                              >
                                <SelectTrigger className="w-[200px] h-8 text-xs">
                                  <SelectValue placeholder="Chọn hành động..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="view">
                                    <div className="flex items-center gap-2">
                                      <Eye className="w-3 h-3" />
                                      Xem chi tiết
                                    </div>
                                  </SelectItem>
                                  
                                  {!doc.appliedToDatabase && doc.lawyerAction === 'add' && (
                                    <SelectItem value="approve-add">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                        Phê duyệt & Thêm vào DB
                                      </div>
                                    </SelectItem>
                                  )}
                                  
                                  {!doc.appliedToDatabase && doc.lawyerAction === 'remove' && (
                                    <SelectItem value="approve-remove">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                        Phê duyệt Xóa
                                      </div>
                                    </SelectItem>
                                  )}
                                  
                                  {!doc.appliedToDatabase && (
                                    <SelectItem value="reject-send-back">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="w-3 h-3 text-red-600" />
                                        Từ chối & Gửi lại
                                      </div>
                                    </SelectItem>
                                  )}
                                  
                                  {doc.appliedToDatabase && (
                                    <>
                                      <SelectItem value="sent-back">
                                        <div className="flex items-center gap-2">
                                          <XCircle className="w-3 h-3 text-red-600" />
                                          Gửi lại
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="remove-from-db">
                                        <div className="flex items-center gap-2">
                                          <Trash2 className="w-3 h-3 text-orange-600" />
                                          Xóa khỏi DB
                                        </div>
                                      </SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              
                              {doc.selectedAction && doc.selectedAction !== 'view' && (
                                <Button
                                  size="sm"
                                  className="bg-[#1E88E5] hover:bg-[#1976D2] gap-1"
                                  onClick={() => applySelectedAction(doc.id)}
                                  disabled={doc.isApplying}
                                >
                                  {doc.isApplying ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Database className="w-3 h-3" />
                                  )}
                                  Apply
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-4 bg-blue-50 border-[#1E88E5]">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-[#1E88E5] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">Quy trình quản lý cơ sở dữ liệu</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Xem xét và phê duyệt các tài liệu đã được Luật sư đánh giá. Các tài liệu được phê duyệt sẽ được áp dụng vào cơ sở dữ liệu vector. 
                    Sử dụng "Apply" cho từng tài liệu hoặc "Apply All" để áp dụng tất cả tài liệu đã phê duyệt.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Full Text Dialog */}
        <Dialog open={!!fullTextDialog} onOpenChange={() => setFullTextDialog(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Chi tiết Retrieval Match</DialogTitle>
              <DialogDescription>
                Xem thông tin đầy đủ về truy vấn, phản hồi và văn bản được trích xuất
              </DialogDescription>
            </DialogHeader>
            {fullTextDialog && (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-6 p-4">
                  <div>
                    <Label className="text-sm text-gray-500">Truy vấn người dùng</Label>
                    <p className="mt-2 text-sm">{fullTextDialog.userQuery}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Phản hồi Chatbot</Label>
                    <p className="mt-2 text-sm text-gray-700">{fullTextDialog.chatbotResponse}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Văn bản được trích xuất</Label>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded italic">
                      "{fullTextDialog.retrievedSnippet}"
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Nguồn tài liệu</Label>
                      <p className="mt-2 text-sm">{fullTextDialog.documentSource}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Độ tương đồng</Label>
                      <p className="mt-2 text-sm">{(fullTextDialog.similarityScore * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Thời gian</Label>
                    <p className="mt-2 text-sm">{formatDate(fullTextDialog.timestamp)} {formatTime(fullTextDialog.timestamp)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Trạng thái</Label>
                    <div className="mt-2">
                      <Badge className={getStatusBadge(fullTextDialog.status).color}>
                        {getStatusBadge(fullTextDialog.status).label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Lawyer Feedback Dialog */}
        <Dialog open={!!feedbackDialog} onOpenChange={() => setFeedbackDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thông tin đánh giá từ Luật sư</DialogTitle>
              <DialogDescription>
                Chi tiết đánh giá và nhận xét từ Luật sư về tài liệu
              </DialogDescription>
            </DialogHeader>
            {feedbackDialog && (
              <div className="space-y-4 p-4">
                <div>
                  <Label className="text-sm text-gray-500">Tên tài liệu</Label>
                  <p className="mt-2 text-sm">{feedbackDialog.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Loại tài liệu</Label>
                    <p className="mt-2 text-sm">{feedbackDialog.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Tải lên bởi</Label>
                    <p className="mt-2 text-sm text-[#1E88E5]">{feedbackDialog.uploadedBy}</p>
                  </div>
                </div>

                {feedbackDialog.reviewedBy && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Đánh giá bởi</Label>
                      <p className="mt-2 text-sm">{feedbackDialog.reviewedBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Ngày đánh giá</Label>
                      <p className="mt-2 text-sm">{feedbackDialog.reviewDate ? formatDate(feedbackDialog.reviewDate) : 'N/A'}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm text-gray-500">Hành động của Luật sư</Label>
                  <div className="mt-2">
                    <Badge className={
                      feedbackDialog.lawyerAction === 'add' ? 'bg-green-500' :
                      feedbackDialog.lawyerAction === 'update' ? 'bg-[#1E88E5]' :
                      feedbackDialog.lawyerAction === 'remove' ? 'bg-red-500' : 'bg-gray-400'
                    }>
                      {feedbackDialog.lawyerAction === 'add' ? 'Thêm mới' :
                       feedbackDialog.lawyerAction === 'update' ? 'Cập nhật' :
                       feedbackDialog.lawyerAction === 'remove' ? 'Xóa bỏ' : 'Chưa đánh giá'}
                    </Badge>
                  </div>
                </div>
                
                {feedbackDialog.lawyerFeedback && (
                  <div>
                    <Label className="text-sm text-gray-500">Nhận xét từ Luật sư</Label>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded">
                      {feedbackDialog.lawyerFeedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
