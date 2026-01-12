import { Briefcase, ShoppingCart, GraduationCap, CalendarPlus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Income, Expense, Education, LifeEvent, FamilyMember } from '../../types';
import { useState } from 'react';

interface IncomeExpenseTabProps {
  incomes: Income[];
  expenses: Expense[];
  educationFunds: Education[];
  lifeEvents: LifeEvent[];
  familyMembers: FamilyMember[];
  onIncomeAdd: (income: Omit<Income, 'id'>) => void;
  onIncomeEdit: (id: string, income: Partial<Income>) => void;
  onExpenseAdd: (expense: Omit<Expense, 'id'>) => void;
  onExpenseEdit: (id: string, expense: Partial<Expense>) => void;
  onEducationAdd: (education: Omit<Education, 'id'>) => void;
  onEducationEdit: (id: string, education: Partial<Education>) => void;
  onLifeEventAdd: (event: Omit<LifeEvent, 'id'>) => void;
  onLifeEventEdit: (id: string, event: Partial<LifeEvent>) => void;
  onDelete: (id: string, type: 'income' | 'expense' | 'education' | 'lifeEvent') => void;
  onReorder: (id: string, type: 'income' | 'expense' | 'education' | 'lifeEvent', direction: 'up' | 'down') => void;
}

// Helper to safely parse formatted string input
const parseFormattedInput = (value: string | null): number => {
  if (!value) return 0;
  return parseInt(value.replace(/,/g, '') || '0');
};

// Helper to safely parse formatted float input
const parseFloatFormattedInput = (value: string | null): number => {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, '') || '0');
};

export function IncomeExpenseTab({
  incomes,
  expenses,
  educationFunds,
  lifeEvents,
  familyMembers,
  onIncomeAdd,
  onIncomeEdit,
  onExpenseAdd,
  onExpenseEdit,
  onEducationAdd,
  onEducationEdit,
  onLifeEventAdd,
  onLifeEventEdit,
  onDelete,
  onReorder,
}: IncomeExpenseTabProps) {
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [editingLifeEventId, setEditingLifeEventId] = useState<string | null>(null);

  const handleIncomeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const income = {
      name: formData.get('income_name') as string,
      start_age: parseFormattedInput(formData.get('income_start_age') as string),
      end_age: parseFormattedInput(formData.get('income_end_age') as string),
      amount: parseFormattedInput(formData.get('income_amount') as string),
      growth_rate: parseFloatFormattedInput(formData.get('income_growth_rate') as string) || 0,
    };

    if (editingIncomeId) {
      onIncomeEdit(editingIncomeId, income);
      setEditingIncomeId(null);
    } else {
      onIncomeAdd(income);
    }
    e.currentTarget.reset();
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncomeId(income.id);
    const form = document.getElementById('income-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('income_name') as HTMLInputElement).value = income.name;
      (form.elements.namedItem('income_start_age') as HTMLInputElement).value = income.start_age.toString();
      (form.elements.namedItem('income_end_age') as HTMLInputElement).value = income.end_age.toString();
      (form.elements.namedItem('income_amount') as HTMLInputElement).value = income.amount.toLocaleString();
      (form.elements.namedItem('income_growth_rate') as HTMLInputElement).value = income.growth_rate.toString();
    }
  };

  const handleExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const expense = {
      name: formData.get('expense_name') as string,
      start_age: parseFormattedInput(formData.get('expense_start_age') as string),
      end_age: parseFormattedInput(formData.get('expense_end_age') as string),
      amount: parseFormattedInput(formData.get('expense_amount') as string),
      inflation_rate: parseFloatFormattedInput(formData.get('expense_inflation_rate') as string) || 0,
    };

    if (editingExpenseId) {
      onExpenseEdit(editingExpenseId, expense);
      setEditingExpenseId(null);
    } else {
      onExpenseAdd(expense);
    }
    e.currentTarget.reset();
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    const form = document.getElementById('expense-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('expense_name') as HTMLInputElement).value = expense.name;
      (form.elements.namedItem('expense_start_age') as HTMLInputElement).value = expense.start_age.toString();
      (form.elements.namedItem('expense_end_age') as HTMLInputElement).value = expense.end_age.toString();
      (form.elements.namedItem('expense_amount') as HTMLInputElement).value = expense.amount.toLocaleString();
      (form.elements.namedItem('expense_inflation_rate') as HTMLInputElement).value = (expense.inflation_rate || 0).toString();
    }
  };

  const handleEducationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const education = {
      owner_id: formData.get('education_owner_id') as string,
      name: formData.get('education_name') as string,
      start_age: parseFormattedInput(formData.get('education_start_age') as string),
      end_age: parseFormattedInput(formData.get('education_end_age') as string),
      amount: parseFormattedInput(formData.get('education_amount') as string),
    };

    if (editingEducationId) {
      onEducationEdit(editingEducationId, education);
      setEditingEducationId(null);
    } else {
      onEducationAdd(education);
    }
    e.currentTarget.reset();
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducationId(edu.id);
    const form = document.getElementById('education-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('education_owner_id') as HTMLSelectElement).value = edu.owner_id;
      (form.elements.namedItem('education_name') as HTMLInputElement).value = edu.name;
      (form.elements.namedItem('education_start_age') as HTMLInputElement).value = edu.start_age.toString();
      (form.elements.namedItem('education_end_age') as HTMLInputElement).value = edu.end_age.toString();
      (form.elements.namedItem('education_amount') as HTMLInputElement).value = edu.amount.toLocaleString();
    }
  };

  const handleLifeEventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const lifeEvent = {
      name: formData.get('event_name') as string,
      age: parseFormattedInput(formData.get('event_age') as string),
      cost: parseFormattedInput(formData.get('event_cost') as string),
    };

    if (editingLifeEventId) {
      onLifeEventEdit(editingLifeEventId, lifeEvent);
      setEditingLifeEventId(null);
    } else {
      onLifeEventAdd(lifeEvent);
    }
    e.currentTarget.reset();
  };

  const handleEditLifeEvent = (event: LifeEvent) => {
    setEditingLifeEventId(event.id);
    const form = document.getElementById('lifeevent-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('event_name') as HTMLInputElement).value = event.name;
      (form.elements.namedItem('event_age') as HTMLInputElement).value = event.age.toString();
      (form.elements.namedItem('event_cost') as HTMLInputElement).value = event.cost.toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <Briefcase className="mr-2 h-5 w-5" />
          収入源
        </h2>
        <form id="income-form" onSubmit={handleIncomeSubmit} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称 (何の仕事)</label>
              <input
                type="text"
                name="income_name"
                placeholder="例: 給与収入"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">収入額 (年額・手取り)</label>
              <div className="flex items-center">
                <input
                  type="text" // Changed to text for formatting
                  name="income_amount"
                  placeholder="400"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期間 (開始年齢〜終了年齢)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="income_start_age"
                  placeholder="30"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="text-gray-500">〜</span>
                <input
                  type="number"
                  name="income_end_age"
                  placeholder="65"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">歳</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">変動率 (昇給など)</label>
              <div className="flex items-center">
                <input
                  type="text" // Changed to text for consistency
                  name="income_growth_rate"
                  placeholder="1.0"
                  defaultValue="0"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  step="0.1"
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">%</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm mt-1"
            >
              {editingIncomeId ? '更新' : '追加'}
            </button>
            {editingIncomeId && (
              <button
                type="button"
                onClick={() => {
                  setEditingIncomeId(null);
                  (document.getElementById('income-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-32 overflow-y-auto">
          {incomes.length === 0 ? (
            <li className="p-3 text-center text-gray-500">収入源はまだありません</li>
          ) : (
            incomes.map((income, index) => (
              <li key={income.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                <div className="flex-1">
                  <span className="font-medium">{income.name}</span>
                  <span className="text-gray-500 ml-2">
                    {income.start_age}〜{income.end_age}歳
                  </span>
                  <span className="text-gray-600 ml-2">{income.amount.toLocaleString()}万円/年</span>
                </div>
                <div className="flex space-x-1">
                  {index > 0 && (
                    <button
                      onClick={() => onReorder(income.id, 'income', 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="上へ"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  )}
                  {index < incomes.length - 1 && (
                    <button
                      onClick={() => onReorder(income.id, 'income', 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="下へ"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditIncome(income)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="編集"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(income.id, 'income')}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          基本生活費
        </h2>
        <form id="expense-form" onSubmit={handleExpenseSubmit} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">項目名</label>
              <input
                type="text"
                name="expense_name"
                placeholder="例: 基本生活費"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金額 (年額)</label>
              <div className="flex items-center">
                <input
                  type="text" // Changed to text for formatting
                  name="expense_amount"
                  placeholder="250"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期間 (開始年齢〜終了年齢)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="expense_start_age"
                  placeholder="30"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="text-gray-500">〜</span>
                <input
                  type="number"
                  name="expense_end_age"
                  placeholder="95"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">歳</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">物価上昇率</label>
              <div className="flex items-center">
                <input
                  type="text" // Changed to text for consistency
                  name="expense_inflation_rate"
                  placeholder="0.0"
                  defaultValue="0"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  step="0.1"
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">%</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-1 mb-2">
            ※ 住居費、教育費、保険料はここには含めず、それぞれの項目で入力してください。
          </p>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm mt-1"
            >
              {editingExpenseId ? '更新' : '追加'}
            </button>
            {editingExpenseId && (
              <button
                type="button"
                onClick={() => {
                  setEditingExpenseId(null);
                  (document.getElementById('expense-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-32 overflow-y-auto">
          {expenses.length === 0 ? (
            <li className="p-3 text-center text-gray-500">生活費項目はまだありません</li>
          ) : (
            expenses.map((expense, index) => (
              <li key={expense.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                <div className="flex-1">
                  <span className="font-medium">{expense.name}</span>
                  <span className="text-gray-500 ml-2">
                    {expense.start_age}〜{expense.end_age}歳
                  </span>
                  <span className="text-gray-600 ml-2">{expense.amount.toLocaleString()}万円/年</span>
                </div>
                <div className="flex space-x-1">
                  {index > 0 && (
                    <button
                      onClick={() => onReorder(expense.id, 'expense', 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="上へ"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  )}
                  {index < expenses.length - 1 && (
                    <button
                      onClick={() => onReorder(expense.id, 'expense', 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="下へ"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditExpense(expense)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="編集"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(expense.id, 'expense')}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <GraduationCap className="mr-2 h-5 w-5" />
          教育資金
        </h2>
        <form id="education-form" onSubmit={handleEducationSubmit} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">対象者</label>
              <select
                name="education_owner_id"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
              >
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">項目名</label>
              <input
                type="text"
                name="education_name"
                placeholder="例: 大学費用"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期間 (開始年齢〜終了年齢)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="education_start_age"
                  placeholder="18"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="text-gray-500">〜</span>
                <input
                  type="number"
                  name="education_end_age"
                  placeholder="22"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">歳</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">費用 (年額)</label>
              <div className="flex items-center">
                <input
                  type="text" // Changed to text for formatting
                  name="education_amount"
                  placeholder="100"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm mt-1"
            >
              {editingEducationId ? '更新' : '追加'}
            </button>
            {editingEducationId && (
              <button
                type="button"
                onClick={() => {
                  setEditingEducationId(null);
                  (document.getElementById('education-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-32 overflow-y-auto">
          {educationFunds.length === 0 ? (
            <li className="p-3 text-center text-gray-500">教育資金はまだありません</li>
          ) : (
            educationFunds.map((edu, index) => {
              const owner = familyMembers.find((m) => m.id === edu.owner_id);
              return (
                <li key={edu.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex-1">
                    <span className="font-medium">{edu.name}</span>
                    <span className="text-gray-500 ml-2">({owner?.name || '不明'})</span>
                    <span className="text-gray-500 ml-2">
                      {edu.start_age}〜{edu.end_age}歳
                    </span>
                    <span className="text-gray-600 ml-2">{edu.amount.toLocaleString()}万円/年</span>
                  </div>
                  <div className="flex space-x-1">
                    {index > 0 && (
                      <button
                        onClick={() => onReorder(edu.id, 'education', 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="上へ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    {index < educationFunds.length - 1 && (
                      <button
                        onClick={() => onReorder(edu.id, 'education', 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="下へ"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditEducation(edu)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(edu.id, 'education')}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <CalendarPlus className="mr-2 h-5 w-5" />
          ライフイベント
        </h2>
        <form id="lifeevent-form" onSubmit={handleLifeEventSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">イベント名</label>
              <input
                type="text"
                name="event_name"
                placeholder="例: 住宅購入"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">発生年齢</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="event_age"
                  placeholder="35"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">費用</label>
            <div className="flex items-center">
              <input
                type="text" // Changed to text for formatting
                name="event_cost"
                placeholder="3000"
                className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                required
              />
              <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">※ 臨時収入の場合はマイナスの値を入力してください</p>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
            >
              {editingLifeEventId ? '更新' : 'イベントを保存'}
            </button>
            {editingLifeEventId && (
              <button
                type="button"
                onClick={() => {
                  setEditingLifeEventId(null);
                  (document.getElementById('lifeevent-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
              >
                中止
              </button>
            )}
          </div>
        </form>

        <div className="mt-4">
          <h3 className="font-bold text-sm text-gray-600 mb-2">登録済みイベント</h3>
          <div className="overflow-y-auto max-h-40 border rounded">
            <ul className="divide-y divide-gray-200">
              {lifeEvents.length === 0 ? (
                <li className="p-3 text-center text-gray-500 text-sm">イベントはまだありません</li>
              ) : (
                lifeEvents.map((event, index) => (
                  <li key={event.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex-1">
                      <span className="font-medium">{event.name}</span>
                      <span className="text-gray-500 ml-2">{event.age}歳</span>
                      <span className="text-gray-600 ml-2">
                        {event.cost > 0 ? '+' : ''}
                        {event.cost.toLocaleString()}万円
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {index > 0 && (
                        <button
                          onClick={() => onReorder(event.id, 'lifeEvent', 'up')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="上へ"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      )}
                      {index < lifeEvents.length - 1 && (
                        <button
                          onClick={() => onReorder(event.id, 'lifeEvent', 'down')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="下へ"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditLifeEvent(event)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="編集"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(event.id, 'lifeEvent')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
