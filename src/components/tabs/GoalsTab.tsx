import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { Goals } from '../../types';

interface GoalsTabProps {
  goals: Goals;
  onUpdate: (goals: Goals) => void;
}

export function GoalsTab({ goals, onUpdate }: GoalsTabProps) {
  const safeGoals = goals || { q1: '', q2: '', q3: '', q4: '' };

  const [formData, setFormData] = useState<Goals>(safeGoals);

  useEffect(() => {
    setFormData(safeGoals);
  }, [goals]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (field: keyof Goals, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
        <Target className="mr-2 h-5 w-5" />
        目標設定
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        あなたの人生の目標や理想のライフスタイルを自由に記入してください。<br />
        これらの情報は、より適切なアドバイスを行うために活用されます。
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Q1. 基本的なライフイベント
          </label>
          <textarea
            name="q1"
            value={formData.q1}
            onChange={(e) => handleChange('q1', e.target.value)}
            rows={5}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-sm"
            placeholder="記入例
住宅購入：3年後に4,500万円程度の戸建てを購入したい、定年時にリフォームしたい
教育方針：中学から私立に行かせたい、大学は実家から通ってほしい
買物予定：5年ごとに車を買い替えたい（予算300万円）、最新家電を揃えたい
働きかた：50歳でセミリタイアしたい、妻は末子が小学校に入ったらパートに出る"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Q2. 楽しみ・豊かさに関する目標
          </label>
          <textarea
            name="q2"
            value={formData.q2}
            onChange={(e) => handleChange('q2', e.target.value)}
            rows={5}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-sm"
            placeholder="記入例
毎年のレジャー：年に一度は家族で沖縄旅行に行きたい（予算30万円）
記念日の過ごし方：結婚10周年、20周年には豪華な海外旅行に行きたい
趣味：ゴルフを続けたい、年間10万円はスキルアップの資格取得に使いたい"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Q3. 老後・将来のイメージ
          </label>
          <textarea
            name="q3"
            value={formData.q3}
            onChange={(e) => handleChange('q3', e.target.value)}
            rows={5}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-sm"
            placeholder="記入例
理想の老後生活：質素でもいいから穏やかに暮らしたい、たまに孫にお小遣いをあげたい
何歳まで働きたいか：現役並みで60歳まで、その後は65歳まで週3で働きたい
遺したい資産：子供に自宅を遺したい、資産は使い切って死にたい"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Q4. 万が一への備え・優先順位
          </label>
          <textarea
            name="q4"
            value={formData.q4}
            onChange={(e) => handleChange('q4', e.target.value)}
            rows={5}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-sm"
            placeholder="記入例
最も優先したいこと：今の生活水準は落としたくない、子供の教育費だけは聖域にしたい
不安に感じていること：今の投資ペースで老後足りるか不安、インフレに耐えられるか知りたい"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 text-sm"
        >
          目標を保存
        </button>
      </form>
    </div>
  );
}
