import { useState, useEffect } from 'react';
import { FileText, Search, ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, Download, Loader2, Database, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { dataScientistAPI } from '../services/api';
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
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewDate?: Date;
  dsApproved: boolean;
  appliedToDatabase: boolean;
  isApplying?: boolean;
  selectedAction?: 'approve-add' | 'approve-remove' | 'reject' | 'remove-from-db';
}

export function DataScientistView() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fullTextDialog, setFullTextDialog] = useState<RetrievalMatch | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applyProgress, setApplyProgress] = useState(0);
  const [feedbackDialog, setFeedbackDialog] = useState<DatabaseDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Database documents
  const [databaseDocs, setDatabaseDocs] = useState<DatabaseDocument[]>([]);

  const [retrievalMatches, setRetrievalMatches] = useState<RetrievalMatch[]>([]);

  // Similarity distribution data
  const [similarityDistribution, setSimilarityDistribution] = useState<any[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load retrieval matches
      const matches = await dataScientistAPI.getRetrievalMatches();
      const convertedMatches = matches.map((m: any) => ({
        id: m.id,
        userQuery: m.user_query,
        chatbotResponse: m.chatbot_response,
        retrievedSnippet: m.retrieved_snippet,
        documentSource: m.document_source,
        similarityScore: m.similarity_score,
        timestamp: m.created_at ? new Date(m.created_at) : new Date(),
        status: m.status,
      }));
      setRetrievalMatches(convertedMatches);

      // Load similarity stats
      const stats = await dataScientistAPI.getSimilarityDistribution();
      setSimilarityDistribution(stats);

      // Load database documents
      const docs = await dataScientistAPI.getDatabaseDocuments();
      const convertedDocs = docs.map((d: any) => ({
        id: d.id,
        name: d.name || d.title || 'Untitled',
        type: d.type || d.tax_type || 'Unknown',
        uploadedBy: d.uploadedBy || 'Unknown',
        uploadDate: d.uploadDate ? new Date(d.uploadDate) : new Date(),
        lawyerFeedback: d.feedback, // mapped from lawyer_feedback in backend list_documents
        status: d.reviewStatus,
        reviewedBy: 'Luật sư', // Backend doesn't provide reviewer name yet, placeholder
        reviewDate: d.reviewDate ? new Date(d.reviewDate) : undefined,
        dsApproved: d.reviewStatus === 'approved',
        appliedToDatabase: d.in_vector_db,
      }));
      setDatabaseDocs(convertedDocs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const exportToJSON = async () => {
    try {
      // Call API to export data
      const jsonData = await dataScientistAPI.exportRetrievalData();

      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
      const exportFileDefaultName = `retrieval-matches-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
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
    const doc = databaseDocs.find((d: DatabaseDocument) => d.id === docId);
    if (!doc || !doc.selectedAction) return;

    setDatabaseDocs(databaseDocs.map((d: DatabaseDocument) =>
      d.id === docId ? { ...d, isApplying: true } : d
    ));

    try {
      if (
        doc.selectedAction === 'remove-from-db' ||
        doc.selectedAction === 'approve-remove'
      ) {
        // Call API to remove document
        await dataScientistAPI.removeDocument(docId);
        // Reload data to reflect changes
        await loadData();
        return;
      }

      // For approve-add action
      if (doc.selectedAction === 'approve-add') {
        await dataScientistAPI.updateDocumentStatus(docId, true);
        // Reload data from server to get updated status and appliedToDatabase
        await loadData();
      } else if (doc.selectedAction === 'reject') {
        await dataScientistAPI.updateDocumentStatus(docId, false);
        // Reload data from server to get updated status
        await loadData();
      }
    } catch (error) {
      console.error('Error applying action:', error);
      setDatabaseDocs(databaseDocs.map((d: DatabaseDocument) =>
        d.id === docId ? { ...d, isApplying: false } : d
      ));
    }
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
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Trạng thái DB</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {databaseDocs.map((doc) => {
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'pending': return { label: 'Pending', color: 'bg-gray-400' };
                          case 'reviewed': return { label: 'Reviewed', color: 'bg-[#1E88E5]' };
                          case 'approved': return { label: 'Approved', color: 'bg-green-500' };
                          case 'rejected': return { label: 'Rejected', color: 'bg-red-500' };
                          default: return { label: status, color: 'bg-gray-400' };
                        }
                      };

                      const statusBadge = getStatusBadge(doc.status);

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
                            <Badge className={statusBadge.color}>
                              {statusBadge.label}
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

                                  {doc.status === 'reviewed' && !doc.appliedToDatabase && (
                                    <SelectItem value="approve-add">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                        Phê duyệt & Thêm vào DB
                                      </div>
                                    </SelectItem>
                                  )}


                                  {doc.status === 'rejected' && !doc.appliedToDatabase && (
                                    <SelectItem value="approve-remove">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                        Phê duyệt Xóa khỏi DB
                                      </div>
                                    </SelectItem>
                                  )}

                                  {doc.appliedToDatabase && (
                                    <>
                                      <SelectItem value="reject">
                                        <div className="flex items-center gap-2">
                                          <XCircle className="w-3 h-3 text-red-600" />
                                          Từ chối & Gửi lại
                                        </div>
                                      </SelectItem>
                                      {/* <SelectItem value="remove-from-db">
                                        <div className="flex items-center gap-2">
                                          <Trash2 className="w-3 h-3 text-orange-600" />
                                          Xóa khỏi DB
                                        </div>
                                    </SelectItem> */}
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
                  <Label className="text-sm text-gray-500">Trạng thái</Label>
                  <div className="mt-2">
                    <Badge className={
                      feedbackDialog.status === 'approved' ? 'bg-green-500' :
                        feedbackDialog.status === 'reviewed' ? 'bg-[#1E88E5]' :
                          feedbackDialog.status === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                    }>
                      {feedbackDialog.status === 'approved' ? 'Approved' :
                        feedbackDialog.status === 'reviewed' ? 'Reviewed' :
                          feedbackDialog.status === 'rejected' ? 'Rejected' : 'Pending'}
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
    </div >
  );
}
