import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { MessageSquare } from 'lucide-react';
import { UserRole } from '../App';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

const CREDENTIALS = {
  user: { username: 'user', password: 'user123' },
  lawyer: { username: 'lawyer', password: 'lawyer123' },
  'data-scientist': { username: 'scientist', password: 'scientist123' },
};

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    
    // Check credentials
    for (const [role, creds] of Object.entries(CREDENTIALS)) {
      if (creds.username === username && creds.password === password) {
        onLogin(role as UserRole);
        return;
      }
    }
    
    setError('Tên đăng nhập hoặc mật khẩu không đúng');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#1E88E5] rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-gray-900">Vietnamese Tax Law Chatbot</h1>
          <p className="text-gray-500">Đăng nhập vào hệ thống</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập mật khẩu"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button 
            className="w-full bg-[#1E88E5] hover:bg-[#1976D2]"
            onClick={handleLogin}
          >
            Đăng nhập
          </Button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Tài khoản demo:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>👤 Người dùng: user / user123</p>
            <p>⚖️ Luật sư: lawyer / lawyer123</p>
            <p>📊 Data Scientist: scientist / scientist123</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
