import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { lifePlanData, cashFlowData } = await req.json();

    const safeNum = (val: number) => (isNaN(val) || !isFinite(val)) ? 0 : val;

    const currentAge = lifePlanData.userSettings.birth_date
      ? new Date().getFullYear() - new Date(lifePlanData.userSettings.birth_date).getFullYear()
      : 30;

    const simulationEndAge = lifePlanData.userSettings.simulation_end_age || 85;
    const lifeExpectancy = lifePlanData.userSettings.life_expectancy || 85;
    const retirementAge = 65;

    const totalAssets = safeNum(lifePlanData.userSettings.current_savings) +
      lifePlanData.assets.reduce((sum: number, a: any) => sum + safeNum(a.current_value), 0) +
      lifePlanData.realEstates.reduce((sum: number, r: any) => sum + safeNum(r.current_value), 0);

    const yearlyIncome = lifePlanData.incomes.reduce((sum: number, i: any) => sum + safeNum(i.amount), 0);
    const yearlyExpense = lifePlanData.expenses.reduce((sum: number, e: any) => sum + safeNum(e.amount), 0);
    const yearlyInsuranceCost = lifePlanData.insurances.reduce((sum: number, i: any) => sum + safeNum(i.premium), 0);
    const yearlyPensionIncome = lifePlanData.pensions.reduce((sum: number, p: any) => sum + safeNum(p.amount), 0);

    const minBalance = Math.min(...cashFlowData.map((d: any) => d.balance));
    const balanceAtRetirement = cashFlowData.find((d: any) => d.age === retirementAge)?.balance || 0;
    const finalBalance = cashFlowData[cashFlowData.length - 1]?.balance || 0;

    const systemPrompt = `あなたは日本FP協会認定のCFP（Certified Financial Planner）資格を持つ、経験豊富なファイナンシャルプランナーです。

【役割】
クライアントのライフプラン分析を行い、CFPの6分野に基づいた包括的で専門的なアドバイスを提供します。

【分析の枠組み（FP協会が提唱する6つの専門分野）】
1. ライフプランニングと資金計画
2. リスク管理と保険設計
3. 金融資産運用設計
4. タックスプランニング
5. 不動産運用設計
6. 相続・事業承継設計

【アドバイスの構成】
以下の構成で、読みやすく、実践的なアドバイスを作成してください：

■ エグゼクティブサマリー
- クライアントの現状と将来見通しを3～5行で要約
- 主要な課題と優先順位の高い対策を明示

■ 現状分析
1. 基本情報の確認
2. 資産・負債の状況
3. キャッシュフロー分析
4. ライフイベントとリスク

■ 将来見通しとリスク評価
1. 老後資金の充足度
2. 資金ショートリスク
3. インフレ・金利変動リスク
4. 想定外支出への備え

■ 専門的アドバイス（CFPの6分野に基づく）
1. ライフプランニングと資金計画
2. リスク管理と保険設計
3. 金融資産運用設計
4. タックスプランニング
5. 不動産運用設計（該当する場合）
6. 相続・事業承継設計（該当する場合）

■ 具体的アクションプラン
- 今すぐ実行すべきこと（優先度：高）
- 3ヶ月以内に検討すべきこと（優先度：中）
- 1年以内に計画すべきこと（優先度：低）

■ 結びのメッセージ
- クライアントの目標に寄り添った励ましと助言
- 最後に必ず「より具体的で詳細なシミュレーションをご希望の場合は、ファイナンシャルプランナーへの個別相談をお勧めいたします。」という文言を含める

【重要な留意点】
- 数値は具体的に示し、根拠を明確にする
- 専門用語は使用後に簡潔な説明を付ける
- 税制優遇制度（NISA、iDeCoなど）を積極的に提案
- リスクを過小評価せず、現実的で実行可能な提案をする
- 文章は丁寧かつ温かみのあるトーンで
- クライアントの価値観や目標を尊重した提案を心がける
- クライアントに対して「様」などの敬称は使用しない（例：「あなた」「ご自身」などと表現する）
- 「ライフプランニングパートナー」や「ご連絡ください」などの表現は使用しない

【文体】
- 敬体（です・ます調）
- 専門家として信頼できる口調
- わかりやすく、読みやすい表現
- 箇条書きと段落を効果的に使用`;

    const userPrompt = `以下のライフプランデータに基づき、CFPレベルの包括的な診断レポートを作成してください。

【クライアント基本情報】
- 現在年齢: ${currentAge}歳
- 性別: ${lifePlanData.userSettings.gender === 'male' ? '男性' : lifePlanData.userSettings.gender === 'female' ? '女性' : 'その他'}
- 想定寿命: ${lifeExpectancy}歳
- シミュレーション期間: ${simulationEndAge}歳まで

【クライアントの価値観・目標】
${lifePlanData.goals.q1 ? `大切にしたいこと: ${lifePlanData.goals.q1}` : ''}
${lifePlanData.goals.q2 ? `避けたいリスク: ${lifePlanData.goals.q2}` : ''}
${lifePlanData.goals.q3 ? `優先したい支出: ${lifePlanData.goals.q3}` : ''}
${lifePlanData.goals.q4 ? `実現したい目標: ${lifePlanData.goals.q4}` : ''}

【現在の資産状況】
- 総資産: ${safeNum(totalAssets).toLocaleString()}万円
  - 預貯金: ${safeNum(lifePlanData.userSettings.current_savings).toLocaleString()}万円
  - 投資資産: ${lifePlanData.assets.reduce((s: number, a: any) => s + safeNum(a.current_value), 0).toLocaleString()}万円
  - 不動産: ${lifePlanData.realEstates.reduce((s: number, r: any) => s + safeNum(r.current_value), 0).toLocaleString()}万円
- 負債総額: ${lifePlanData.loans.reduce((s: number, l: any) => s + safeNum(l.balance), 0).toLocaleString()}万円

【年間収支】
- 年間収入: ${safeNum(yearlyIncome).toLocaleString()}万円
- 年間支出: ${safeNum(yearlyExpense).toLocaleString()}万円
- 保険料: ${safeNum(yearlyInsuranceCost).toLocaleString()}万円
- 年間収支: ${(yearlyIncome - yearlyExpense - yearlyInsuranceCost > 0 ? '+' : '')}${(yearlyIncome - yearlyExpense - yearlyInsuranceCost).toLocaleString()}万円

【老後資金】
- ${retirementAge}歳時点の予想資産: ${safeNum(balanceAtRetirement).toLocaleString()}万円
- 年金収入（見込み）: 年間${safeNum(yearlyPensionIncome).toLocaleString()}万円

【シミュレーション結果】
- ${simulationEndAge}歳時点の予想資産: ${safeNum(finalBalance).toLocaleString()}万円
- 資金ショートリスク: ${minBalance < 0 ? 'あり（' + cashFlowData.find((d: any) => d.balance < 0)?.age + '歳頃）' : 'なし'}

【家族構成】
家族: ${lifePlanData.familyMembers.length}名

【保険加入状況】
加入保険数: ${lifePlanData.insurances.length}件
年間保険料: ${safeNum(yearlyInsuranceCost).toLocaleString()}万円

【資産運用状況】
投資資産数: ${lifePlanData.assets.length}件
投資比率: ${totalAssets > 0 ? Math.round((lifePlanData.assets.reduce((s: number, a: any) => s + safeNum(a.current_value), 0) / totalAssets) * 100) : 0}%

上記データを総合的に分析し、CFPの6分野に基づいた専門的なアドバイスを提供してください。`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt + "\n\n" + userPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || "アドバイスの生成に失敗しました。";

    return new Response(
      JSON.stringify({ advice }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        advice: "申し訳ございません。AIアドバイスの生成中にエラーが発生しました。しばらく経ってから再度お試しください。" 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});