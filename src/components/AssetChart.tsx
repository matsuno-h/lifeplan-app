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
  Filler,
  ChartData,
  ChartOptions
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

  const chartData: ChartData<'bar' | 'line'> = {
    labels: data.map(d => `${d.age}歳`),
    datasets: [
      {
        type: 'line' as const,
        label: '総資産残高',
        data: data.map(d => d.balance),
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
        order: 1, // Draw on top
      },
      {
        type: 'bar' as const,
        label: '年間貯蓄額',
        data: data.map(d => d.yearlySavings),
        backgroundColor: 'rgba(16, 185, 129, 0.6)', // Emerald Green
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        order: 2, // Draw behind
      }
    ]
  };

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
          text: '金額（万円）'
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
        },
        grid: {
          display: false
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
