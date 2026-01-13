import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvitationRequest {
  inviteeEmail: string;
  inviterName: string;
  planNumber: number;
  permission: 'view' | 'edit';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'メール送信サービスが設定されていません。管理者に連絡してください。',
          configured: false 
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { inviteeEmail, inviterName, planNumber, permission }: InvitationRequest = await req.json();

    const permissionText = permission === 'edit' ? '編集権限' : '閲覧権限';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f8f9fa;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              background: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .info-box {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 ライフプラン シミュレーター</h1>
              <p>プランへの招待</p>
            </div>
            
            <div class="content">
              <p>こんにちは、</p>
              
              <p><strong>${inviterName}</strong> さんがライフプランをあなたと共有しました。</p>
              
              <div class="info-box">
                <p><strong>📋 プラン番号:</strong> ${planNumber}</p>
                <p><strong>🔑 権限:</strong> ${permissionText}</p>
              </div>
              
              <p>このプランにアクセスするには、以下のボタンをクリックしてログインしてください：</p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('APP_URL') || 'http://localhost:5173'}" class="button">
                  プランを確認する
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                ※ アカウントをお持ちでない場合は、まず新規登録を行ってください。<br>
                登録したメールアドレス（${inviteeEmail}）でログインすると、共有されたプランにアクセスできます。
              </p>
            </div>
            
            <div class="footer">
              <p>このメールは自動送信されています。</p>
              <p>ライフプラン シミュレーター</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
${inviterName} さんがライフプランをあなたと共有しました。

プラン番号: ${planNumber}
権限: ${permissionText}

このプランにアクセスするには、以下のURLからログインしてください：
${Deno.env.get('APP_URL') || 'http://localhost:5173'}

アカウントをお持ちでない場合は、まず新規登録を行ってください。
登録したメールアドレス（${inviteeEmail}）でログインすると、共有されたプランにアクセスできます。

ライフプラン シミュレーター
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'ライフプランシミュレーター <onboarding@resend.dev>',
        to: [inviteeEmail],
        subject: `【ライフプランシミュレーター】${inviterName}さんがプランを共有しました`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);
      throw new Error(`メール送信に失敗しました: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '招待メールを送信しました',
        id: data.id 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'メールの送信中にエラーが発生しました',
        success: false 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});