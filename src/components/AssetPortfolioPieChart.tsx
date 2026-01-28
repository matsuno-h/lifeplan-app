import { useState, useMemo, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AppData } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetPortfolioPieChartProps {
  appData: AppData;
}

interface PortfolioData {
  labels: string[];
  values: number[];
  colors: string[];
}

const ASSET_TYPE_COLORS: { [key: string]: string } = {
  '投資信託': '#3b82f6',
  '国内株式': '#10b981',
  '海外株式': '#8b5cf6',
  '国内債券': '#f59e0b',
  '海外債券': '#ef4444',
  'REIT': '#06b6d4',
  '金・銀・プラチナ': '#eab308',
  'FX': '#ec4899',
  '仮想通貨': '#6366f1',
};

const SAVINGS_COLOR = '#22c55e';

export function AssetPortfolioPieChart({ appData }: AssetPortfolioPieChartProps) {
  const currentYear = new Date().getFullYear();
  const userBirthYear = appData.userSettings.birth_date
    ? new Date(appData.userSettings.birth_date).getFullYear()
    : currentYear - 30;
  const currentAge = currentYear - userBirthYear;
  const endAge = appData.userSettings.simulation_end_age || 85;

  const [selectedAge, setSelectedAge] = useState(currentAge);
  const selectedYear = currentYear + (selectedAge - currentAge);

  const calculatePortfolioAtAge = useCallback((age: number): PortfolioData => {
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    const yearsFromNow = age - currentAge;
    let cashBalance = appData.userSettings.current_savings || 0;
    const savingsInterestRate = (appData.userSettings.savings_interest_rate || 0) / 100;

    const assetTypeBalances: { [type: string]: number } = {};

    if (yearsFromNow === 0) {
      appData.assets.forEach((asset) => {
        if (asset.current_value > 0) {
          const assetType = asset.asset_type || '投資信託';
          assetTypeBalances[assetType] = (assetTypeBalances[assetType] || 0) + asset.current_value;
        }
      });
    } else {
      for (let i = 0; i < yearsFromNow; i++) {
        const ageAtCalc = currentAge + i;

        appData.assets.forEach((asset) => {
          const shouldContribute = !asset.withdrawal_age || ageAtCalc < asset.withdrawal_age;
          const belowEndAge = !asset.contribution_end_age || ageAtCalc <= asset.contribution_end_age;

          if (shouldContribute && belowEndAge && asset.yearly_contribution > 0) {
            cashBalance -= asset.yearly_contribution;
          }

          if (asset.withdrawal_age && ageAtCalc >= asset.withdrawal_age && asset.withdrawal_amount) {
            cashBalance += asset.withdrawal_amount;
          }
        });

        cashBalance = cashBalance * (1 + savingsInterestRate);
      }

      appData.assets.forEach((asset) => {
        let balance = asset.current_value;

        for (let i = 0; i < yearsFromNow; i++) {
          const ageAtCalc = currentAge + i;
          balance = balance * (1 + asset.return_rate / 100);

          const shouldContribute = !asset.withdrawal_age || ageAtCalc < asset.withdrawal_age;
          const belowEndAge = !asset.contribution_end_age || ageAtCalc <= asset.contribution_end_age;

          if (shouldContribute && belowEndAge && asset.yearly_contribution > 0) {
            balance += asset.yearly_contribution;
          }

          if (asset.withdrawal_age && ageAtCalc >= asset.withdrawal_age && asset.withdrawal_amount) {
            const withdrawal = Math.min(asset.withdrawal_amount, balance);
            balance -= withdrawal;
          }
        }

        if (balance > 0) {
          const assetType = asset.asset_type || '投資信託';
          assetTypeBalances[assetType] = (assetTypeBalances[assetType] || 0) + balance;
        }
      });
    }

    Object.entries(assetTypeBalances).forEach(([type, balance]) => {
      if (balance > 0) {
        labels.push(type);
        values.push(Math.round(balance));
        colors.push(ASSET_TYPE_COLORS[type] || '#94a3b8');
      }
    });

    if (cashBalance > 0) {
      labels.push('貯蓄');
      values.push(Math.round(cashBalance));
      colors.push(SAVINGS_COLOR);
    }

    return { labels, values, colors };
  }, [currentAge, appData.userSettings.current_savings, appData.userSettings.savings_interest_rate, appData.assets]);

  const portfolioData = useMemo(() => calculatePortfolioAtAge(selectedAge), [selectedAge, calculatePortfolioAtAge]);

  const totalValue = portfolioData.values.reduce((sum, val) => sum + val, 0);

  const chartData = {
    labels: portfolioData.labels.map((label, i) => {
      const percentage = totalValue > 0 ? ((portfolioData.values[i] / totalValue) * 100).toFixed(1) : '0.0';
      return `${label} (${percentage}%)`;
    }),
    datasets: [
      {
        data: portfolioData.values,
        backgroundColor: portfolioData.colors,
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = portfolioData.labels[context.dataIndex];
            const value = portfolioData.values[context.dataIndex];
            const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
            return `${label}: ${value.toLocaleString()}万円 (${percentage}%)`;
          },
        },
      },
    },
  };

  if (portfolioData.values.length === 0 || totalValue === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">
          金融資産ポートフォリオ
        </h2>
        <div className="text-center text-gray-500 py-8">
          資産データがありません
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">
        金融資産ポートフォリオ
      </h2>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            表示時点を選択
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="range"
                min={currentAge}
                max={endAge}
                value={selectedAge}
                onChange={(e) => setSelectedAge(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[200px]">
              <input
                type="number"
                min={currentAge}
                max={endAge}
                value={selectedAge}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= currentAge && value <= endAge) {
                    setSelectedAge(value);
                  }
                }}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-600">歳</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 font-medium">{selectedYear}年</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-800">
          総資産: <span className="text-blue-600">{totalValue.toLocaleString()}</span> 万円
        </div>
      </div>

      <div className="h-[400px]">
        <Pie data={chartData} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        {portfolioData.labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: portfolioData.colors[i] }}
            />
            <div>
              <div className="font-medium text-gray-700">{label}</div>
              <div className="text-gray-600">
                {portfolioData.values[i].toLocaleString()}万円
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
