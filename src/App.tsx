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
import { ShareSettingsTab } from './components/tabs/ShareSettingsTab';
import { PlanDashboard } from './components/PlanDashboard';
import { AssetChart } from './components/AssetChart';
import { CashFlowTable } from './components/CashFlowTable';
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
  } = useSupabaseData(initialData, selectedPlan ? {
    planId: selectedPlan.planId,
    permission: selectedPlan.permission,
  } : undefined);

  const [activeTab, setActiveTab] = useState('goals');
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  const handleSelectPlan = (planId: string, isOwner: boolean, permission: 'view' | 'edit' | 'owner') => {
    setSelectedPlan({ planId, isOwner, permission });
    setShowDashboard(false);
  };

  const handleCreateNew = () => {
    setSelectedPlan(null);
    setShowDashboard(false);
  };

  const handleBackToDashboard = () => {
    setShowDashboard(true);
    setSelectedPlan(null);
  };

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

  const handleGenerateAdvice = () => {
    setIsLoadingAdvice(true);
    setTimeout(() => {
      const safeNum = (val: number) => (isNaN(val) || !isFinite(val)) ? 0 : val;

      const currentAge = appData.userSettings.birth_date
        ? new Date().getFullYear() - new Date(appData.userSettings.birth_date).getFullYear()
        : 30;

      const simulationEndAge = appData.userSettings.simulation_end_age || 85;
      const lifeExpectancy = appData.userSettings.life_expectancy || 85;
      const retirementAge = 65;
      const yearsToRetirement = Math.max(0, retirementAge - currentAge);
      const retirementYears = Math.max(0, simulationEndAge - retirementAge);

      const totalAssets = safeNum(appData.userSettings.current_savings) +
        appData.assets.reduce((sum, a) => sum + safeNum(a.current_value), 0) +
        appData.realEstates.reduce((sum, r) => sum + safeNum(r.current_value), 0);

      const yearlyAssetContribution = appData.assets.reduce((sum, a) => sum + safeNum(a.yearly_contribution), 0);
      const yearlyIncome = appData.incomes.reduce((sum, i) => sum + safeNum(i.amount), 0);
      const yearlyExpense = appData.expenses.reduce((sum, e) => sum + safeNum(e.amount), 0);
      const yearlyInsuranceCost = appData.insurances.reduce((sum, i) => sum + safeNum(i.premium), 0);
      const netYearlyCashFlow = yearlyIncome - yearlyExpense - yearlyInsuranceCost;

      const yearlyPensionIncome = appData.pensions.reduce((sum, p) => sum + safeNum(p.amount), 0);
      const retirementGap = yearlyExpense - yearlyPensionIncome;

      const minBalance = Math.min(...cashFlowData.map(d => d.balance));
      const balanceAtRetirement = cashFlowData.find(d => d.age === retirementAge)?.balance || 0;
      const finalBalance = cashFlowData[cashFlowData.length - 1]?.balance || 0;

      const hasNegativeBalance = minBalance < 0;

      const educationCosts = appData.educationFunds.reduce((sum, e) => {
        const years = safeNum(e.end_age) - safeNum(e.start_age);
        return sum + (safeNum(e.amount) * years);
      }, 0);

      const lifeEventCosts = appData.lifeEvents.reduce((sum, e) => sum + safeNum(e.cost), 0);

      const totalLoans = appData.loans.reduce((sum, l) => sum + safeNum(l.balance), 0);

      let advice = `■ あなたの現状\n`;
      advice += `現在${currentAge}歳、${simulationEndAge}歳までのシミュレーションを想定しています（想定寿命: ${lifeExpectancy}歳）。\n`;
      advice += `退職までの期間: ${yearsToRetirement}年、退職後の期間: ${retirementYears}年\n\n`;

      if (appData.goals.q1 || appData.goals.q2 || appData.goals.q3 || appData.goals.q4) {
        advice += `■ あなたの目標・価値観\n`;
        if (appData.goals.q1) advice += `・大切にしたいこと: ${appData.goals.q1}\n`;
        if (appData.goals.q2) advice += `・避けたいリスク: ${appData.goals.q2}\n`;
        if (appData.goals.q3) advice += `・優先したい支出: ${appData.goals.q3}\n`;
        if (appData.goals.q4) advice += `・実現したい目標: ${appData.goals.q4}\n`;
        advice += `\n`;
      }

      advice += `■ 資産状況の診断\n`;
      advice += `現在の総資産: ${safeNum(totalAssets).toLocaleString()}万円\n`;
      advice += `（内訳：預貯金${safeNum(appData.userSettings.current_savings)}万円、投資資産${appData.assets.reduce((s, a) => s + safeNum(a.current_value), 0)}万円、不動産${appData.realEstates.reduce((s, r) => s + safeNum(r.current_value), 0)}万円）\n\n`;

      if (totalAssets < yearlyExpense * 0.5 && yearlyExpense > 0) {
        advice += `【警告】現在の資産額は年間支出の${safeNum(Math.round(totalAssets / yearlyExpense * 10) / 10)}年分しかありません。緊急予備資金として最低でも生活費の6ヶ月分（${Math.round(yearlyExpense / 2)}万円）を確保する必要があります。\n\n`;
      }

      advice += `■ 収支バランスの分析\n`;
      advice += `年間収入: ${safeNum(yearlyIncome).toLocaleString()}万円\n`;
      advice += `年間支出: ${safeNum(yearlyExpense).toLocaleString()}万円（保険料${safeNum(yearlyInsuranceCost)}万円含む）\n`;
      advice += `年間収支: ${netYearlyCashFlow > 0 ? '+' : ''}${safeNum(netYearlyCashFlow).toLocaleString()}万円\n`;
      advice += `貯蓄率: ${yearlyIncome > 0 ? safeNum(Math.round(netYearlyCashFlow / yearlyIncome * 100)) : 0}%\n\n`;

      if (netYearlyCashFlow < 0) {
        advice += `【重要】現在、年間収支がマイナスです。このままでは資産が減少し続けます。支出の見直しまたは収入の増加が急務です。\n\n`;
      } else if (netYearlyCashFlow < yearlyIncome * 0.1) {
        advice += `【注意】貯蓄率が低い状態です。理想的には収入の20%以上を貯蓄・投資に回すことをお勧めします。\n\n`;
      }

      if (educationCosts > 0) {
        advice += `教育資金の予定: ${safeNum(educationCosts).toLocaleString()}万円\n`;
      }
      if (lifeEventCosts > 0) {
        advice += `ライフイベント費用: ${safeNum(lifeEventCosts).toLocaleString()}万円\n`;
      }
      if (totalLoans > 0) {
        advice += `借入残高: ${safeNum(totalLoans).toLocaleString()}万円\n`;
      }
      if (educationCosts > 0 || lifeEventCosts > 0 || totalLoans > 0) {
        advice += `\n`;
      }

      advice += `■ 老後資金の見通し\n`;
      advice += `${retirementAge}歳時点の予想資産: ${safeNum(balanceAtRetirement).toLocaleString()}万円\n`;
      advice += `年金収入（見込み）: 年間${safeNum(yearlyPensionIncome).toLocaleString()}万円\n`;
      advice += `退職後の年間支出: ${safeNum(yearlyExpense).toLocaleString()}万円\n`;
      advice += `年金との差額: ${retirementGap > 0 ? '不足' : '余裕'}${safeNum(Math.abs(retirementGap)).toLocaleString()}万円/年\n\n`;

      if (retirementGap > 0) {
        const requiredRetirementAssets = retirementGap * retirementYears;
        advice += `【重要分析】退職後${retirementYears}年間で必要な資産: ${safeNum(requiredRetirementAssets).toLocaleString()}万円\n`;

        if (balanceAtRetirement < requiredRetirementAssets) {
          const shortfall = requiredRetirementAssets - balanceAtRetirement;
          advice += `現状では${safeNum(shortfall).toLocaleString()}万円不足する見込みです。\n`;

          if (yearsToRetirement > 0) {
            const monthlyRequired = Math.ceil(shortfall / yearsToRetirement / 12);
            advice += `退職までに不足分を補うには、月々${safeNum(monthlyRequired).toLocaleString()}万円（年${safeNum(monthlyRequired * 12)}万円）の追加貯蓄が必要です。\n\n`;
          } else {
            advice += `既に退職年齢に達しているため、支出の削減または年金の繰下げ受給を検討すべきです。\n\n`;
          }
        } else {
          advice += `現状のプランでは老後資金は確保できる見込みです。\n\n`;
        }
      }

      advice += `■ シミュレーション結果\n`;
      advice += `${simulationEndAge}歳時点の予想資産: ${safeNum(finalBalance).toLocaleString()}万円\n`;

      if (hasNegativeBalance) {
        const firstNegativeAge = cashFlowData.find(d => d.balance < 0)?.age;
        advice += `\n【警告】${firstNegativeAge || ''}歳頃に資産が底をつく可能性があります。\n`;
        advice += `このままでは生活が維持できません。早急な対策が必要です。\n\n`;
      } else if (finalBalance < 0) {
        advice += `\n【警告】現在のプランでは晩年に資金不足が予想されます。\n\n`;
      } else if (finalBalance < 500) {
        advice += `\n【注意】人生後半の資金に余裕がありません。医療費や介護費用を考慮すると不安が残ります。\n\n`;
      }

      advice += `■ リスク管理の評価\n`;

      if (appData.insurances.length === 0) {
        advice += `【要改善】保険による備えがありません。万が一の事態に家族が困窮する可能性があります。\n`;
        if (appData.familyMembers.filter(m => m.relation !== 'self').length > 0) {
          advice += `特に扶養家族がいる場合、死亡保障は必須です。\n`;
        }
      } else {
        const totalInsurancePremium = yearlyInsuranceCost * 10;
        advice += `年間保険料: ${safeNum(yearlyInsuranceCost)}万円（10年で${safeNum(totalInsurancePremium)}万円）\n`;
        if (yearlyInsuranceCost > yearlyIncome * 0.1) {
          advice += `【注意】保険料が収入の10%を超えています。保障内容を見直し、無駄な保険がないか確認してください。\n`;
        }
      }
      advice += `\n`;

      const investmentAssets = appData.assets.reduce((s, a) => s + safeNum(a.current_value), 0);
      const investmentRatio = totalAssets > 0 ? (investmentAssets / totalAssets) * 100 : 0;

      advice += `投資資産比率: ${safeNum(Math.round(investmentRatio))}%\n`;
      if (yearsToRetirement > 10 && investmentRatio < 20) {
        advice += `【推奨】退職まで${yearsToRetirement}年あります。インフレに負けないよう、資産の一部を投資運用することをお勧めします。\n`;
      } else if (yearsToRetirement < 5 && investmentRatio > 50) {
        advice += `【注意】退職が近づいています。リスク資産の比率を徐々に下げ、安定資産へシフトすることを検討してください。\n`;
      }
      advice += `\n`;

      advice += `■ AIからの具体的アドバイス\n\n`;

      if (hasNegativeBalance || finalBalance < 0) {
        advice += `【最優先】資金ショートのリスクがあります。以下の対策を直ちに実行してください：\n`;
        advice += `1. 固定費の徹底的な見直し（通信費、保険料、サブスクなど）\n`;
        advice += `2. 副業や転職による収入増加の検討\n`;
        advice += `3. ライフイベントの優先順位付けと延期の検討\n`;
        advice += `4. 退職年齢の延長（${retirementAge + 3}歳まで働くと状況が改善される可能性）\n\n`;
      }

      if (netYearlyCashFlow > 0 && yearsToRetirement > 5) {
        advice += `【資産形成】\n`;
        const availableForInvestment = netYearlyCashFlow - yearlyAssetContribution;
        if (availableForInvestment > 50) {
          advice += `・年間${safeNum(netYearlyCashFlow)}万円の余剰資金のうち、${safeNum(Math.floor(availableForInvestment * 0.7))}万円程度をNISA・iDeCoなどの税制優遇制度で積立投資\n`;
        }
        advice += `・緊急予備資金（生活費の6ヶ月分）は定期預金で確保\n`;
        advice += `・住宅購入や教育資金など10年以内に使う資金は安全資産で運用\n\n`;
      }

      if (retirementGap > 0) {
        advice += `【老後対策】\n`;
        advice += `・公的年金の繰下げ受給を検討（70歳まで繰下げで42%増額）\n`;
        advice += `・退職後も健康なうちは軽い仕事を続け、収入の柱を確保\n`;
        advice += `・退職前に住居費の固定化（持ち家の場合はローン完済、賃貸の場合は住み替え検討）\n\n`;
      }

      if (appData.familyMembers.length > 1) {
        advice += `【家族全体で考える】\n`;
        advice += `・配偶者の就労による世帯収入の増加\n`;
        advice += `・子どもの教育資金は奨学金や教育ローンの活用も視野に\n`;
        advice += `・親の介護資金も考慮し、実家の資産状況を把握しておく\n\n`;
      }

      advice += `【定期的な見直し】\n`;
      advice += `・年1回は必ずライフプランを見直してください\n`;
      advice += `・収入や支出が変わったらすぐにシミュレーションし直す\n`;
      advice += `・想定外の出来事が起きても慌てず、柔軟に計画を修正する\n\n`;

      advice += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (appData.goals.q4) {
        advice += `あなたの「${appData.goals.q4}」という目標、素晴らしいと思います。\n`;
      }

      if (hasNegativeBalance) {
        advice += `\n現実は厳しいですが、今気づけたことが幸運です。まだ間に合います。\n`;
        advice += `一歩ずつ、確実に改善していきましょう。\n`;
      } else if (finalBalance < 1000) {
        advice += `\n現状では老後資金に不安が残りますが、今から対策を打てば十分に改善できます。\n`;
        advice += `焦らず、できることから始めていきましょう。\n`;
      } else {
        advice += `\n現状のプランは概ね良好です。この調子で計画的に進めていけば、安心した人生を送れるでしょう。\n`;
      }

      advice += `\nお金は人生を豊かにする手段です。数字に振り回されず、あなたらしい人生を歩んでください。\n`;
      advice += `\n※ このアドバイスはシミュレーション結果に基づく一般的な提案です。個別具体的な金融商品の選択や詳細なプランニングについては、専門のファイナンシャルプランナーにご相談されることをお勧めします。`;

      setAdvice(advice);
      setIsLoadingAdvice(false);
    }, 2000);
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

            {activeTab === 'share' && (
              <ShareSettingsTab
                planId={planId}
                isOwner={isOwner}
                planNumber={planNumber}
              />
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-700">資産推移シミュレーション</h2>
              <AssetChart data={cashFlowData} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-700">キャッシュフロー表</h2>
              <CashFlowTable data={cashFlowData} appData={appData} />
            </div>
          </div>
        </div>
      </div>
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
