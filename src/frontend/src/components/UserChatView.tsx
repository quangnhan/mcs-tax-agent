import { useState, useEffect } from 'react';
import { Send, Plus, Clock, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Conversation {
  id: string;
  timestamp: Date;
}

// Store messages for each conversation
type ConversationMessages = {
  [conversationId: string]: Message[];
};

export function UserChatView() {
  // Initialize with sample conversations and their messages
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', timestamp: new Date(2024, 10, 3, 14, 30) },
    { id: '2', timestamp: new Date(2024, 10, 2, 10, 15) },
    { id: '3', timestamp: new Date(2024, 10, 1, 16, 45) },
  ]);

  const [conversationMessages, setConversationMessages] = useState<ConversationMessages>({
    '1': [
      { id: '1-1', text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?', sender: 'bot', timestamp: new Date(2024, 10, 3, 14, 25) },
      { id: '1-2', text: 'Mức thuế suất TNCN áp dụng như thế nào?', sender: 'user', timestamp: new Date(2024, 10, 3, 14, 30) },
      { id: '1-3', text: 'Theo Luật Thuế Thu nhập cá nhân số 04/2007/QH12, mức thuế suất TNCN được áp dụng theo biểu lũy tiến từng phần với các mức từ 5% đến 35%.', sender: 'bot', timestamp: new Date(2024, 10, 3, 14, 30) },
    ],
    '2': [
      { id: '2-1', text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?', sender: 'bot', timestamp: new Date(2024, 10, 2, 10, 10) },
      { id: '2-2', text: 'Hạn nộp tờ khai thuế quý là khi nào?', sender: 'user', timestamp: new Date(2024, 10, 2, 10, 15) },
      { id: '2-3', text: 'Hạn nộp tờ khai thuế GTGT theo quý là ngày cuối cùng của tháng đầu quý tiếp theo.', sender: 'bot', timestamp: new Date(2024, 10, 2, 10, 16) },
    ],
    '3': [
      { id: '3-1', text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?', sender: 'bot', timestamp: new Date(2024, 10, 1, 16, 40) },
      { id: '3-2', text: 'Cách tính thuế GTGT đầu vào', sender: 'user', timestamp: new Date(2024, 10, 1, 16, 45) },
      { id: '3-3', text: 'Thuế GTGT đầu vào là số thuế GTGT ghi trên hóa đơn mua hàng hóa, dịch vụ được khấu trừ khi tính thuế GTGT phải nộp.', sender: 'bot', timestamp: new Date(2024, 10, 1, 16, 46) },
    ],
  });

  const [inputMessage, setInputMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(conversations[0].id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Get messages for current conversation
  const currentMessages = conversationMessages[selectedConversation] || [];

  // Get last message for a conversation
  const getLastMessage = (conversationId: string): Message | null => {
    const messages = conversationMessages[conversationId] || [];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `${selectedConversation}-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    // Update messages for current conversation
    setConversationMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), userMessage],
    }));

    // Update conversation timestamp
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, timestamp: new Date() }
          : conv
      ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );

    setInputMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: `${selectedConversation}-${Date.now() + 1}`,
        text: 'Theo Luật Thuế Thu nhập cá nhân số 04/2007/QH12, mức thuế suất TNCN được áp dụng theo biểu lũy tiến từng phần với các mức từ 5% đến 35% tùy thuộc vào thu nhập chịu thuế. Bạn có muốn biết chi tiết về các bậc thuế không?',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setConversationMessages(prev => ({
        ...prev,
        [selectedConversation]: [...(prev[selectedConversation] || []), botMessage],
      }));

      // Update conversation timestamp again
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, timestamp: new Date() }
            : conv
        ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      );
    }, 1000);
  };

  const handleNewConversation = () => {
    const newConvId = Date.now().toString();
    const welcomeMessage: Message = {
      id: `${newConvId}-1`,
      text: 'Xin chào! Tôi là trợ lý AI về luật thuế Việt Nam. Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      timestamp: new Date(),
    };

    // Create new conversation
    const newConversation: Conversation = {
      id: newConvId,
      timestamp: new Date(),
    };

    // Add to conversations list (at the top)
    setConversations([newConversation, ...conversations]);

    // Initialize messages for new conversation
    setConversationMessages(prev => ({
      ...prev,
      [newConvId]: [welcomeMessage],
    }));

    // Select the new conversation
    setSelectedConversation(newConvId);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleDeleteConversation = (convId: string) => {
    setConversationToDelete(convId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      // Remove conversation
      setConversations(conversations.filter(c => c.id !== conversationToDelete));
      
      // Remove messages for this conversation
      setConversationMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationToDelete];
        return newMessages;
      });

      // If deleting the selected conversation, select another one
      if (selectedConversation === conversationToDelete && conversations.length > 1) {
        const remaining = conversations.filter(c => c.id !== conversationToDelete);
        setSelectedConversation(remaining[0].id);
      }
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  // Sort conversations by timestamp (most recent first)
  const sortedConversations = [...conversations].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="h-full flex">
      {/* Sidebar - Conversation History */}
      <div className="w-80 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button 
            className="w-full gap-2 bg-[#1E88E5] hover:bg-[#1976D2]"
            onClick={handleNewConversation}
          >
            <Plus className="w-4 h-4" />
            Cuộc trò chuyện mới
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {sortedConversations.map((conv) => {
              const lastMessage = getLastMessage(conv.id);
              return (
                <Card
                  key={conv.id}
                  className={`p-3 mb-2 cursor-pointer transition-colors ${
                    selectedConversation === conv.id ? 'bg-blue-50 border-[#1E88E5]' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1 min-w-0">
                      {lastMessage && (
                        <>
                          <p className={`text-sm line-clamp-2 ${
                            lastMessage.sender === 'user' 
                              ? 'text-gray-900' 
                              : 'text-gray-600'
                          }`}>
                            {lastMessage.sender === 'user' && (
                              <span className="text-[#1E88E5] mr-1">Bạn:</span>
                            )}
                            {lastMessage.text}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatTime(lastMessage.timestamp)}
                          </div>
                        </>
                      )}
                      {!lastMessage && (
                        <p className="text-sm text-gray-400 italic">Cuộc trò chuyện mới</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-[#1E88E5] text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <span className={`text-xs mt-1 block ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập câu hỏi về luật thuế Việt Nam..."
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-[#1E88E5] hover:bg-[#1976D2]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Nhấn Enter để gửi tin nhắn
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
