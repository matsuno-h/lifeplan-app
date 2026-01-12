import { useState } from 'react';
import { Shield, PiggyBank, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { Insurance, Pension, FamilyMember } from '../../types';

interface InsuranceTabProps {
  insurances: Insurance[];
  pensions: Pension[];
  familyMembers: FamilyMember[];
  onInsuranceAdd: (insurance: Omit<Insurance, 'id'>) => void;
  onInsuranceEdit: (id: string, updates: Partial<Insurance>) => void;
  onPensionAdd: (pension: Omit<Pension, 'id'>) => void;
  onPensionEdit: (id: string, updates: Partial<Pension>) => void;
  onDelete: (id: string, type: 'insurance' | 'pension') => void;
  onReorder: (id: string, type: string, direction: 'up' | 'down') => void;
}

// Helper to safely parse formatted string input
const parseFormattedInput = (value: string | null): number => {
  if (!value) return 0;
  return parseInt(value.replace(/,/g, '') || '0');
};

export function InsuranceTab({
  insurances,
  pensions,
  familyMembers,
  onInsuranceAdd,
  onInsuranceEdit,
  onPensionAdd,
  onPensionEdit,
  onDelete,
  onReorder,
}: InsuranceTabProps) {
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [editingPensionId, setEditingPensionId] = useState<string | null>(null);

  // Calculate current age of the main user for default values
  const selfMember = familyMembers.find(m => m.relation === 'self');
  const currentYear = new Date().getFullYear();
  const currentAge = selfMember ? (currentYear - selfMember.birth_year) : 30;

  const handleInsuranceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const period = parseFormattedInput(formData.get('ins_period') as string);
    const startAge = parseFormattedInput(formData.get('ins_start_age') as string);
    
    // Calculate end_age based on start_age and period.
    // If period is 10 years, and start is 30, we want it to cover 30,31,...,39 (10 years).
    // So end_age should be 30 + 10 - 1 = 39.
    // CashFlowTable uses inclusive comparison (age <= end_age).
    const endAge = startAge + period - 1;

    const insurance = {
      name: formData.get('ins_name') as string,
      type: formData.get('ins_company') as string || 'general',
      premium: parseFormattedInput(formData.get('ins_premium') as string),
      start_age: startAge,
      end_age: endAge,
      coverage: parseFormattedInput(formData.get('ins_surrender_amount') as string) || undefined,
    };

    if (editingInsuranceId) {
      onInsuranceEdit(editingInsuranceId, insurance);
      setEditingInsuranceId(null);
    } else {
      onInsuranceAdd(insurance);
    }
    e.currentTarget.reset();
    
    // Reset start age to current age after submit
    const startAgeInput = (document.getElementById('insurance-form') as HTMLFormElement)?.elements.namedItem('ins_start_age') as HTMLInputElement;
    if (startAgeInput) startAgeInput.value = currentAge.toString();
  };

  const handleEditInsurance = (insurance: Insurance) => {
    setEditingInsuranceId(insurance.id);
    const form = document.getElementById('insurance-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('ins_company') as HTMLInputElement).value = insurance.type;
      (form.elements.namedItem('ins_name') as HTMLInputElement).value = insurance.name;
      (form.elements.namedItem('ins_start_age') as HTMLInputElement).value = insurance.start_age.toString();
      // Calculate period from start and end age
      // end_age = start_age + period - 1  =>  period = end_age - start_age + 1
      const period = insurance.end_age - insurance.start_age + 1;
      (form.elements.namedItem('ins_period') as HTMLInputElement).value = period.toString();
      (form.elements.namedItem('ins_premium') as HTMLInputElement).value = insurance.premium.toLocaleString();
      (form.elements.namedItem('ins_surrender_amount') as HTMLInputElement).value = insurance.coverage?.toLocaleString() || '';
    }
  };

  const handlePensionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pension = {
      name: formData.get('pension_name') as string,
      start_age: parseFormattedInput(formData.get('pension_start_age') as string),
      amount: parseFormattedInput(formData.get('pension_amount') as string),
    };

    if (editingPensionId) {
      onPensionEdit(editingPensionId, pension);
      setEditingPensionId(null);
    } else {
      onPensionAdd(pension);
    }
    e.currentTarget.reset();
  };

  const handleEditPension = (pension: Pension) => {
    setEditingPensionId(pension.id);
    const form = document.getElementById('pension-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('pension_name') as HTMLInputElement).value = pension.name;
      (form.elements.namedItem('pension_start_age') as HTMLInputElement).value = pension.start_age.toString();
      (form.elements.namedItem('pension_amount') as HTMLInputElement).value = pension.amount.toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          保険
        </h2>
        <form id="insurance-form" onSubmit={handleInsuranceSubmit} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保険会社名</label>
              <input
                type="text"
                name="ins_company"
                placeholder="例: 〇〇生命"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商品名</label>
              <input
                type="text"
                name="ins_name"
                placeholder="例: 医療保険"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">加入年齢</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="ins_start_age"
                  defaultValue={currentAge}
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">契約期間</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="ins_period"
                  placeholder="10"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">年</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保険料 (年額)</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="ins_premium"
                  placeholder="5"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">満期・解約時受取額</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="ins_surrender_amount"
                  placeholder="100"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
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
              {editingInsuranceId ? '更新' : '追加'}
            </button>
            {editingInsuranceId && (
              <button
                type="button"
                onClick={() => {
                  setEditingInsuranceId(null);
                  const form = document.getElementById('insurance-form') as HTMLFormElement;
                  form?.reset();
                  // Reset start age to current age
                  const startAgeInput = form?.elements.namedItem('ins_start_age') as HTMLInputElement;
                  if (startAgeInput) startAgeInput.value = currentAge.toString();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-64 overflow-y-auto">
          {insurances.length === 0 ? (
            <li className="p-3 text-center text-gray-500">保険はまだありません</li>
          ) : (
            insurances.map((insurance, index) => (
              <li key={insurance.id} className="p-2 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    {insurance.type && insurance.type !== 'general' && (
                      <span className="text-gray-500 mr-1">{insurance.type}</span>
                    )}
                    <span className="font-medium">{insurance.name}</span>
                    <span className="text-gray-600 ml-2">
                      {insurance.start_age}歳〜{insurance.end_age}歳
                    </span>
                    <span className="text-gray-600 ml-2">年{(insurance.premium ?? 0).toLocaleString()}万円</span>
                    {insurance.coverage != null && (
                      <span className="text-gray-500 ml-2">受取{(insurance.coverage ?? 0).toLocaleString()}万円</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => onReorder(insurance.id, 'insurance', 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="上へ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    {index < insurances.length - 1 && (
                      <button
                        onClick={() => onReorder(insurance.id, 'insurance', 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="下へ"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditInsurance(insurance)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(insurance.id, 'insurance')}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <PiggyBank className="mr-2 h-5 w-5" />
          年金
        </h2>
        <form id="pension-form" onSubmit={handlePensionSubmit} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受給者</label>
              <select name="pension_owner_id" className="w-full rounded-md border-gray-300 border p-2 text-sm">
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年金名</label>
              <input
                type="text"
                name="pension_name"
                placeholder="例: 公的年金"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受給開始年齢</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="pension_start_age"
                  placeholder="65"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳から</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受給額 (年額)</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="pension_amount"
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
              {editingPensionId ? '更新' : '追加'}
            </button>
            {editingPensionId && (
              <button
                type="button"
                onClick={() => {
                  setEditingPensionId(null);
                  (document.getElementById('pension-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-64 overflow-y-auto">
          {pensions.length === 0 ? (
            <li className="p-3 text-center text-gray-500">年金情報はまだありません</li>
          ) : (
            pensions.map((pension, index) => (
              <li key={pension.id} className="p-2 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{pension.name}</span>
                    <span className="text-gray-500 ml-2">{pension.start_age}歳から</span>
                    <span className="text-gray-600 ml-2">年{(pension.amount ?? 0).toLocaleString()}万円</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => onReorder(pension.id, 'pension', 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="上へ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    {index < pensions.length - 1 && (
                      <button
                        onClick={() => onReorder(pension.id, 'pension', 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="下へ"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditPension(pension)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(pension.id, 'pension')}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
