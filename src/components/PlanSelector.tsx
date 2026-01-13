import { FileText } from 'lucide-react';

interface PlanSelectorProps {
  currentPlanNumber: number;
  onSelectPlan: (planNumber: number) => void;
  disabled?: boolean;
}

export function PlanSelector({ currentPlanNumber, onSelectPlan, disabled = false }: PlanSelectorProps) {
  const planNumbers = [1, 2, 3];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
      <FileText className="h-4 w-4 text-gray-600" />
      <span className="text-sm text-gray-600 font-medium">プラン:</span>
      <div className="flex gap-1">
        {planNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onSelectPlan(num)}
            disabled={disabled}
            className={`
              px-3 py-1 text-sm font-bold rounded transition-all duration-200
              ${
                currentPlanNumber === num
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={`プラン${num}に切り替え`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
