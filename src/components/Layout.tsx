import React from 'react';
import { User } from 'lucide-react';
import logo from '../assets/Logo.png';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={logo} alt="QuickCut Logo" className="w-32 h-auto" />
              </div>

              {profile && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-medium">{profile.full_name || 'User'}</div>
                      <div className="text-xs text-gray-500">
                        {profile.email ? 'Sign out' : 'Not signed in'}
                      </div>
                    </div>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <main>{children}</main>
    </div>
  );
}
