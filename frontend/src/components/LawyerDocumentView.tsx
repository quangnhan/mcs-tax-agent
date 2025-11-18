import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, Download, Eye, MessageSquare, CheckCircle, Upload, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { lawyerDocumentAPI } from '../services/mockApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface Document {
  id: string;
  name: string;
  type: string;
  issueDate: Date;
  uploadDate: Date;
  size: string;
  reviewStatus: 'pending' | 'reviewed' | 'approved' | 'rejected';
  feedback?: string;
  reviewDate?: Date;
  uploadedBy: string;
  dataScientistFeedback?: string;
}

export function LawyerDocumentView() {
  const currentLawyer = 'Luật sư Nguyễn Văn A';
  const assignedLawyer = 'Luật sư Trần Thị B'; // Randomly assigned by system

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await lawyerDocumentAPI.getDocuments();
      const convertedDocs = docs.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        issueDate: new Date(d.issueDate),
        uploadDate: new Date(d.uploadDate),
        size: d.size,
        reviewStatus: d.reviewStatus,
        feedback: d.feedback,
        reviewDate: d.reviewDate ? new Date(d.reviewDate) : undefined,
        uploadedBy: d.uploadedBy,
        dataScientistFeedback: d.dataScientistFeedback,
      }));
      setDocuments(convertedDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterReviewStatus, setFilterReviewStatus] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewAction, setReviewAction] = useState<'reviewed' | 'approved'>('reviewed');

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesReviewStatus = filterReviewStatus === 'all' || doc.reviewStatus === filterReviewStatus;
    return matchesSearch && matchesType && matchesReviewStatus;
  });

  const documentTypes = Array.from(new Set(documents.map((doc) => doc.type)));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN');
  };

  const handleReviewSubmit = async () => {
    if (!selectedDoc) return;
    
    try {
      // Call API to review document
      const updatedDoc = await lawyerDocumentAPI.reviewDocument(
        selectedDoc.id,
        reviewAction,
        reviewFeedback
      );
      
      // Update local state
      setDocuments(documents.map(doc => 
        doc.id === selectedDoc.id 
          ? {
              ...doc,
              reviewStatus: updatedDoc.reviewStatus,
              feedback: updatedDoc.feedback,
              reviewDate: updatedDoc.reviewDate ? new Date(updatedDoc.reviewDate) : undefined,
            }
          : doc
      ));
      
      setIsReviewOpen(false);
      setSelectedDoc(null);
      setReviewFeedback('');
    } catch (error) {
      console.error('Error reviewing document:', error);
    }
  };

  const openReviewDialog = (doc: Document) => {
    setSelectedDoc(doc);
    setReviewFeedback(doc.feedback || '');
    setIsReviewOpen(true);
  };

  const handleRemoveDocument = async (docId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        // Call API to remove document
        await lawyerDocumentAPI.removeDocument(docId);
        
        // Update local state
        setDocuments(documents.filter(doc => doc.id !== docId));
      } catch (error) {
        console.error('Error removing document:', error);
      }
    }
  };

  const getReviewStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Đã phê duyệt', color: 'bg-[#1E88E5]' };
      case 'reviewed':
        return { label: 'Đã xem xét', color: 'bg-green-500' };
      case 'pending':
        return { label: 'Chờ xem xét', color: 'bg-orange-500' };
      case 'rejected':
        return { label: 'Bị từ chối', color: 'bg-red-500' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500' };
    }
  };

  const pendingCount = documents.filter(d => d.reviewStatus === 'pending').length;
  const reviewedCount = documents.filter(d => d.reviewStatus === 'reviewed').length;
  const approvedCount = documents.filter(d => d.reviewStatus === 'approved').length;
  const rejectedCount = documents.filter(d => d.reviewStatus === 'rejected').length;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Quản lý Tài liệu Luật Thuế</h2>
            <p className="text-gray-500">Tải lên, xem xét và đánh giá các văn bản pháp luật về thuế</p>
          </div>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#1E88E5] hover:bg-[#1976D2]">
                <Upload className="w-4 h-4" />
                Tải lên tài liệu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tải lên tài liệu mới</DialogTitle>
                <DialogDescription>
                  Tải lên văn bản pháp luật về thuế để thêm vào hệ thống
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Chọn file (PDF/DOCX)</Label>
                  <Input id="file" type="file" accept=".pdf,.docx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docType">Loại tài liệu</Label>
                  <Select>
                    <SelectTrigger id="docType">
                      <SelectValue placeholder="Chọn loại tài liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luat-tncn">Luật Thuế TNCN</SelectItem>
                      <SelectItem value="luat-gtgt">Luật Thuế GTGT</SelectItem>
                      <SelectItem value="thong-tu">Thông tư</SelectItem>
                      <SelectItem value="nghi-dinh">Nghị định</SelectItem>
                      <SelectItem value="huong-dan">Hướng dẫn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Ngày ban hành</Label>
                  <Input id="issueDate" type="date" />
                </div>
                <Button className="w-full bg-[#1E88E5] hover:bg-[#1976D2]" onClick={() => setIsUploadOpen(false)}>
                  Tải lên
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng tài liệu</p>
                <p className="text-gray-900">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-[#1E88E5]" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ xem xét</p>
                <p className="text-gray-900">{pendingCount}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã xem xét</p>
                <p className="text-gray-900">{reviewedCount}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã phê duyệt</p>
                <p className="text-gray-900">{approvedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#1E88E5]" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bị từ chối</p>
                <p className="text-gray-900">{rejectedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Info Alert */}
        <Card className="p-4 bg-blue-50 border-[#1E88E5]">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-[#1E88E5] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900">Hệ thống đánh giá chéo (Peer Review)</p>
              <p className="text-sm text-gray-600 mt-1">
                Bạn đang đánh giá tài liệu từ <span className="font-medium text-[#1E88E5]">{assignedLawyer}</span>. 
                Hệ thống tự động phân công ngẫu nhiên để đảm bảo tính khách quan trong đánh giá tài liệu pháp luật.
              </p>
            </div>
          </div>
        </Card>

        {/* Search and Filter */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tài liệu..."
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterReviewStatus} onValueChange={setFilterReviewStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Trạng thái xem xét" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xem xét</SelectItem>
                <SelectItem value="reviewed">Đã xem xét</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Documents Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tài liệu</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Ngày ban hành</TableHead>
                <TableHead>Tải lên bởi</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const statusBadge = getReviewStatusBadge(doc.reviewStatus);
                
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1E88E5]" />
                        <span>{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.issueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#1E88E5]">{doc.uploadedBy}</span>
                    </TableCell>
                    <TableCell>{doc.size}</TableCell>
                    <TableCell>
                      <Badge className={statusBadge.color}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openReviewDialog(doc)}
                          title="Xem xét và đánh giá"
                        >
                          <MessageSquare className="w-4 h-4 text-[#1E88E5]" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveDocument(doc.id)}
                          title="Xóa tài liệu"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Review Dialog */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Đánh giá tài liệu</DialogTitle>
              <DialogDescription>
                Xem xét và cung cấp nhận xét về tài liệu pháp luật
              </DialogDescription>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tài liệu</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <FileText className="w-5 h-5 text-[#1E88E5]" />
                    <div>
                      <p className="text-sm">{selectedDoc.name}</p>
                      <p className="text-xs text-gray-500">{selectedDoc.type}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Ngày ban hành</Label>
                    <p className="text-sm">{formatDate(selectedDoc.issueDate)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Kích thước</Label>
                    <p className="text-sm">{selectedDoc.size}</p>
                  </div>
                </div>

                {selectedDoc.reviewDate && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Đã xem xét lần cuối</Label>
                    <p className="text-sm">{formatDate(selectedDoc.reviewDate)}</p>
                  </div>
                )}

                {selectedDoc.dataScientistFeedback && selectedDoc.reviewStatus === 'rejected' && (
                  <Card className="p-4 bg-red-50 border-red-200">
                    <div>
                      <Label className="text-sm text-red-700">Phản hồi từ Data Scientist (Đã từ chối)</Label>
                      <p className="text-sm text-red-600 mt-2">{selectedDoc.dataScientistFeedback}</p>
                    </div>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reviewAction">Hành động</Label>
                  <Select value={reviewAction} onValueChange={(value: 'reviewed' | 'approved') => setReviewAction(value)}>
                    <SelectTrigger id="reviewAction">
                      <SelectValue placeholder="Chọn hành động" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reviewed">Đánh dấu đã xem xét</SelectItem>
                      <SelectItem value="approved">Phê duyệt tài liệu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Nhận xét / Phản hồi</Label>
                  <Textarea
                    id="feedback"
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Nhập nhận xét hoặc phản hồi về tài liệu..."
                    rows={5}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                Hủy
              </Button>
              <Button 
                className="bg-[#1E88E5] hover:bg-[#1976D2]"
                onClick={handleReviewSubmit}
              >
                Lưu đánh giá
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
