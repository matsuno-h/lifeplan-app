import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
        label: '資産残高',
        data: data.map(d => d.balance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
