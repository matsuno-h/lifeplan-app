import { useState, useEffect, useCallback } from 'react';
import { FileText, Users, Plus, Edit3, Eye, Loader2, ChevronRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LifePlan } from '../types';

interface PlanDashboardProps {
  onSelectPlan: (planId: string, isOwner: boolean, permission: 'view' | 'edit' | 'owner') => void;
  onCreateNew: () => void;
}

export function PlanDashboard({ onSelectPlan, onCreateNew }: PlanDashboardProps) {
  const { user } = useAuth();
  const [ownedPlans, setOwnedPlans] = useState<LifePlan[]>([]);
  const [sharedPlans, setSharedPlans] = useState<(LifePlan & { owner_name: string; permission: 'view' | 'edit' })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'owned' | 'shared'>('owned');

  const loadPlans = useCallback(async () => {
    if (!user || !isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: owned, error: ownedError } = await supabase
        .from('user_life_plans')
        .select('*')
        .eq('user_id', user.id);

      if (ownedError) throw ownedError;
      setOwnedPlans(owned || []);

      const { data: collaborations, error: collabError } = await supabase
        .from('plan_collaborators')
        .select('plan_id, permission, owner_id')
        .or(`collaborator_id.eq.${user.id},collaborator_email.eq.${user.email}`);

      if (collabError) throw collabError;

      if (collaborations && collaborations.length > 0) {
        const planIds = collaborations.map(c => c.plan_id);
        const ownerIds = [...new Set(collaborations.map(c => c.owner_id))];

        const { data: sharedPlanData, error: sharedError } = await supabase
          .from('user_life_plans')
          .select('*')
          .in('id', planIds);

        if (sharedError) throw sharedError;

        const { data: ownersData, error: ownersError } = await supabase
          .rpc('get_user_info', { user_ids: ownerIds });

        if (ownersError) {
          console.error('Error fetching owners:', ownersError);
        }

        const ownersMap = new Map((ownersData || []).map((owner: { id: string; email: string; name: string }) => [owner.id, owner.name]));

        const sharedWithPermissions = (sharedPlanData || []).map(plan => {
          const collab = collaborations.find(c => c.plan_id === plan.id);
          const ownerName = ownersMap.get(collab?.owner_id || '') || '不明';
          return {
            ...plan,
            owner_name: ownerName,
            permission: collab?.permission || 'view',
          };
        });

        setSharedPlans(sharedWithPermissions as (LifePlan & { owner_name: string; permission: 'view' | 'edit' })[]);
      }
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlanTitle = (plan: LifePlan) => {
    return `プラン：${plan.plan_number}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const hasOwnedPlans = ownedPlans.length > 0;
  const hasSharedPlans = sharedPlans.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ライフプラン</h1>
          <p className="text-gray-600">プランを選択するか、新しく作成してください</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveSection('owned')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeSection === 'owned'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            自分のプラン ({ownedPlans.length})
          </button>
          <button
            onClick={() => setActiveSection('shared')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeSection === 'shared'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            共有されたプラン ({sharedPlans.length})
          </button>
        </div>

        {activeSection === 'owned' && (
          <div className="space-y-4">
            <button
              onClick={onCreateNew}
              className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-dashed border-blue-300 flex items-center justify-center gap-3 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium">新しいプランを作成</span>
            </button>

            {hasOwnedPlans ? (
              ownedPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => onSelectPlan(plan.id, true, 'owner')}
                  className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {getPlanTitle(plan)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        最終更新: {formatDate(plan.updated_at)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">まだプランがありません</p>
                <p className="text-sm text-gray-400 mt-1">上のボタンから新しいプランを作成してください</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'shared' && (
          <div className="space-y-4">
            {hasSharedPlans ? (
              sharedPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => onSelectPlan(plan.id, false, plan.permission)}
                  className="w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {plan.owner_name} - プラン {plan.plan_number}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          plan.permission === 'edit'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {plan.permission === 'edit' ? (
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
                        </span>
                        <span className="text-sm text-gray-500">
                          最終更新: {formatDate(plan.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">共有されたプランはありません</p>
                <p className="text-sm text-gray-400 mt-1">他のユーザーからプランが共有されるとここに表示されます</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
