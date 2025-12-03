
import React, { useState } from 'react';
import { User } from '../types';
import { verifyUser } from '../services/firestoreService';
import { Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // password 변수는 일반 사용자의 경우 '이름', 관리자의 경우 '비밀번호'로 사용됨
      const user = await verifyUser(id, password);
      if (user) {
        onLogin(user);
      } else {
        setError('등록되지 않은 사용자 정보입니다. 아이디와 이름(또는 비밀번호)을 확인해주세요.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 text-blue-400 mb-4 shadow-inner">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">QMS System</h1>
            <p className="text-slate-400 text-sm">품질관리 통합 시스템</p>
        </div>

        {/* Form */}
        <div className="p-8 pt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-1">
                <UserIcon size={14} /> 사번 (ID)
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="예: QM-001 (관리자: admin)"
                style={{ color: 'white', backgroundColor: '#374151' }}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-1">
                <Lock size={14} /> 이름 / 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="이름 (관리자는 비밀번호 입력)"
                style={{ color: 'white', backgroundColor: '#374151' }}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  로그인 <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              계정이 없으신가요? 관리자에게 문의하여 등록하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
