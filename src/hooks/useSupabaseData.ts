import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AppData } from '../types';

interface UseSupabaseDataOptions {
  planId?: string | null;
  permission?: 'view' | 'edit' | 'owner';
}

export function useSupabaseData(initialData: AppData, options?: UseSupabaseDataOptions) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(options?.planId || null);
  const [isOwner, setIsOwner] = useState(options?.permission === 'owner' || !options);
  const [canEdit, setCanEdit] = useState(
    options?.permission === 'owner' ||
    options?.permission === 'edit' ||
    !options
  );

  const saveDataToSupabase = useCallback(async (newData: AppData) => {
    if (!user) {
      localStorage.setItem('life_plan_simulator_data', JSON.stringify(newData));
      return;
    }

    if (!canEdit) {
      console.warn('No edit permission for this plan');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setSaveStatus('saving');
    try {
      if (currentPlanId) {
        const { error } = await supabase
          .from('user_life_plans')
          .update({
            plan_data: newData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentPlanId);

        if (error) {
          console.error('Error saving data:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus(null), 3000);
          return;
        }
      } else {
        const { data: insertedData, error } = await supabase
          .from('user_life_plans')
          .insert({
            user_id: user.id,
            plan_data: newData,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving data:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus(null), 3000);
          return;
        }

        if (insertedData) {
          setCurrentPlanId(insertedData.id);
          setIsOwner(true);
          setCanEdit(true);
        }
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error in saveDataToSupabase:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [user, currentPlanId, canEdit]);

  const loadDataFromSupabase = useCallback(async () => {
    if (!user) {
      const localData = localStorage.getItem('life_plan_simulator_data');
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          setData(parsedData);
        } catch (e) {
          console.error('Error parsing local data:', e);
        }
      }
      setLoading(false);
      return;
    }

    try {
      if (options?.planId) {
        const { data: planData, error } = await supabase
          .from('user_life_plans')
          .select('*')
          .eq('id', options.planId)
          .maybeSingle();

        if (error) {
          console.error('Error loading plan:', error);
          setLoading(false);
          return;
        }

        if (planData) {
          setData(planData.plan_data as AppData);
          setCurrentPlanId(planData.id);
          setIsOwner(planData.user_id === user.id);
          setCanEdit(planData.user_id === user.id || options?.permission === 'edit');
        }
      } else {
        setData(initialData);
        setCurrentPlanId(null);
        setIsOwner(true);
        setCanEdit(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error in loadDataFromSupabase:', error);
      setLoading(false);
    }
  }, [user, options?.planId, options?.permission, saveDataToSupabase]);

  useEffect(() => {
    loadDataFromSupabase();
  }, [loadDataFromSupabase]);

  useEffect(() => {
    if (options?.planId) {
      setCurrentPlanId(options.planId);
      setIsOwner(options.permission === 'owner');
      setCanEdit(options.permission === 'owner' || options.permission === 'edit');
    } else {
      setCurrentPlanId(null);
      setIsOwner(true);
      setCanEdit(true);
    }
  }, [options?.planId, options?.permission]);

  const updateData = useCallback((updaterOrData: ((prev: AppData) => AppData) | AppData) => {
    if (!canEdit) {
      console.warn('No edit permission for this plan');
      return;
    }
    setData((prev) => {
      const newData = typeof updaterOrData === 'function' ? updaterOrData(prev) : updaterOrData;
      saveDataToSupabase(newData);
      return newData;
    });
  }, [saveDataToSupabase, canEdit]);

  return {
    data,
    setData: updateData,
    loading,
    saveStatus,
    planId: currentPlanId,
    isOwner,
    canEdit,
  };
}
