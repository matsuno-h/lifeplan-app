import { Upload, Download, Trash2, TrendingUp, LogOut, User, LogIn, X, LayoutGrid, Settings, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ProfileSettings } from './ProfileSettings';

interface HeaderProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onShowDashboard?: () => void;
  currentPlanNumber?: number;
  onShowShareSettings?: () => void;
}

export function Header({ onExport, onImport, onClear, onShowDashboard, currentPlanNumber, onShowShareSettings }: HeaderProps) {
  const { user, signOut, signInWithEmail, signUpWithEmail } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user && isSupabaseConfigured && supabase) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error);
        setUserName(user.email || 'ユーザー');
        return;
      }

      if (data) {
        setUserName(data.name);
      } else {
        setUserName(user.email || 'ユーザー');
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setUserName(user.email || 'ユーザー');
    }
  };

  const handleSignOut = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await signUpWithEmail(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          setShowLoginModal(false);
          setEmail('');
          setPassword('');
        }
      } else {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          setShowLoginModal(false);
          setEmail('');
          setPassword('');
        }
      }
    } catch {
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-800 mb-2 flex items-center justify-center">
              <TrendingUp className="mr-2" />
              ライフプラン シミュレーター
            </h1>
            {currentPlanNumber && (
              <p className="text-gray-600 font-medium">現在表示中のプラン：{currentPlanNumber}</p>
            )}
          </div>
          <div className="flex-1 flex justify-end items-start gap-2">
            {user ? (
              <>
                {onShowDashboard && (
                  <button
                    onClick={onShowDashboard}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    title="プラン一覧"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">プラン一覧</span>
                  </button>
                )}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">{userName || user.email}</span>
                  </div>
                  {onShowShareSettings && (
                    <button
                      onClick={onShowShareSettings}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                      title="共有設定"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowProfileSettings(true)}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    title="プロフィール設定"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                    title="ログアウト"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded transition duration-200 flex items-center gap-2 shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                ログイン
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onExport}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold py-2 px-4 rounded transition duration-200 flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            データをファイルに保存
          </button>
          <label className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold py-2 px-4 rounded transition duration-200 cursor-pointer flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            データを読み込む
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </label>
          <button
            onClick={onClear}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded transition duration-200 flex items-center"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            リセット
          </button>
        </div>
      </header>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isSignUp ? '新規登録' : 'ログイン'}
              </h2>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                {isLoading ? '処理中...' : isSignUp ? '登録' : 'ログイン'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                {isSignUp ? '既にアカウントをお持ちの方はこちら' : '新規登録はこちら'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileSettings && (
        <ProfileSettings onClose={() => {
          setShowProfileSettings(false);
          loadUserProfile();
        }} />
      )}
    </>
  );
}
