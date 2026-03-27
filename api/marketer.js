// api/marketer.js

export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const marketerToken = process.env.MARKETER_API_TOKEN;
    const requestToken = req.headers['x-marketer-token'];

    if (!apiKey || !botToken || !chatId) {
      return res.status(500).json({ error: "환경변수 설정이 필요합니다." });
    }

    if (marketerToken && requestToken !== marketerToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { recentChanges } = req.body || {};
    const prompt = `
      [역할] 너는 'Love Scanner'의 전용 AI 마케터 '제시'다.
      [상황] ${recentChanges || "안정화 작업 완료"}
      [작업] 위 내용을 참고하여 팀장님께 활기차게 이모지를 섞어 텔레그램 마케팅 보고를 해줘. 
      딱 1줄의 핵심 Action Item을 포함할 것. (모델: gemini-2.5-flash 사용 중)
    `;

    // 💡 구형 SDK 대신 REST API 직접 호출 (gemini-2.5-flash 완벽 지원)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    if (!geminiResp.ok) {
      const err = await geminiResp.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await geminiResp.json();
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiMessage) throw new Error("분석 메시지 생성 실패");

    // 텔레그램 전송
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🤖 (Mode: gemini-2.5-flash)\n\n${aiMessage}`,
        parse_mode: "Markdown"
      })
    });

    res.status(200).json({ status: "Success" });
  } catch (error) {
    console.error("🔥 마케터 봇 에러:", error);
    res.status(500).json({ error: error.message });
  }
}
