import React, { useState } from 'react';
import { loginUser, resetPassword } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@123');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await loginUser({ username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false');
      localStorage.setItem('userId', data.user_id.toString());
      onLogin();
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            TW
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Team Work</h1>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 text-green-600 border border-green-100 p-3 rounded-lg mb-4 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <button
                type="button"
                onClick={async () => {
                  if (!username) {
                    setError('Please enter a username to reset the password');
                    return;
                  }
                  try {
                    const res = await resetPassword(username);
                    setSuccessMsg(res.message);
                    setError('');
                  } catch (err: any) {
                    setError(err.response?.data?.detail || 'Failed to reset password');
                    setSuccessMsg('');
                  }
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
              >
                Reset Password
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full py-3 mt-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
