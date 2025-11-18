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
import { userChatAPI } from '../services/mockApi';

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessages>({});
  const [inputMessage, setInputMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const convs = await userChatAPI.getConversations();
      const convertedConvs = convs.map(c => ({
        id: c.id,
        timestamp: new Date(c.timestamp),
      }));
      setConversations(convertedConvs);
      
      // Load messages for each conversation
      const allMessages: ConversationMessages = {};
      for (const conv of convs) {
        allMessages[conv.id] = conv.messages.map(m => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.timestamp),
        }));
      }
      setConversationMessages(allMessages);
      
      // Select first conversation
      if (convertedConvs.length > 0) {
        setSelectedConversation(convertedConvs[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get messages for current conversation
  const currentMessages = conversationMessages[selectedConversation] || [];

  // Get last message for a conversation
  const getLastMessage = (conversationId: string): Message | null => {
    const messages = conversationMessages[conversationId] || [];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    setInputMessage('');

    try {
      // Call API to send message
      const { userMessage, botMessage } = await userChatAPI.sendMessage(selectedConversation, messageText);
      
      // Convert to local format
      const convertedUserMsg: Message = {
        id: userMessage.id,
        text: userMessage.text,
        sender: userMessage.sender,
        timestamp: new Date(userMessage.timestamp),
      };
      
      const convertedBotMsg: Message = {
        id: botMessage.id,
        text: botMessage.text,
        sender: botMessage.sender,
        timestamp: new Date(botMessage.timestamp),
      };

      // Update messages
      setConversationMessages(prev => ({
        ...prev,
        [selectedConversation]: [...(prev[selectedConversation] || []), convertedUserMsg, convertedBotMsg],
      }));

      // Update conversation timestamp
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, timestamp: new Date() }
            : conv
        ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      // Call API to create new conversation
      const newConv = await userChatAPI.createConversation();
      
      // Convert to local format
      const convertedConv: Conversation = {
        id: newConv.id,
        timestamp: new Date(newConv.timestamp),
      };
      
      const convertedMessages: Message[] = newConv.messages.map(m => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(m.timestamp),
      }));

      // Add to conversations list (at the top)
      setConversations([convertedConv, ...conversations]);

      // Initialize messages for new conversation
      setConversationMessages(prev => ({
        ...prev,
        [newConv.id]: convertedMessages,
      }));

      // Select the new conversation
      setSelectedConversation(newConv.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
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

  const confirmDelete = async () => {
    if (conversationToDelete) {
      try {
        // Call API to delete conversation
        await userChatAPI.deleteConversation(conversationToDelete);
        
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
      } catch (error) {
        console.error('Error deleting conversation:', error);
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
