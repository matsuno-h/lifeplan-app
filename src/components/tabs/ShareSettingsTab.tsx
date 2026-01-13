import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Trash2, Edit3, Eye, Loader2, AlertCircle, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Collaborator } from '../../types';

interface ShareSettingsTabProps {
  planId: string | null;
  isOwner: boolean;
  planNumber?: number;
}

export function ShareSettingsTab({ planId, isOwner, planNumber }: ShareSettingsTabProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userName, setUserName] = useState<string>('');

  const loadCollaborators = useCallback(async () => {
    if (!planId || !user || !isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('plan_collaborators')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollaborators(data || []);
    } catch (err) {
      console.error('Error loading collaborators:', err);
    } finally {
      setLoading(false);
    }
  }, [planId, user]);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

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

  const sendInvitationEmail = async (inviteeEmail: string, permission: 'view' | 'edit') => {
    if (!isSupabaseConfigured || !supabase || !planNumber) return;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation-email`;

      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inviteeEmail,
          inviterName: userName || user?.email || 'ユーザー',
          planNumber,
          permission,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.configured === false) {
          console.log('Email service not configured, skipping email notification');
        } else {
          console.error('Failed to send invitation email:', result.error);
        }
      }
    } catch (err) {
      console.error('Error sending invitation email:', err);
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !user || !email.trim() || !isSupabaseConfigured || !supabase) return;

    if (email.toLowerCase() === user.email?.toLowerCase()) {
      setError('自分自身を招待することはできません');
      return;
    }

    const existingCollaborator = collaborators.find(
      c => c.collaborator_email.toLowerCase() === email.toLowerCase()
    );
    if (existingCollaborator) {
      setError('このメールアドレスは既に招待されています');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const { data: existingUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      const { error: insertError } = await supabase
        .from('plan_collaborators')
        .insert({
          plan_id: planId,
          owner_id: user.id,
          collaborator_id: existingUser?.id || null,
          collaborator_email: email.toLowerCase(),
          permission,
        });

      if (insertError) throw insertError;

      await sendInvitationEmail(email.toLowerCase(), permission);

      setSuccess(`${email} を招待しました`);
      setEmail('');
      setPermission('view');
      loadCollaborators();
    } catch (err: unknown) {
      console.error('Error adding collaborator:', err);
      setError('招待に失敗しました。もう一度お試しください。');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdatePermission = async (collaboratorId: string, newPermission: 'view' | 'edit') => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from('plan_collaborators')
        .update({ permission: newPermission })
        .eq('id', collaboratorId);

      if (error) throw error;
      loadCollaborators();
    } catch (err) {
      console.error('Error updating permission:', err);
      setError('権限の更新に失敗しました');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('この共有を解除してよろしいですか？')) return;
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { error } = await supabase
        .from('plan_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      setSuccess('共有を解除しました');
      loadCollaborators();
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError('共有の解除に失敗しました');
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">共有設定</h2>
        </div>
        <p className="text-gray-600 text-sm">
          共有機能を利用するにはログインが必要です。
        </p>
      </div>
    );
  }

  if (!planId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">共有設定</h2>
        </div>
        <p className="text-gray-600 text-sm">
          データを保存した後に共有設定が利用できます。
        </p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">共有設定</h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            このプランは他のユーザーから共有されています。
            共有設定はプランの所有者のみが変更できます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">共有設定</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      <form onSubmit={handleAddCollaborator} className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          新しいユーザーを招待
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">権限</label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="view">閲覧のみ</option>
              <option value="edit">編集可能</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={adding || !email.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                招待中...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                招待する
              </>
            )}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          共有中のユーザー ({collaborators.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : collaborators.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            まだ誰とも共有していません
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {collaborator.collaborator_email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {collaborator.collaborator_email}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {collaborator.permission === 'edit' ? (
                        <>
                          <Edit3 className="w-3 h-3" />
                          編集可能
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          閲覧のみ
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={collaborator.permission}
                    onChange={(e) => handleUpdatePermission(collaborator.id, e.target.value as 'view' | 'edit')}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="view">閲覧のみ</option>
                    <option value="edit">編集可能</option>
                  </select>
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="共有を解除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
