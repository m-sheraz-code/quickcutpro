// ForgotPassword.tsx
import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordProps {
  onBackClick: () => void;
}

export function ForgotPassword({ onBackClick }: ForgotPasswordProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 break-words">
              We've sent a password reset link to {email}
            </p>
            <button
              onClick={onBackClick}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="fixed top-4 left-4 sm:top-8 sm:left-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            QuickCut<span className="text-xs sm:text-sm text-gray-500">.pro</span>
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mt-16 sm:mt-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Enter your email to receive a reset link
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={onBackClick}
              className="w-full text-gray-600 hover:text-gray-900 font-medium"
            >
              Back to Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}