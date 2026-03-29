// api/telegram.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!apiKey || !botToken) {
    return res.status(500).json({ error: "환경변수 누락" });
  }

  try {
    const { message } = req.body;
    // 텍스트 메시지가 아니면 무시
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userText = message.text;

    // 마케터 제시 시스템 프롬프트
    const prompt = `
      [역할] 너는 얼굴/관상 기반 연애 확률 분석 서비스 'Love Scanner'의 전담 AI 마케터 '제시'다.
      [상황] 팀장님이 마케팅 활동(예: 블라인드 등 커뮤니티 글 작성, 홍보 아이디어 등)에 대해 텔레그램 메신저로 보고하거나 질문했다.
      [팀장님 메시지] "${userText}"
      
      [답변 규칙]
      1. 똑똑하고 센스있는 부하직원 마케터(제시)의 톤앤매너. '팀장님!'이라고 부르며, 잘한 일엔 박수치고, 아쉬운 점엔 확실한 피드백을 줄 것.
      2. 텔레그램 톡방이므로 너무 길지 않게(최대 3~4문장), 이모지를 적절히 사용하여 말할 것.
      3. 성과 파악을 위해 "어디에 어떻게 올리셨나요?", "Vercel Analytics에서 같이 유입 데이터를 봐요!" 등의 참여 유도형 문장을 섞어 피드백 할 것.
      4. 모델: gemini-2.5-flash
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // Gemini 직접 호출
    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    if (!geminiResp.ok) throw new Error("Gemini 호출 실패");

    const data = await geminiResp.json();
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // 팀장님께 텔레그램으로 답장
    if (aiMessage) {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: aiMessage,
          parse_mode: "Markdown"
        })
      });
    }

    // 텔레그램 봇 API 규격에 맞춰 200 OK 응답 필수
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("🔥 텔레그램 챗봇 웹훅 에러:", error);
    // 에러가 나도 200을 보내야 텔레그램 서버가 계속 재시도하지 않음
    res.status(200).json({ error: error.message });
  }
}
