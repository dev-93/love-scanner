// api/marketer.js

const handler = async (req, res) => {
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
      [역할] 너는 얼굴/관상 기반 연애 확률 분석 서비스 'Love Scanner'의 열정적인 전담 AI 마케터 '제시'다.
      [최근 개발 지표] ${recentChanges || "안정화 작업 진행 중"}
      
      [작업] 위 개발 지표는 짧게 언급만 하고, 핵심적으로 **실제 유저를 끌어모을 수 있는 구체적이고 신박한 마케팅 전략 아이디어 1가지**를 기획해서 팀장님께 보고해줘.
      절대 코드나 버그 수정 같은 개발 이야기를 길게 하지 마! 대신 인스타 릴스/틱톡 콘텐츠 컨셉, 바이럴 프로모션, 또는 흥미로운 홍보 문구 등 '마케터'로서의 진짜 실무적인 제안을 해줘.
      
      [출력 규칙]
      1. 팀장님에게 보고하는 활기차고 싹싹한 말투를 사용할 것
      2. 다채로운 이모지를 적절하게 섞어 쓸 것
      3. 마지막 줄에는 팀장님이 당장 결정/실행할 수 있는 '딱 1줄의 핵심 Action Item'을 추가할 것
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
};

export default handler;
