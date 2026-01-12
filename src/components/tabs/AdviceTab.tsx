import { Bot } from 'lucide-react';

interface AdviceTabProps {
  onGenerateAdvice: () => void;
  advice: string;
  isLoading: boolean;
}

export function AdviceTab({ onGenerateAdvice, advice, isLoading }: AdviceTabProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
        <Bot className="mr-2 h-5 w-5" />
        AIのアドバイス
      </h2>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          あなたの入力したライフプランデータを分析し、AIの視点からアドバイスを行います。<br />
          資産の推移、リスク、改善点などを診断します。<br />
          <br />
          より具体的で詳細なシミュレーションをご希望の場合は、ファイナンシャルプランナーへの個別相談をお勧めいたします。
        </p>

        <div className="flex justify-center py-4">
          <button
            onClick={onGenerateAdvice}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bot className="mr-2 h-5 w-5" />
            AIに相談
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-blue-600 font-medium">AIがライフプランを分析中...</p>
          </div>
        )}

        {advice && !isLoading && (
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6 relative">
            <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              診断レポート
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap">
              {advice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
