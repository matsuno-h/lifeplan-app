interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showShareTab?: boolean;
}

const tabs = [
  { id: 'goals', label: '目標設定' },
  { id: 'basic', label: '基本設定' },
  { id: 'income-expense', label: '収支' },
  { id: 'details', label: '住宅・ローン' },
  { id: 'assets', label: '資産管理' },
  { id: 'insurance', label: '保険・年金' },
  { id: 'advice', label: '相談' },
  { id: 'share', label: '共有設定' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b border-gray-200 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
