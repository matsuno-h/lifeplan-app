import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { CashFlowData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AssetChartProps {
  data: CashFlowData[];
}

export function AssetChart({ data }: AssetChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
        <p className="text-gray-500">
          基本設定を入力してデータを蓄積してください
        </p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => `${d.age}歳`),
    datasets: [
      {
        type: 'line' as const,
        label: '資産残高',
        data: data.map(d => d.balance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: '年間収支',
        data: data.map(d => d.income - d.expense),
        backgroundColor: data.map(d => {
          const balance = d.income - d.expense;
          return balance >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        }),
        borderColor: data.map(d => {
          const balance = d.income - d.expense;
          return balance >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
        }),
        borderWidth: 1,
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString() + '万円';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + '万';
          }
        },
        title: {
          display: true,
          text: '資産残高（万円）'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + '万';
          }
        },
        title: {
          display: true,
          text: '年間収支（万円）'
        }
      },
      x: {
        title: {
          display: true,
          text: '年齢'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  return (
    <div className="relative" style={{ height: '400px', width: '100%' }}>
      <Chart type='bar' data={chartData} options={options} />
    </div>
  );
}
