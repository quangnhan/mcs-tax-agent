import { useState } from 'react';
import { LoginView } from './components/LoginView';
import { TopNavigation } from './components/TopNavigation';
import { UserChatView } from './components/UserChatView';
import { LawyerDocumentView } from './components/LawyerDocumentView';
import { DataScientistView } from './components/DataScientistView';

export type UserRole = 'user' | 'lawyer' | 'data-scientist';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role;
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        return null;
      }
    }
    return null;
  });

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentRole(null);
  };

  if (!currentRole) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentRole) {
      case 'user':
        return <UserChatView />;
      case 'lawyer':
        return <LawyerDocumentView />;
      case 'data-scientist':
        return <DataScientistView />;
      default:
        return <UserChatView />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <TopNavigation currentRole={currentRole} onRoleChange={setCurrentRole} onLogout={handleLogout} />
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}
