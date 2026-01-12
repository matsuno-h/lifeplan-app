import { useState } from 'react';
import { Coins, Building2, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { Asset, RealEstate } from '../../types';

interface AssetsTabProps {
  assets: Asset[];
  realEstates: RealEstate[];
  onAssetAdd: (asset: Omit<Asset, 'id'>) => void;
  onAssetEdit: (id: string, updates: Partial<Asset>) => void;
  onRealEstateAdd: (realEstate: Omit<RealEstate, 'id'>) => void;
  onRealEstateEdit: (id: string, updates: Partial<RealEstate>) => void;
  onDelete: (id: string, type: 'asset' | 'realEstate') => void;
  onReorder: (id: string, type: string, direction: 'up' | 'down') => void;
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

const ASSET_TYPES = [
  '国内債権',
  '海外債権',
  '国内株式',
  '海外株式',
  '投資信託',
  '金銀プラチナ',
  '外貨建MMF',
  'REIT',
  '仮想通貨',
  '定期預金'
];

export function AssetsTab({
  assets,
  realEstates,
  onAssetAdd,
  onAssetEdit,
  onRealEstateAdd,
  onRealEstateEdit,
  onDelete,
  onReorder,
}: AssetsTabProps) {
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingRealEstateId, setEditingRealEstateId] = useState<string | null>(null);

  const handleAssetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const asset = {
      name: formData.get('asset_name') as string,
      type: formData.get('asset_type') as string,
      current_value: parseFormattedInput(formData.get('asset_amount') as string),
      yearly_contribution: parseFormattedInput(formData.get('asset_yearly') as string),
      accumulation_end_age: parseFormattedInput(formData.get('asset_accumulation_end_age') as string) || undefined,
      return_rate: parseFloatFormattedInput(formData.get('asset_return') as string),
      withdrawal_age: parseFormattedInput(formData.get('asset_withdrawal_age') as string) || undefined,
      withdrawal_amount: parseFormattedInput(formData.get('asset_withdrawal_amount') as string) || undefined,
    };

    if (editingAssetId) {
      onAssetEdit(editingAssetId, asset);
      setEditingAssetId(null);
    } else {
      onAssetAdd(asset);
    }
    e.currentTarget.reset();
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAssetId(asset.id);
    const form = document.getElementById('asset-form') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('asset_name') as HTMLInputElement).value = asset.name || '';
      (form.elements.namedItem('asset_type') as HTMLSelectElement).value = asset.type || ASSET_TYPES[4]; // Default to 投資信託
      (form.elements.namedItem('asset_amount') as HTMLInputElement).value = asset.current_value?.toLocaleString() || '0';
      (form.elements.namedItem('asset_return') as HTMLInputElement).value = asset.return_rate?.toString() || '0';
      (form.elements.namedItem('asset_yearly') as HTMLInputElement).value = asset.yearly_contribution?.toLocaleString() || '0';
      (form.elements.namedItem('asset_accumulation_end_age') as HTMLInputElement).value = asset.accumulation_end_age?.toString() || '';
      (form.elements.namedItem('asset_withdrawal_age') as HTMLInputElement).value = asset.withdrawal_age?.toString() || '';
      (form.elements.namedItem('asset_withdrawal_amount') as HTMLInputElement).value = asset.withdrawal_amount?.toLocaleString() || '';
    }
  };

  const handleRealEstateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const realEstate: Omit<RealEstate, 'id'> = {
      name: formData.get('re_name') as string,
      purchase_date: formData.get('re_purchase_date') as string,
      purchase_price: parseFormattedInput(formData.get('re_price') as string),
      initial_cost: parseFormattedInput(formData.get('re_initial_cost') as string),
      
      loan_amount: parseFormattedInput(formData.get('re_loan_amount') as string),
      loan_rate: parseFloatFormattedInput(formData.get('re_loan_rate') as string),
      loan_duration: parseFormattedInput(formData.get('re_loan_duration') as string),
      
      rent_income: parseFormattedInput(formData.get('re_rent_income') as string),
      maintenance_cost: parseFormattedInput(formData.get('re_maintenance_cost') as string),
      property_tax: parseFormattedInput(formData.get('re_property_tax') as string),
      
      sell_date: (formData.get('re_sell_date') as string) || undefined,
      sell_price: parseFormattedInput(formData.get('re_sell_price') as string) || undefined,
      sell_cost: parseFormattedInput(formData.get('re_sell_cost') as string) || undefined,
    };

    if (editingRealEstateId) {
      onRealEstateEdit(editingRealEstateId, realEstate);
      setEditingRealEstateId(null);
    } else {
      onRealEstateAdd(realEstate);
    }
    e.currentTarget.reset();
  };

  const handleEditRealEstate = (re: RealEstate) => {
    setEditingRealEstateId(re.id);
    const form = document.getElementById('realestate-form') as HTMLFormElement;
    if (form) {
      // Basic
      (form.elements.namedItem('re_name') as HTMLInputElement).value = re.name || '';
      (form.elements.namedItem('re_purchase_date') as HTMLInputElement).value = re.purchase_date || '';
      (form.elements.namedItem('re_price') as HTMLInputElement).value = re.purchase_price?.toLocaleString() || '0';
      (form.elements.namedItem('re_initial_cost') as HTMLInputElement).value = re.initial_cost?.toLocaleString() || '0';
      
      // Loan
      (form.elements.namedItem('re_loan_amount') as HTMLInputElement).value = re.loan_amount?.toLocaleString() || '0';
      (form.elements.namedItem('re_loan_rate') as HTMLInputElement).value = re.loan_rate?.toString() || '0';
      (form.elements.namedItem('re_loan_duration') as HTMLInputElement).value = re.loan_duration?.toString() || '0';
      
      // Operations
      (form.elements.namedItem('re_rent_income') as HTMLInputElement).value = re.rent_income?.toLocaleString() || '0';
      (form.elements.namedItem('re_maintenance_cost') as HTMLInputElement).value = re.maintenance_cost?.toLocaleString() || '0';
      (form.elements.namedItem('re_property_tax') as HTMLInputElement).value = re.property_tax?.toLocaleString() || '0';
      
      // Sale
      (form.elements.namedItem('re_sell_date') as HTMLInputElement).value = re.sell_date || '';
      (form.elements.namedItem('re_sell_price') as HTMLInputElement).value = re.sell_price?.toLocaleString() || '';
      (form.elements.namedItem('re_sell_cost') as HTMLInputElement).value = re.sell_cost?.toLocaleString() || '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <Coins className="mr-2 h-5 w-5" />
          金融資産
        </h2>
        <form id="asset-form" onSubmit={handleAssetSubmit} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">資産名</label>
              <input
                type="text"
                name="asset_name"
                placeholder="例: 全米株式"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
              <select
                name="asset_type"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                defaultValue={ASSET_TYPES[4]} // Default to 投資信託
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">現在の評価額</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="asset_amount"
                  placeholder="100"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年利回り</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="asset_return"
                  placeholder="5"
                  defaultValue="0"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  step="0.1"
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">%</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-500">積立設定</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">積立額 (年額)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="asset_yearly"
                    placeholder="60"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    min="0"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">積立終了年齢 (任意)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="asset_accumulation_end_age"
                    placeholder="60"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳まで</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-500">取り崩し設定 (任意)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始年齢</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="asset_withdrawal_age"
                    placeholder="65"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">歳から</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">取り崩し額 (年額)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="asset_withdrawal_amount"
                    placeholder="100"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm mt-1"
            >
              {editingAssetId ? '更新' : '追加'}
            </button>
            {editingAssetId && (
              <button
                type="button"
                onClick={() => {
                  setEditingAssetId(null);
                  (document.getElementById('asset-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-64 overflow-y-auto">
          {assets.length === 0 ? (
            <li className="p-3 text-center text-gray-500">資産はまだありません</li>
          ) : (
            assets.map((asset, index) => (
              <li key={asset.id} className="p-2 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{asset.name}</span>
                      {asset.type && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {asset.type}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 mt-1">
                      現在: {asset.current_value.toLocaleString()}万円 (利回り{asset.return_rate}%)
                    </div>
                    {asset.yearly_contribution > 0 && (
                      <div className="text-gray-500 text-xs">
                        積立: {asset.yearly_contribution.toLocaleString()}万円/年
                        {asset.accumulation_end_age ? ` (~${asset.accumulation_end_age}歳)` : ''}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => onReorder(asset.id, 'asset', 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="上へ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    {index < assets.length - 1 && (
                      <button
                        onClick={() => onReorder(asset.id, 'asset', 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="下へ"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditAsset(asset)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(asset.id, 'asset')}
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
          <Building2 className="mr-2 h-5 w-5" />
          不動産
        </h2>
        <form id="realestate-form" onSubmit={handleRealEstateSubmit} className="space-y-4 mb-4">
          {/* 基本情報 */}
          <div className="p-3 bg-gray-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-500">基本情報</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物件名</label>
                <input
                  type="text"
                  name="re_name"
                  placeholder="例: 区分マンションA"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">購入年月</label>
                <input
                  type="month"
                  name="re_purchase_date"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">購入価格</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_price"
                    placeholder="2000"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初期費用</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_initial_cost"
                    placeholder="100"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
            </div>
          </div>

          {/* ローン設定 */}
          <div className="p-3 bg-gray-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-500">ローン設定</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">借入額</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_loan_amount"
                    placeholder="1800"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金利</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_loan_rate"
                    placeholder="2.5"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    step="0.01"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">返済回数</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_loan_duration"
                    placeholder="420"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">回</span>
                </div>
              </div>
            </div>
          </div>

          {/* 運用収支 */}
          <div className="p-3 bg-gray-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-500">運用収支・税金</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">家賃収入(月)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_rent_income"
                    placeholder="8"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">維持費(月)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_maintenance_cost"
                    placeholder="2"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">固定資産税(年)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_property_tax"
                    placeholder="10"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
            </div>
          </div>

          {/* 売却設定 */}
          <div className="p-3 bg-gray-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-500">売却設定 (任意)</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">売却年月</label>
                <input
                  type="month"
                  name="re_sell_date"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">売却価格</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_sell_price"
                    placeholder="1800"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">売却諸経費</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="re_sell_cost"
                    placeholder="60"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm"
            >
              {editingRealEstateId ? '更新' : '追加'}
            </button>
            {editingRealEstateId && (
              <button
                type="button"
                onClick={() => {
                  setEditingRealEstateId(null);
                  (document.getElementById('realestate-form') as HTMLFormElement)?.reset();
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-64 overflow-y-auto">
          {realEstates.length === 0 ? (
            <li className="p-3 text-center text-gray-500">不動産はまだありません</li>
          ) : (
            realEstates.map((re, index) => (
              <li key={re.id} className="p-2 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{re.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      購入: {re.purchase_date} ({re.purchase_price.toLocaleString()}万円)
                      {re.sell_date && ` → 売却: ${re.sell_date}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      家賃: {re.rent_income.toLocaleString()}万円/月, 
                      ローン: {re.loan_amount.toLocaleString()}万円 ({re.loan_rate}%, {re.loan_duration}回)
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => onReorder(re.id, 'realEstate', 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="上へ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    {index < realEstates.length - 1 && (
                      <button
                        onClick={() => onReorder(re.id, 'realEstate', 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="下へ"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditRealEstate(re)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(re.id, 'realEstate')}
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
