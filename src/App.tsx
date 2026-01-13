import { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSupabaseData } from './hooks/useSupabaseData';
import { isSupabaseConfigured } from './lib/supabase';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { GoalsTab } from './components/tabs/GoalsTab';
import { BasicSettingsTab } from './components/tabs/BasicSettingsTab';
import { IncomeExpenseTab } from './components/tabs/IncomeExpenseTab';
import { DetailsTab } from './components/tabs/DetailsTab';
import { AssetsTab } from './components/tabs/AssetsTab';
import { InsuranceTab } from './components/tabs/InsuranceTab';
import { AdviceTab } from './components/tabs/AdviceTab';
import { ShareSettingsModal } from './components/ShareSettingsModal';
import { PlanDashboard } from './components/PlanDashboard';
import { AssetChart } from './components/AssetChart';
import { CashFlowTable } from './components/CashFlowTable';
import { LoanBalanceTable } from './components/LoanBalanceTable';
import { AppData } from './types';
import { calculateCashFlow } from './utils/simulator';

const initialData: AppData = {
  userSettings: {
    user_name: '',
    birth_date: '',
    gender: 'male',
    disability: 'none',
    life_expectancy: 85,
    simulation_end_age: 85,
    current_savings: 300,
    savings_interest_rate: 0,
  },
  incomes: [],
  expenses: [],
  lifeEvents: [],
  familyMembers: [],
  insurances: [],
  pensions: [],
  educationFunds: [],
  housings: [],
  assets: [],
  realEstates: [],
  loans: [],
  goals: {
    q1: '',
    q2: '',
    q3: '',
    q4: '',
  },
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface SelectedPlanInfo {
  planId: string;
  isOwner: boolean;
  permission: 'view' | 'edit' | 'owner';
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanInfo | null>(null);

  const {
    data: appData,
    setData: setAppData,
    setDataWithoutSave,
    loading: dataLoading,
    saveStatus: dataSaveStatus,
    planId,
    planNumber,
    isOwner,
    canEdit,
    saveAiAdvice,
    loadAiAdvice,
  } = useSupabaseData(initialData, selectedPlan ? {
    planId: selectedPlan.planId,
    permission: selectedPlan.permission,
  } : undefined);

  const [activeTab, setActiveTab] = useState('goals');
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [showShareSettings, setShowShareSettings] = useState(false);

  const handleSelectPlan = (planId: string, isOwner: boolean, permission: 'view' | 'edit' | 'owner') => {
    setSelectedPlan({ planId, isOwner, permission });
    setShowDashboard(false);
    setAdvice('');
  };

  const handleCreateNew = () => {
    setSelectedPlan(null);
    setShowDashboard(false);
    setAdvice('');
  };

  const handleBackToDashboard = () => {
    setShowDashboard(true);
    setSelectedPlan(null);
    setAdvice('');
  };

  useEffect(() => {
    const loadSavedAdvice = async () => {
      if (planId && !dataLoading) {
        const savedAdvice = await loadAiAdvice();
        if (savedAdvice) {
          setAdvice(savedAdvice);
        }
      }
    };
    loadSavedAdvice();
  }, [planId, dataLoading, loadAiAdvice]);

  const cashFlowData = useMemo(() => {
    if (!appData || dataLoading) return [];
    try {
      return calculateCashFlow(appData);
    } catch (error) {
      console.error('Error calculating cash flow:', error);
      return [];
    }
  }, [appData, dataLoading]);

  useEffect(() => {
    if (!appData.goals) {
      setDataWithoutSave((prev) => ({
        ...prev,
        goals: {
          q1: '',
          q2: '',
          q3: '',
          q4: '',
        },
      }));
    }
  }, [appData.goals, setDataWithoutSave]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'life_plan_data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        const validatedData: AppData = {
          userSettings: data.userSettings || initialData.userSettings,
          incomes: Array.isArray(data.incomes) ? data.incomes : [],
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          lifeEvents: Array.isArray(data.lifeEvents) ? data.lifeEvents : [],
          familyMembers: Array.isArray(data.familyMembers) ? data.familyMembers : [],
          insurances: Array.isArray(data.insurances) ? data.insurances : [],
          pensions: Array.isArray(data.pensions) ? data.pensions : [],
          educationFunds: Array.isArray(data.educationFunds) ? data.educationFunds : [],
          housings: Array.isArray(data.housings) ? data.housings : [],
          assets: Array.isArray(data.assets)
            ? data.assets.map((asset: any) => ({
                ...asset,
                asset_type: asset.asset_type || '投資信託',
                contribution_end_age: asset.contribution_end_age,
              }))
            : [],
          realEstates: Array.isArray(data.realEstates) ? data.realEstates : [],
          loans: Array.isArray(data.loans) ? data.loans : [],
          goals: {
            q1: data.goals?.q1 || '',
            q2: data.goals?.q2 || '',
            q3: data.goals?.q3 || '',
            q4: data.goals?.q4 || '',
          },
        };

        setDataWithoutSave(validatedData);
        if (user && confirm('データを読み込みました。データベースに保存しますか？')) {
          setAppData(validatedData);
        } else {
          alert('データを読み込みました（保存されていません）');
        }
      } catch (error) {
        alert('ファイルの読み込みに失敗しました');
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClear = () => {
    if (confirm('すべてのデータをリセットしますか？この操作は取り消せません。')) {
      setAppData(initialData);
    }
  };

  const handleSettingsUpdate = (settings: AppData['userSettings']) => {
    setAppData((prev) => ({
      ...prev,
      userSettings: settings,
      familyMembers: [
        {
          id: 'self_user',
          name: settings.user_name,
          relation: 'self',
          birth_date: settings.birth_date,
          birth_year: new Date(settings.birth_date).getFullYear(),
          gender: settings.gender,
          disability: settings.disability,
          life_expectancy: settings.life_expectancy,
        },
        ...prev.familyMembers.filter((m) => m.relation !== 'self'),
      ],
    }));
  };

  const handleGoalsUpdate = (goals: AppData['goals']) => {
    setAppData((prev) => ({ ...prev, goals }));
  };

  const handleFamilyAdd = (member: Omit<AppData['familyMembers'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { ...member, id: generateId() }],
    }));
  };

  const handleFamilyEdit = (id: string, updates: Partial<AppData['familyMembers'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const handleFamilyDelete = (id: string) => {
    setAppData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((m) => m.id !== id),
    }));
  };

  const handleFamilyReorder = (id: string, direction: 'up' | 'down') => {
    setAppData((prev) => {
      const members = [...prev.familyMembers];
      const index = members.findIndex((m) => m.id === id);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= members.length) return prev;

      [members[index], members[newIndex]] = [members[newIndex], members[index]];
      return { ...prev, familyMembers: members };
    });
  };

  const handleIncomeAdd = (income: Omit<AppData['incomes'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      incomes: [...prev.incomes, { ...income, id: generateId() }],
    }));
  };

  const handleIncomeEdit = (id: string, updates: Partial<AppData['incomes'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  };

  const handleExpenseAdd = (expense: Omit<AppData['expenses'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: generateId() }],
    }));
  };

  const handleExpenseEdit = (id: string, updates: Partial<AppData['expenses'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  };

  const handleEducationAdd = (education: Omit<AppData['educationFunds'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      educationFunds: [...prev.educationFunds, { ...education, id: generateId() }],
    }));
  };

  const handleEducationEdit = (id: string, updates: Partial<AppData['educationFunds'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      educationFunds: prev.educationFunds.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  };

  const handleLifeEventAdd = (event: Omit<AppData['lifeEvents'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      lifeEvents: [...prev.lifeEvents, { ...event, id: generateId() }],
    }));
  };

  const handleLifeEventEdit = (id: string, updates: Partial<AppData['lifeEvents'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      lifeEvents: prev.lifeEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  };

  const handleHousingAdd = (housing: Omit<AppData['housings'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      housings: [...prev.housings, { ...housing, id: generateId() }],
    }));
  };

  const handleHousingEdit = (id: string, updates: Partial<AppData['housings'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      housings: prev.housings.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  };

  const handleLoanAdd = (loan: Omit<AppData['loans'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      loans: [...prev.loans, { ...loan, id: generateId() }],
    }));
  };

  const handleLoanEdit = (id: string, updates: Partial<AppData['loans'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      loans: prev.loans.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const handleReorder = (id: string, type: string, direction: 'up' | 'down') => {
    setAppData((prev) => {
      let items: { id: string }[];
      let key: keyof AppData;

      switch (type) {
        case 'income':
          items = [...prev.incomes];
          key = 'incomes';
          break;
        case 'expense':
          items = [...prev.expenses];
          key = 'expenses';
          break;
        case 'education':
          items = [...prev.educationFunds];
          key = 'educationFunds';
          break;
        case 'lifeEvent':
          items = [...prev.lifeEvents];
          key = 'lifeEvents';
          break;
        case 'housing':
          items = [...prev.housings];
          key = 'housings';
          break;
        case 'loan':
          items = [...prev.loans];
          key = 'loans';
          break;
        case 'asset':
          items = [...prev.assets];
          key = 'assets';
          break;
        case 'realEstate':
          items = [...prev.realEstates];
          key = 'realEstates';
          break;
        case 'insurance':
          items = [...prev.insurances];
          key = 'insurances';
          break;
        case 'pension':
          items = [...prev.pensions];
          key = 'pensions';
          break;
        default:
          return prev;
      }

      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return prev;

      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return { ...prev, [key]: items };
    });
  };

  const handleAssetAdd = (asset: Omit<AppData['assets'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      assets: [...prev.assets, { ...asset, id: generateId() }],
    }));
  };

  const handleAssetEdit = (id: string, updates: Partial<AppData['assets'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      assets: prev.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const handleRealEstateAdd = (realEstate: Omit<AppData['realEstates'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      realEstates: [...prev.realEstates, { ...realEstate, id: generateId() }],
    }));
  };

  const handleRealEstateEdit = (id: string, updates: Partial<AppData['realEstates'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      realEstates: prev.realEstates.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const handleInsuranceAdd = (insurance: Omit<AppData['insurances'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      insurances: [...prev.insurances, { ...insurance, id: generateId() }],
    }));
  };

  const handleInsuranceEdit = (id: string, updates: Partial<AppData['insurances'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      insurances: prev.insurances.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  };

  const handlePensionAdd = (pension: Omit<AppData['pensions'][0], 'id'>) => {
    setAppData((prev) => ({
      ...prev,
      pensions: [...prev.pensions, { ...pension, id: generateId() }],
    }));
  };

  const handlePensionEdit = (id: string, updates: Partial<AppData['pensions'][0]>) => {
    setAppData((prev) => ({
      ...prev,
      pensions: prev.pensions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const handleDelete = (id: string, type: string) => {
    setAppData((prev) => {
      switch (type) {
        case 'income':
          return { ...prev, incomes: prev.incomes.filter((i) => i.id !== id) };
        case 'expense':
          return { ...prev, expenses: prev.expenses.filter((e) => e.id !== id) };
        case 'education':
          return { ...prev, educationFunds: prev.educationFunds.filter((e) => e.id !== id) };
        case 'lifeEvent':
          return { ...prev, lifeEvents: prev.lifeEvents.filter((e) => e.id !== id) };
        case 'housing':
          return { ...prev, housings: prev.housings.filter((h) => h.id !== id) };
        case 'loan':
          return { ...prev, loans: prev.loans.filter((l) => l.id !== id) };
        case 'asset':
          return { ...prev, assets: prev.assets.filter((a) => a.id !== id) };
        case 'realEstate':
          return { ...prev, realEstates: prev.realEstates.filter((r) => r.id !== id) };
        case 'insurance':
          return { ...prev, insurances: prev.insurances.filter((i) => i.id !== id) };
        case 'pension':
          return { ...prev, pensions: prev.pensions.filter((p) => p.id !== id) };
        default:
          return prev;
      }
    });
  };

  const handleGenerateAdvice = async () => {
    setIsLoadingAdvice(true);
    setAdvice('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fp-advice`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lifePlanData: appData,
          cashFlowData: cashFlowData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.advice) {
        setAdvice(data.advice);
        await saveAiAdvice(data.advice);
      } else if (data.error) {
        const errorMessage = `エラーが発生しました: ${data.error}\n\nGemini APIキーが正しく設定されているか確認してください。`;
        setAdvice(errorMessage);
      } else {
        const fallbackMessage = 'アドバイスの生成に失敗しました。しばらく経ってから再度お試しください。';
        setAdvice(fallbackMessage);
      }
    } catch (error) {
      console.error('Error generating advice:', error);
      const networkError = 'ネットワークエラーが発生しました。インターネット接続を確認し、再度お試しください。';
      setAdvice(networkError);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  if (showDashboard && user) {
    return (
      <PlanDashboard
        onSelectPlan={handleSelectPlan}
        onCreateNew={handleCreateNew}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Header
          onExport={handleExport}
          onImport={handleImport}
          onClear={handleClear}
          onShowDashboard={user ? handleBackToDashboard : undefined}
          currentPlanNumber={user ? planNumber : undefined}
          onShowShareSettings={user ? () => setShowShareSettings(true) : undefined}
        />

        {!isSupabaseConfigured && (
          <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded relative text-sm">
            <span className="block sm:inline">
              <strong>注意:</strong> データベース接続が設定されていません。データはブラウザにのみ保存されます。
              本番環境では環境変数（VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY）を設定してください。
            </span>
          </div>
        )}

        {!user && isSupabaseConfigured && (
          <div className="mb-4 bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded relative text-sm">
            <span className="block sm:inline">
              現在、データはブラウザにのみ保存されています。
              <strong className="ml-1">ログイン</strong>すると、クラウドに保存してどのデバイスからでもアクセスできます。
            </span>
          </div>
        )}

        {user && !isOwner && (
          <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded relative text-sm flex items-center gap-2">
            <span className="block sm:inline">
              {canEdit ? (
                <>このプランは他のユーザーから<strong>編集権限</strong>で共有されています。</>
              ) : (
                <>このプランは他のユーザーから<strong>閲覧のみ</strong>で共有されています。編集はできません。</>
              )}
            </span>
          </div>
        )}

        {dataSaveStatus === 'saved' && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm">
            <span className="block sm:inline">データをクラウドに保存しました。</span>
          </div>
        )}
        {dataSaveStatus === 'saving' && (
          <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative text-sm">
            <span className="block sm:inline">保存中...</span>
          </div>
        )}
        {dataSaveStatus === 'error' && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
            <span className="block sm:inline">保存に失敗しました。</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'goals' && (
              <GoalsTab goals={appData.goals} onUpdate={handleGoalsUpdate} />
            )}

            {activeTab === 'basic' && (
              <BasicSettingsTab
                settings={appData.userSettings}
                familyMembers={appData.familyMembers}
                onSettingsUpdate={handleSettingsUpdate}
                onFamilyAdd={handleFamilyAdd}
                onFamilyEdit={handleFamilyEdit}
                onFamilyDelete={handleFamilyDelete}
                onFamilyReorder={handleFamilyReorder}
              />
            )}

            {activeTab === 'income-expense' && (
              <IncomeExpenseTab
                incomes={appData.incomes}
                expenses={appData.expenses}
                educationFunds={appData.educationFunds}
                lifeEvents={appData.lifeEvents}
                familyMembers={appData.familyMembers}
                onIncomeAdd={handleIncomeAdd}
                onIncomeEdit={handleIncomeEdit}
                onExpenseAdd={handleExpenseAdd}
                onExpenseEdit={handleExpenseEdit}
                onEducationAdd={handleEducationAdd}
                onEducationEdit={handleEducationEdit}
                onLifeEventAdd={handleLifeEventAdd}
                onLifeEventEdit={handleLifeEventEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
              />
            )}

            {activeTab === 'details' && (
              <DetailsTab
                housings={appData.housings}
                loans={appData.loans}
                onHousingAdd={handleHousingAdd}
                onHousingEdit={handleHousingEdit}
                onLoanAdd={handleLoanAdd}
                onLoanEdit={handleLoanEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
              />
            )}

            {activeTab === 'assets' && (
              <AssetsTab
                assets={appData.assets}
                realEstates={appData.realEstates}
                onAssetAdd={handleAssetAdd}
                onAssetEdit={handleAssetEdit}
                onRealEstateAdd={handleRealEstateAdd}
                onRealEstateEdit={handleRealEstateEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
                appData={appData}
                onSavingsUpdate={(updates) => {
                  setAppData((prev) => ({
                    ...prev,
                    userSettings: { ...prev.userSettings, ...updates },
                  }));
                }}
              />
            )}

            {activeTab === 'insurance' && (
              <InsuranceTab
                insurances={appData.insurances}
                pensions={appData.pensions}
                familyMembers={appData.familyMembers}
                onInsuranceAdd={handleInsuranceAdd}
                onInsuranceEdit={handleInsuranceEdit}
                onPensionAdd={handlePensionAdd}
                onPensionEdit={handlePensionEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
              />
            )}

            {activeTab === 'advice' && (
              <AdviceTab
                onGenerateAdvice={handleGenerateAdvice}
                advice={advice}
                isLoading={isLoadingAdvice}
              />
            )}

          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <AssetChart data={cashFlowData} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <CashFlowTable data={cashFlowData} appData={appData} />
              <LoanBalanceTable appData={appData} />
            </div>
          </div>
        </div>

        {showShareSettings && (
          <ShareSettingsModal
            planId={planId}
            isOwner={isOwner}
            planNumber={planNumber}
            onClose={() => setShowShareSettings(false)}
          />
        )}
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <a
              href="https://edulio.notion.site/lifeplansimulator-aup/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              利用規約
            </a>
            <a
              href="https://manapla.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              ©︎まなぷら. ALL Rights Reserved
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
