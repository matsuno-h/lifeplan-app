import { Settings, Users, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { UserSettings, FamilyMember } from '../../types';
import { useState } from 'react';

interface BasicSettingsTabProps {
  settings: UserSettings;
  familyMembers: FamilyMember[];
  onSettingsUpdate: (settings: UserSettings) => void;
  onFamilyAdd: (member: Omit<FamilyMember, 'id'>) => void;
  onFamilyEdit: (id: string, member: Partial<FamilyMember>) => void;
  onFamilyDelete: (id: string) => void;
  onFamilyReorder: (id: string, direction: 'up' | 'down') => void;
}

export function BasicSettingsTab({
  settings,
  familyMembers,
  onSettingsUpdate,
  onFamilyAdd,
  onFamilyEdit,
  onFamilyDelete,
  onFamilyReorder,
}: BasicSettingsTabProps) {
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSettingsUpdate({
      user_name: formData.get('user_name') as string,
      birth_date: formData.get('birth_date') as string,
      gender: formData.get('gender') as 'male' | 'female' | 'other',
      disability: formData.get('disability') as 'none' | 'present',
      life_expectancy: parseInt(formData.get('life_expectancy') as string) || 85,
      retirement_age: parseInt(formData.get('retirement_age') as string),
      current_savings: parseInt(formData.get('current_savings') as string),
    });
  };

  const handleFamilySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const birthDate = formData.get('family_birth_date') as string;
    const member = {
      name: formData.get('family_name') as string,
      relation: formData.get('family_relation') as FamilyMember['relation'],
      birth_date: birthDate,
      birth_year: new Date(birthDate).getFullYear(),
      gender: formData.get('family_gender') as 'male' | 'female' | 'other',
      disability: formData.get('family_disability') as 'none' | 'present',
      life_expectancy: parseInt(formData.get('family_life_expectancy') as string) || 90,
    };

    if (editingFamilyId) {
      onFamilyEdit(editingFamilyId, member);
      setEditingFamilyId(null);
    } else {
      onFamilyAdd(member);
    }
    e.currentTarget.reset();
  };

  const handleEditFamily = (member: FamilyMember) => {
    setEditingFamilyId(member.id);
    const form = document.getElementById('family-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('family_name') as HTMLInputElement).value = member.name;
      (form.elements.namedItem('family_relation') as HTMLSelectElement).value = member.relation;
      (form.elements.namedItem('family_birth_date') as HTMLInputElement).value = member.birth_date;
      (form.elements.namedItem('family_gender') as HTMLSelectElement).value = member.gender;
      (form.elements.namedItem('family_disability') as HTMLSelectElement).value = member.disability;
      (form.elements.namedItem('family_life_expectancy') as HTMLInputElement).value = member.life_expectancy.toString();
    }
  };

  const relationLabels: Record<string, string> = {
    self: '本人',
    spouse: '配偶者',
    child: '子',
    parent: '親',
    other: 'その他',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          基本設定
        </h2>
        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
            <input
              type="text"
              name="user_name"
              defaultValue={settings.user_name}
              placeholder="例: 山田 太郎"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
              <input
                type="date"
                name="birth_date"
                defaultValue={settings.birth_date}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
              <select
                name="gender"
                defaultValue={settings.gender}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
              >
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">障害</label>
              <select
                name="disability"
                defaultValue={settings.disability}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
              >
                <option value="none">なし</option>
                <option value="present">あり</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">想定寿命</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="life_expectancy"
                  defaultValue={settings.life_expectancy}
                  placeholder="85"
                  className="flex-1 min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳</span>
              </div>
            </div>
          </div>
          <div className="border-t pt-4 mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">退職年齢</label>
            <div className="flex items-center">
              <input
                type="number"
                name="retirement_age"
                defaultValue={settings.retirement_age}
                placeholder="65"
                className="flex-1 min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                required
                min="0"
                max="100"
              />
              <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              現在の預貯金 (現金) <span className="text-xs text-red-500 font-normal">※投資資産は含めない</span>
            </label>
            <div className="flex items-center">
              <input
                type="number"
                name="current_savings"
                defaultValue={settings.current_savings}
                placeholder="300"
                className="flex-1 min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                required
                min="0"
              />
              <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
          >
            設定を保存して計算
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          家族情報
        </h2>
        <form id="family-form" onSubmit={handleFamilySubmit} className="space-y-3 mb-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input
                  type="text"
                  name="family_name"
                  placeholder="例: 花子"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">続柄</label>
                <select
                  name="family_relation"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                >
                  <option value="spouse">配偶者</option>
                  <option value="child">子</option>
                  <option value="parent">親</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <p className="col-span-2 text-xs text-gray-500">※本人の情報は「基本設定」で入力してください。</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
                <input
                  type="date"
                  name="family_birth_date"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                <select
                  name="family_gender"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">障害</label>
                <select
                  name="family_disability"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                >
                  <option value="none">なし</option>
                  <option value="present">あり</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">想定寿命</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="family_life_expectancy"
                    placeholder="90"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 mt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-sm transition duration-200"
            >
              {editingFamilyId ? '更新' : '追加'}
            </button>
            {editingFamilyId && (
              <button
                type="button"
                onClick={() => {
                  setEditingFamilyId(null);
                  (document.getElementById('family-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm transition duration-200"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-32 overflow-y-auto">
          {familyMembers.filter(m => m.relation !== 'self').length === 0 ? (
            <li className="p-3 text-center text-gray-500">家族情報はまだありません</li>
          ) : (
            familyMembers
              .filter(m => m.relation !== 'self')
              .map((member, index, arr) => (
                <li key={member.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex-1">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-gray-500 ml-2">({relationLabels[member.relation]})</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {new Date().getFullYear() - member.birth_year}歳
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {index > 0 && (
                      <button
                        onClick={() => onFamilyReorder(member.id, 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="上へ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    {index < arr.length - 1 && (
                      <button
                        onClick={() => onFamilyReorder(member.id, 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="下へ"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditFamily(member)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onFamilyDelete(member.id)}
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
