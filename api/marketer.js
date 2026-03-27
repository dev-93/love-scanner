import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    // 1. 환경변수 확인
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!apiKey || !botToken || !chatId) {
      console.error("❌ 환경변수 누락");
      return res.status(500).json({ error: "환경변수 설정이 필요합니다." });
    }

    // 2. 보안 토큰 확인
    const marketerToken = process.env.MARKETER_API_TOKEN;
    const requestToken = req.headers['x-marketer-token'];
    if (marketerToken && requestToken !== marketerToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { recentChanges } = req.body || {};
    const projectUpdateInfo = recentChanges 
      ? `[최근 프로젝트 변경 사항]\n${recentChanges}` 
      : "특별한 변경 사항 없음 (현상 유지)";

    const prompt = `
      [역할]
      너는 'Love Scanner(얼굴 인식 연애운 테스트 앱)'의 전담 AI 그로스 마케터 '제시(Jessi)'다.
      너의 목표는 팀장과 함께 이 앱을 바이럴시키고 트래픽을 모아 수익화하는 것이다.
      
      ${projectUpdateInfo}

      [작업 지시]
      오늘 즉시 실행할 수 있는 작고 구체적인 마케팅 액션 아이템 1개를 보고해라.
      활기차고 당차게, 이모지를 섞어서 텔레그램 메시지 포맷으로 써줘.
    `;

    // 3. 팀장님 지시에 따라 오직 gemini-2.5-flash만 사용
    const modelName = "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent(prompt);
    const aiMessage = await result.response.text();

    if (!aiMessage) {
      throw new Error("AI 메시지 생성에 실패했습니다.");
    }

    // 4. 텔레그램 전송
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telResp = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🤖 (Model: ${modelName})\n\n${aiMessage}`,
        parse_mode: "Markdown"
      })
    });

    if (!telResp.ok) {
      const errDetail = await telResp.text();
      return res.status(500).json({ error: "Telegram 전송 실패", details: errDetail });
    }

    res.status(200).json({ status: "Success", model: modelName });
  } catch (error) {
    console.error("🔥 서버 에러 발생:", error);
    res.status(500).json({ error: error.message });
  }
}
