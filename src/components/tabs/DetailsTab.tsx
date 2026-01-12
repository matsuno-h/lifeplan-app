import { Home, CreditCard, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { Housing, Loan } from '../../types';
import { useState } from 'react';

interface DetailsTabProps {
  housings: Housing[];
  loans: Loan[];
  onHousingAdd: (housing: Omit<Housing, 'id'>) => void;
  onHousingEdit: (id: string, housing: Partial<Housing>) => void;
  onLoanAdd: (loan: Omit<Loan, 'id'>) => void;
  onLoanEdit: (id: string, loan: Partial<Loan>) => void;
  onDelete: (id: string, type: 'housing' | 'loan') => void;
  onReorder: (id: string, type: 'housing' | 'loan', direction: 'up' | 'down') => void;
}

export function DetailsTab({
  housings,
  loans,
  onHousingAdd,
  onHousingEdit,
  onLoanAdd,
  onLoanEdit,
  onDelete,
  onReorder,
}: DetailsTabProps) {
  const [housingType, setHousingType] = useState<'rental' | 'owned'>('rental');
  const [editingHousingId, setEditingHousingId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  const handleHousingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = housingType;

    const housing: Omit<Housing, 'id'> = {
      name: formData.get('housing_name') as string,
      type,
      start_age: parseInt(formData.get('housing_start_age') as string),
      end_age: parseInt(formData.get('housing_end_age') as string) || undefined,
    };

    if (type === 'rental') {
      housing.rent = parseInt(formData.get('rental_rent') as string) || undefined;
      housing.initial = parseInt(formData.get('rental_initial') as string) || undefined;
      housing.renewal_cost = parseInt(formData.get('rental_renewal_cost') as string) || undefined;
      housing.interval = parseInt(formData.get('rental_interval') as string) || 2;
    } else {
      housing.maintenance = parseInt(formData.get('owned_maintenance') as string) || undefined;
      housing.tax = parseInt(formData.get('owned_tax') as string) || undefined;
      housing.loan_balance = parseInt(formData.get('owned_loan_balance') as string) || undefined;
      housing.loan_monthly = parseInt(formData.get('owned_loan_monthly') as string) || undefined;
      housing.loan_end_age = parseInt(formData.get('owned_loan_end_age') as string) || undefined;
    }

    if (editingHousingId) {
      onHousingEdit(editingHousingId, housing);
      setEditingHousingId(null);
    } else {
      onHousingAdd(housing);
    }
    e.currentTarget.reset();
    setHousingType('rental');
  };

  const handleEditHousing = (housing: Housing) => {
    setEditingHousingId(housing.id);
    setHousingType(housing.type);

    setTimeout(() => {
      const form = document.getElementById('housing-form') as HTMLFormElement;
      if (form) {
        (form.elements.namedItem('housing_name') as HTMLInputElement).value = housing.name;
        (form.elements.namedItem('housing_start_age') as HTMLInputElement).value = housing.start_age.toString();
        (form.elements.namedItem('housing_end_age') as HTMLInputElement).value = housing.end_age?.toString() || '';
        if (housing.type === 'rental') {
          (form.elements.namedItem('rental_rent') as HTMLInputElement).value = housing.rent?.toString() || '';
          (form.elements.namedItem('rental_initial') as HTMLInputElement).value = housing.initial?.toString() || '';
          (form.elements.namedItem('rental_renewal_cost') as HTMLInputElement).value = housing.renewal_cost?.toString() || '';
          (form.elements.namedItem('rental_interval') as HTMLInputElement).value = housing.interval?.toString() || '2';
        } else {
          (form.elements.namedItem('owned_maintenance') as HTMLInputElement).value = housing.maintenance?.toString() || '';
          (form.elements.namedItem('owned_tax') as HTMLInputElement).value = housing.tax?.toString() || '';
          (form.elements.namedItem('owned_loan_balance') as HTMLInputElement).value = housing.loan_balance?.toString() || '';
          (form.elements.namedItem('owned_loan_monthly') as HTMLInputElement).value = housing.loan_monthly?.toString() || '';
          (form.elements.namedItem('owned_loan_end_age') as HTMLInputElement).value = housing.loan_end_age?.toString() || '';
        }
      }
    }, 0);
  };

  const handleLoanSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loan = {
      name: formData.get('loan_name') as string,
      balance: parseInt(formData.get('loan_balance') as string),
      monthly_payment: parseFloat(formData.get('loan_monthly') as string),
      remaining_payments: parseInt(formData.get('loan_remaining') as string),
    };

    if (editingLoanId) {
      onLoanEdit(editingLoanId, loan);
      setEditingLoanId(null);
    } else {
      onLoanAdd(loan);
    }
    e.currentTarget.reset();
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoanId(loan.id);
    const form = document.getElementById('loan-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('loan_name') as HTMLInputElement).value = loan.name;
      (form.elements.namedItem('loan_balance') as HTMLInputElement).value = loan.balance.toString();
      (form.elements.namedItem('loan_monthly') as HTMLInputElement).value = loan.monthly_payment.toString();
      (form.elements.namedItem('loan_remaining') as HTMLInputElement).value = loan.remaining_payments.toString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <Home className="mr-2 h-5 w-5" />
          住宅情報
        </h2>
        <form id="housing-form" onSubmit={handleHousingSubmit} className="space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                type="text"
                name="housing_name"
                placeholder="例: マイホーム"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">住居タイプ</label>
              <div className="flex items-center space-x-4 h-[38px]">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="housing_type"
                    value="rental"
                    checked={housingType === 'rental'}
                    onChange={() => setHousingType('rental')}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">賃貸</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="housing_type"
                    value="owned"
                    checked={housingType === 'owned'}
                    onChange={() => setHousingType('owned')}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">持ち家</span>
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">居住開始年齢</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="housing_start_age"
                  placeholder="30"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳から</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">居住終了年齢</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="housing_end_age"
                  placeholder="95"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳まで</span>
              </div>
            </div>
          </div>

          {housingType === 'rental' && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">家賃 (月額)</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="rental_rent"
                      placeholder="10"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">敷金</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="rental_initial"
                      placeholder="30"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">更新料</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="rental_renewal_cost"
                      placeholder="10"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">更新間隔</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="rental_interval"
                      placeholder="2"
                      defaultValue="2"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">年ごと</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {housingType === 'owned' && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">管理費・修繕積立金 (月額)</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="owned_maintenance"
                      placeholder="3"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">固定資産税 (年額)</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="owned_tax"
                      placeholder="15"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ローン残高</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="owned_loan_balance"
                      placeholder="3000"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ローン返済 (月額)</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="owned_loan_monthly"
                      placeholder="10"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">完済予定年齢</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="owned_loan_end_age"
                      placeholder="65"
                      className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    />
                    <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">※詳細なローン計算は「ローン」項目をご利用ください。ここでは簡易的な支出として計算されます。</p>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm"
            >
              {editingHousingId ? '更新' : '追加'}
            </button>
            {editingHousingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingHousingId(null);
                  setHousingType('rental');
                  (document.getElementById('housing-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-40 overflow-y-auto">
          {housings.length === 0 ? (
            <li className="p-3 text-center text-gray-500">住宅情報はまだありません</li>
          ) : (
            housings.map((housing, index) => (
              <li key={housing.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                <div className="flex-1">
                  <span className="font-medium">{housing.name}</span>
                  <span className="text-gray-500 ml-2">({housing.type === 'rental' ? '賃貸' : '持ち家'})</span>
                  <span className="text-gray-500 ml-2">
                    {housing.start_age}〜{housing.end_age || '終身'}歳
                  </span>
                </div>
                <div className="flex space-x-1">
                  {index > 0 && (
                    <button
                      onClick={() => onReorder(housing.id, 'housing', 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="上へ"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  )}
                  {index < housings.length - 1 && (
                    <button
                      onClick={() => onReorder(housing.id, 'housing', 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="下へ"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditHousing(housing)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="編集"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(housing.id, 'housing')}
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
          <CreditCard className="mr-2 h-5 w-5" />
          ローン
        </h2>
        <form id="loan-form" onSubmit={handleLoanSubmit} className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ローン名</label>
            <input
              type="text"
              name="loan_name"
              placeholder="例: マイカーローン"
              className="w-full rounded-md border-gray-300 border p-2 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">残高</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="loan_balance"
                  placeholder="200"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">月返済額</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="loan_monthly"
                  placeholder="3"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  step="0.1"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">残り回数</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="loan_remaining"
                  placeholder="60"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">回</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 mt-1">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm"
            >
              {editingLoanId ? '更新' : '追加'}
            </button>
            {editingLoanId && (
              <button
                type="button"
                onClick={() => {
                  setEditingLoanId(null);
                  (document.getElementById('loan-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-32 overflow-y-auto">
          {loans.length === 0 ? (
            <li className="p-3 text-center text-gray-500">ローンはまだありません</li>
          ) : (
            loans.map((loan, index) => (
              <li key={loan.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                <div className="flex-1">
                  <span className="font-medium">{loan.name}</span>
                  <span className="text-gray-600 ml-2">残高{loan.balance}万円</span>
                  <span className="text-gray-500 ml-2">月{loan.monthly_payment}万円</span>
                </div>
                <div className="flex space-x-1">
                  {index > 0 && (
                    <button
                      onClick={() => onReorder(loan.id, 'loan', 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="上へ"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  )}
                  {index < loans.length - 1 && (
                    <button
                      onClick={() => onReorder(loan.id, 'loan', 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="下へ"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditLoan(loan)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="編集"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(loan.id, 'loan')}
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
  );
}
