import { useState, useEffect, useCallback } from 'react';
import { Wallet, DollarSign, TrendingUp, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { Deposit, FinancialsTabProps } from '../../types';

// Helper to safely parse formatted string input
const parseFormattedInput = (value: string | null): number => {
  if (!value) return 0;
  // Remove commas before parsing
  return parseInt(value.replace(/,/g, '') || '0');
};

// Helper to format number with commas
const formatWithCommas = (value: number): string => {
  return value.toLocaleString('en-US'); // Use 'en-US' locale for standard comma separation
};

export function FinancialsTab({
  deposits,
  onDepositAdd,
  onDepositEdit,
  onDelete,
  onReorder,
}: FinancialsTabProps) {
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [depositFormValues, setDepositFormValues] = useState<{
    name: string;
    initialAmount: string; // Stored as string for formatting control
    rate: string;
  }>({
    name: '',
    initialAmount: '',
    rate: '0',
  });

  useEffect(() => {
    // Initialize form values if editing
    if (editingDepositId) {
      const deposit = deposits.find(d => d.id === editingDepositId);
      if (deposit) {
        setDepositFormValues({
          name: deposit.name,
          initialAmount: formatWithCommas(deposit.initial_amount),
          rate: deposit.return_rate.toString(),
        });
      }
    } else {
      // Reset form values when not editing
      setDepositFormValues({
        name: '',
        initialAmount: '',
        rate: '0',
      });
    }
  }, [editingDepositId, deposits]);

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'deposit_initial_amount') {
      // Handle comma formatting for input value
      const numericValue = value.replace(/[^0-9,]/g, ''); // Allow only digits and commas
      const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setDepositFormValues(prev => ({ ...prev, initialAmount: formattedValue }));
    } else if (name === 'deposit_return_rate') {
      setDepositFormValues(prev => ({ ...prev, rate: value }));
    } else {
      setDepositFormValues(prev => ({ ...prev, name: value }));
    }
  };

  const handleDepositSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { name, initialAmount, rate } = depositFormValues;

    const deposit: Omit<Deposit, 'id'> = {
      name: name,
      initial_amount: parseFormattedInput(initialAmount),
      return_rate: parseFloat(rate) || 0,
    };

    if (editingDepositId) {
      onDepositEdit(editingDepositId, deposit);
      setEditingDepositId(null);
    } else {
      onDepositAdd(deposit);
    }
    // Reset form state after submission
    setDepositFormValues({ name: '', initialAmount: '', rate: '0' });
  };

  const handleEditDeposit = (id: string) => {
    setEditingDepositId(id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          預貯金・現金
        </h2>
        <form onSubmit={handleDepositSubmit} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">項目名</label>
              <input
                type="text"
                name="deposit_name"
                placeholder="例: 現在の預貯金 (現金)"
                value={depositFormValues.name}
                onChange={handleDepositChange}
                className="w-full rounded-md border-gray-300 border p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">現在額</label>
              <div className="flex items-center">
                <input
                  type="text" // Keep as text to control formatting
                  name="deposit_initial_amount"
                  placeholder="1000"
                  value={depositFormValues.initialAmount}
                  onChange={handleDepositChange}
                  className="flex-1 min-w-0 rounded-md border-gray-300 border p-2 text-sm text-right"
                  required
                />
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">万円</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年利回り</label>
              <div className="flex items-center">
                <input
                  type="text" // Keep as text for consistency, though usually number input is fine
                  name="deposit_return_rate"
                  placeholder="0.5"
                  value={depositFormValues.rate}
                  onChange={handleDepositChange}
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
              {editingDepositId ? '更新' : '追加'}
            </button>
            {editingDepositId && (
              <button
                type="button"
                onClick={() => {
                  setEditingDepositId(null);
                  setDepositFormValues({ name: '', initialAmount: '', rate: '0' });
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 rounded text-sm mt-1"
              >
                中止
              </button>
            )}
          </div>
        </form>
        <ul className="divide-y divide-gray-200 text-sm border rounded max-h-64 overflow-y-auto">
          {deposits.length === 0 ? (
            <li className="p-3 text-center text-gray-500">預貯金はまだありません</li>
          ) : (
            deposits.map((deposit, index) => (
              <li key={deposit.id} className="p-2 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{deposit.name}</span>
                    <span className="text-gray-600 ml-2">
                      {formatWithCommas(deposit.initial_amount)}万円
                    </span>
                    <span className="text-gray-500 ml-2">利回り{deposit.return_rate}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => onReorder(deposit.id, 'deposit', 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="上へ"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}
                    {index < deposits.length - 1 && (
                      <button
                        onClick={() => onReorder(deposit.id, 'deposit', 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="下へ"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditDeposit(deposit.id)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(deposit.id, 'deposit')}
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
