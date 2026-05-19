import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Briefcase } from 'lucide-react';

export default function AdminLogin() {
  const { user, isAdmin, loading, loginWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('ismaillone0000@gmail.com');
  const [password, setPassword] = useState('Warlock@123');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin/dashboard');
    } else if (user && !isAdmin && !loading) {
      setError("You do not have administrative privileges.");
    }
  }, [user, isAdmin, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isResetting) {
        if (!email) {
          setError('Please provide an email address');
          return;
        }
        await resetPassword(email);
        setMessage('Password reset email sent. Check your inbox.');
      } else {
        if (!email || !password) {
          setError('Please provide email and password');
          return;
        }
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
        <div className="flex justify-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl">
             <Briefcase className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
          {isResetting ? 'Reset Password' : 'Admin Portal'}
        </h1>
        <p className="text-center text-slate-500 mb-8">
          {isResetting ? 'Enter your email to reset your administrative password.' : 'Sign in to manage applicants and jobs.'}
        </p>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">
            {message}
          </div>
        )}

        {!isResetting && (
          <div>
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 font-medium py-3 px-4 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full rounded-xl border border-slate-200 py-3 px-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          {!isResetting && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full rounded-xl border border-slate-200 py-3 px-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 mt-6"
          >
            {isResetting ? 'Send Reset Link' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4 flex flex-col">
          <button 
            type="button"
            onClick={() => { setIsResetting(!isResetting); setError(''); setMessage(''); }} 
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            {isResetting ? 'Back to Sign In' : 'Forgot Password?'}
          </button>
          <button onClick={() => navigate('/')} className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Return to Public Site
          </button>
        </div>
      </div>
    </div>
  );
}
