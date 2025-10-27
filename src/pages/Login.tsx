// Login.tsx
import React, { useState } from 'react';
import { LogIn, User } from 'lucide-react';
import logo from '../assets/Logo.png';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSignUpClick: () => void;
  onForgotPasswordClick: () => void;
}

export function Login({ onSignUpClick, onForgotPasswordClick }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="fixed top-4 left-4 sm:top-8 sm:left-8">
          <img src={logo} alt="QuickCut Logo" className="w-24 sm:w-32 h-auto" />
        </div>

        <div className="fixed top-4 right-4 sm:top-8 sm:right-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div className="text-xs sm:text-sm hidden sm:block">Not signed in</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mt-16 sm:mt-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-center text-gray-500 mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
                placeholder="Write your email here"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onForgotPasswordClick}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
                placeholder="••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6 text-sm sm:text-base">
            Don't have an account?{' '}
            <button
              onClick={onSignUpClick}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
