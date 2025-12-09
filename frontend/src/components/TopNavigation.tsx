import { MessageSquare, FileText, BarChart3, LogOut } from 'lucide-react';
import { UserRole } from '../App';
import { Button } from './ui/button';

interface TopNavigationProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
}

export function TopNavigation({ currentRole, onLogout }: TopNavigationProps) {
  const getRoleLabel = () => {
    switch (currentRole) {
      case 'user': return 'Người dùng';
      case 'lawyer': return 'Luật sư';
      case 'data_scientist': return 'Data Scientist';
      default: return '';
    }
  };

  const getRoleIcon = () => {
    switch (currentRole) {
      case 'user': return MessageSquare;
      case 'lawyer': return FileText;
      case 'data_scientist': return BarChart3;
      default: return MessageSquare;
    }
  };

  const Icon = getRoleIcon();

  return (
    <nav className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E88E5' }}>
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-gray-900">Chatbot Luật Thuế Việt Nam</h1>
          <p className="text-xs text-gray-500">Hệ thống trợ lý thuế thông minh</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <Icon className="w-4 h-4 text-[#1E88E5]" />
          <span className="text-sm text-gray-700">{getRoleLabel()}</span>
        </div>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Đăng xuất</span>
        </Button>
      </div>
    </nav>
  );
}
