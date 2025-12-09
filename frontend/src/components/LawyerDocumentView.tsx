import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, Download, Eye, MessageSquare, CheckCircle, Upload, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { lawyerDocumentAPI } from '../services/api';
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
  const [currentLawyer, setCurrentLawyer] = useState('Luật sư');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCurrentLawyer(u.name || u.email);
      } catch { }
    }
  }, []);
  const [assignedLawyer, setAssignedLawyer] = useState('Đang tải...');

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
      const convertedDocs = docs.map((d: any) => ({
        id: d.id,
        name: d.name || d.title || 'Untitled',
        type: d.type || 'Unknown',
        issueDate: d.issueDate ? new Date(d.issueDate) : new Date(d.uploadDate || Date.now()),
        uploadDate: d.uploadDate ? new Date(d.uploadDate) : new Date(),
        size: d.size || '0 KB',
        reviewStatus: d.reviewStatus || 'pending',
        feedback: d.feedback,
        reviewDate: d.reviewDate ? new Date(d.reviewDate) : undefined,
        uploadedBy: d.uploadedBy || 'Unknown',
        dataScientistFeedback: d.dataScientistFeedback,
      }));
      setDocuments(convertedDocs);

      // Update assigned lawyer display based on unique uploaders in the list
      // This matches the requirement: "Modify the assginedLawyer in LAwyer UI. it is indeed the uploaded laywer's name."
      const uniqueUploaders = Array.from(new Set(convertedDocs.map((d: any) => d.uploadedBy))).filter(name => name !== 'Unknown');
      if (uniqueUploaders.length > 0) {
        setAssignedLawyer(uniqueUploaders.join(', '));
      } else {
        setAssignedLawyer('Chưa có tài liệu được phân công');
      }
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('luat-tncn');
  const [uploadIssueDate, setUploadIssueDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [reviewAction, setReviewAction] = useState<'reviewed'>('reviewed');

  // ... (existing code)

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn file");
      return;
    }
    if (!uploadDocType) {
      alert("Vui lòng chọn loại tài liệu");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name.replace(/\.[^/.]+$/, "")); // Auto title from filename
      formData.append('tax_type', uploadDocType);
      if (uploadIssueDate) {
        // Backend might not support issue_date in create endpoint yet?
        // Checking backend code... document_routes.py create_document (lines 136-188)
        // It reads: title, description, tax_type, file.
        // It DOES NOT read 'issue_date' from form. It uses func.now() for created_at.
        // The requirement didn't strictly say I must save issue_date, but the UI has it.
        // I'll append it anyway, maybe backend ignores it, or I should update backend if critical.
        // Requirement says "upload documents (use /create endpoint as written)".
        // "as written" implies don't change backend create if possible.
        // So I will just send it, if backend ignores, fine. 
        // Or I can add 'description' if useful.
        formData.append('issue_date', uploadIssueDate);
      }

      await lawyerDocumentAPI.uploadDocument(formData);

      // Refresh list
      await loadDocuments();

      // Reset and close
      setSelectedFile(null);
      setUploadIssueDate('');
      setIsUploadOpen(false);
      alert("Tải lên thành công!");
    } catch (e) {
      console.error("Upload failed", e);
      alert("Tải lên thất bại: " + (e as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocuments = documents
    .filter((doc: Document) => doc.reviewStatus !== 'approved') // Hide approved documents
    .filter((doc: Document) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      const matchesReviewStatus = filterReviewStatus === 'all' || doc.reviewStatus === filterReviewStatus;
      return matchesSearch && matchesType && matchesReviewStatus;
    });

  // ... (lines 103-277 unchanged)

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

  const handleRejectDocument = async (docId: string) => {
    if (confirm('Bạn có muốn TỪ CHỐI tài liệu này không? (Hành động này sẽ chuyển trạng thái sang Bị từ chối)')) {
      try {
        // "remove document at lawyer ui indeeds reject only"
        // We use reviewDocument with status 'rejected'
        await lawyerDocumentAPI.reviewDocument(docId, 'rejected', 'Từ chối nhanh từ giao diện danh sách');

        // Update local state
        setDocuments(documents.map(doc =>
          doc.id === docId
            ? { ...doc, reviewStatus: 'rejected', feedback: 'Từ chối nhanh từ giao diện danh sách' }
            : doc
        ));
      } catch (error) {
        console.error('Error rejecting document:', error);
      }
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      await lawyerDocumentAPI.downloadDocument(doc.id, doc.name);
    } catch (e) {
      console.error("Download failed", e);
      alert("Không thể tải xuống tài liệu");
    }
  };

  const getReviewStatusBadge = (status: string) => {
    switch (status) {
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
  const rejectedCount = documents.filter(d => d.reviewStatus === 'rejected').length;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900 font-bold text-xl">Xin chào, {currentLawyer}</h2>
            <p className="text-gray-500">Quản lý tài liệu và đánh giá chéo các văn bản pháp luật</p>
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
                  <Label htmlFor="file">Chọn file (TXT)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".txt"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docType">Loại tài liệu</Label>
                  <Select value={uploadDocType} onValueChange={setUploadDocType}>
                    <SelectTrigger id="docType">
                      <SelectValue placeholder="Chọn loại tài liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luat-tncn">Luật Thuế TNCN</SelectItem>
                      <SelectItem value="luat-gtgt">Luật Thuế GTGT</SelectItem>
                      <SelectItem value="thong-tu">Thông tư</SelectItem>
                      <SelectItem value="nghi-dinh">Nghị định</SelectItem>
                      <SelectItem value="huong-dan">Hướng dẫn</SelectItem>
                      <SelectItem value="khac">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Ngày ban hành</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={uploadIssueDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUploadIssueDate(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-[#1E88E5] hover:bg-[#1976D2]"
                  onClick={handleFileUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Đang tải lên..." : "Tải lên"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng tài liệu</p>
                <p className="text-gray-900">{filteredDocuments.length}</p>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
                <SelectItem value="rejected">Bị từ chối</SelectItem>
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
                          onClick={() => handleDownload(doc)}
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
                          onClick={() => handleRejectDocument(doc.id)}
                          title="Từ chối tài liệu"
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
                  <Select value={reviewAction} onValueChange={(value: 'reviewed') => setReviewAction(value)}>
                    <SelectTrigger id="reviewAction">
                      <SelectValue placeholder="Chọn hành động" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reviewed">Đánh dấu đã xem xét</SelectItem>
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
