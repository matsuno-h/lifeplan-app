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
      asset_type: formData.get('asset_type') as string,
      current_value: parseInt(formData.get('asset_amount') as string),
      yearly_contribution: parseInt(formData.get('asset_yearly') as string) || 0,
      contribution_end_age: parseInt(formData.get('asset_contribution_end_age') as string) || undefined,
      return_rate: parseFloat(formData.get('asset_return') as string) || 0,
      withdrawal_age: parseInt(formData.get('asset_withdrawal_age') as string) || undefined,
      withdrawal_amount: parseInt(formData.get('asset_withdrawal_amount') as string) || undefined,
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
      (form.elements.namedItem('asset_name') as HTMLInputElement).value = asset.name;
      (form.elements.namedItem('asset_type') as HTMLSelectElement).value = asset.asset_type || '投資信託';
      (form.elements.namedItem('asset_amount') as HTMLInputElement).value = asset.current_value.toString();
      (form.elements.namedItem('asset_return') as HTMLInputElement).value = asset.return_rate.toString();
      (form.elements.namedItem('asset_yearly') as HTMLInputElement).value = asset.yearly_contribution.toString();
      (form.elements.namedItem('asset_contribution_end_age') as HTMLInputElement).value = asset.contribution_end_age?.toString() || '';
      (form.elements.namedItem('asset_withdrawal_age') as HTMLInputElement).value = asset.withdrawal_age?.toString() || '';
      (form.elements.namedItem('asset_withdrawal_amount') as HTMLInputElement).value = asset.withdrawal_amount?.toString() || '';
    }
  };

  const handleRealEstateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const realEstate = {
      name: formData.get('re_name') as string,
      purchase_date: formData.get('re_purchase_date') as string,
      purchase_price: parseInt(formData.get('re_price') as string) || 0,
      initial_cost: parseInt(formData.get('re_initial_cost') as string) || undefined,
      loan_payments: parseInt(formData.get('re_loan_payments') as string) || undefined,
      loan_term_months: parseInt(formData.get('re_loan_term_months') as string) || undefined,
      monthly_rent_income: parseInt(formData.get('re_rent_income') as string) || undefined,
      monthly_maintenance_cost: parseInt(formData.get('re_maintenance_cost') as string) || undefined,
      annual_property_tax: parseInt(formData.get('re_tax') as string) || undefined,
      sale_date: (formData.get('re_sale_date') as string) || undefined,
      sale_price: parseInt(formData.get('re_sale_price') as string) || undefined,
      sale_cost: parseInt(formData.get('re_sale_cost') as string) || undefined,
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
      (form.elements.namedItem('re_name') as HTMLInputElement).value = re.name;
      (form.elements.namedItem('re_purchase_date') as HTMLInputElement).value = re.purchase_date || '';
      (form.elements.namedItem('re_price') as HTMLInputElement).value = re.purchase_price.toString();
      (form.elements.namedItem('re_initial_cost') as HTMLInputElement).value = re.initial_cost?.toString() || '';
      (form.elements.namedItem('re_loan_payments') as HTMLInputElement).value = re.loan_payments?.toString() || '';
      (form.elements.namedItem('re_loan_term_months') as HTMLInputElement).value = re.loan_term_months?.toString() || '';
      (form.elements.namedItem('re_rent_income') as HTMLInputElement).value = re.monthly_rent_income?.toString() || '';
      (form.elements.namedItem('re_maintenance_cost') as HTMLInputElement).value = re.monthly_maintenance_cost?.toString() || '';
      (form.elements.namedItem('re_tax') as HTMLInputElement).value = re.annual_property_tax?.toString() || '';
      (form.elements.namedItem('re_sale_date') as HTMLInputElement).value = re.sale_date || '';
      (form.elements.namedItem('re_sale_price') as HTMLInputElement).value = re.sale_price?.toString() || '';
      (form.elements.namedItem('re_sale_cost') as HTMLInputElement).value = re.sale_cost?.toString() || '';
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
                required
              >
                <option value="投資信託">投資信託</option>
                <option value="国内株式">国内株式</option>
                <option value="海外株式">海外株式</option>
                <option value="国内債券">国内債券</option>
                <option value="海外債券">海外債券</option>
                <option value="REIT">REIT</option>
                <option value="金・銀・プラチナ">金・銀・プラチナ</option>
                <option value="FX">FX</option>
                <option value="仮想通貨">仮想通貨</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">現在の評価額</label>
              <div className="flex items-center">
                <input
                  type="number"
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
                  type="number"
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
          <div className="p-3 bg-blue-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-700">積立設定 (任意)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">積立額 (年額)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="asset_yearly"
                    placeholder="60"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                    min="0"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">積立終了年齢</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="asset_contribution_end_age"
                    placeholder="65"
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
                    type="number"
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
                    <span className="font-medium">{asset.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({asset.asset_type})</span>
                    <span className="text-gray-600 ml-2">{asset.current_value}万円</span>
                    <span className="text-gray-500 ml-2">利回り{asset.return_rate}%</span>
                    {asset.yearly_contribution > 0 && (
                      <span className="text-gray-500 ml-2">
                        積立{asset.yearly_contribution}万円/年
                        {asset.contribution_end_age && `(${asset.contribution_end_age}歳まで)`}
                      </span>
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
        <form id="realestate-form" onSubmit={handleRealEstateSubmit} className="space-y-3 mb-4">
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
                placeholder="2025-01"
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">購入価格</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="re_price"
                  placeholder="2000"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">初期費用</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="re_initial_cost"
                  placeholder="100"
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-700">ローン設定 (任意)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">返済額（月額）</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="re_loan_payments"
                    placeholder="5"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">返済回数</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="re_loan_term_months"
                    placeholder="420"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">回</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-700">運用収支・税金</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">家賃収入 (月額)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="re_rent_income"
                    placeholder="8"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">維持管理費 (月額)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="re_maintenance_cost"
                    placeholder="2"
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
                    name="re_tax"
                    placeholder="10"
                    className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm"
                  />
                  <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded space-y-3">
            <p className="text-xs font-bold text-gray-500">売却設定 (任意)</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">売却年月</label>
                <input
                  type="month"
                  name="re_sale_date"
                  placeholder="2035-01"
                  className="w-full rounded-md border-gray-300 border p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">売却価格</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="re_sale_price"
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
                    type="number"
                    name="re_sale_cost"
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm mt-1"
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
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
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
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div>
                      <span className="font-medium">{re.name}</span>
                      <span className="text-gray-600 ml-2">{re.purchase_price}万円</span>
                      {re.purchase_date && (
                        <span className="text-gray-500 ml-2">{re.purchase_date}購入</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-x-2">
                      {re.loan_payments && (
                        <span>返済{re.loan_payments}万円/月</span>
                      )}
                      {re.loan_term_months && (
                        <span>{re.loan_term_months}回払い</span>
                      )}
                      {re.monthly_rent_income && (
                        <span>家賃{re.monthly_rent_income}万円/月</span>
                      )}
                      {re.monthly_maintenance_cost && (
                        <span>維持費{re.monthly_maintenance_cost}万円/月</span>
                      )}
                      {re.annual_property_tax && (
                        <span>固定資産税{re.annual_property_tax}万円/年</span>
                      )}
                      {re.sale_date && (
                        <span>売却予定{re.sale_date}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
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
