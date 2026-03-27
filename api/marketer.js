import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    // 1. 환경변수 확인 (VITE_ 접두사가 있든 없든 둘 다 체크)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!apiKey || !botToken || !chatId) {
      console.error("❌ 환경변수 누락");
      return res.status(500).json({ error: "환경변수 설정(GEMINI_API_KEY, TELEGRAM_...)이 필요합니다." });
    }

    // 2. 보안 토큰 확인
    const marketerToken = process.env.MARKETER_API_TOKEN;
    const requestToken = req.headers['x-marketer-token'];
    if (marketerToken && requestToken !== marketerToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 3. 모델 큐 설정 (프론트와 동일하게 구성하여 생존율 극대화)
    const modelQueue = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    const genAI = new GoogleGenerativeAI(apiKey);

    const { recentChanges } = req.body || {};
    const prompt = `
      [역할] 너는 'Love Scanner'의 AI 마케터 '제시'다.
      [상황] ${recentChanges || "기능 최적화 및 안정성 작업 완료"}
      [작업] 위 내용을 바탕으로 팀장님께 활기차게 이모지를 섞어 텔레그램 마케팅 보고를 해줘. 
      딱 1줄의 핵심 Action Item을 포함할 것.
    `;

    let aiMessage = "";
    let successModel = "";

    // 모델 큐 순회
    for (const modelName of modelQueue) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        aiMessage = await result.response.text();
        successModel = modelName;
        if (aiMessage) break;
      } catch (err) {
        console.warn(`${modelName} 시도 실패:`, err.message);
        continue;
      }
    }

    if (!aiMessage) {
      throw new Error("모든 Gemini 모델 호출에 실패했습니다.");
    }

    // 4. 텔레그램 전송 (최신 Node의 fetch 사용)
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telResp = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🤖 (Model: ${successModel})\n\n${aiMessage}`,
        parse_mode: "Markdown"
      })
    });

    if (!telResp.ok) {
      const errDetail = await telResp.text();
      return res.status(500).json({ error: "Telegram 전송 실패", details: errDetail });
    }

    res.status(200).json({ status: "Success", model: successModel });
  } catch (error) {
    console.error("🔥 서버 에러 발생:", error);
    res.status(500).json({ error: error.message });
  }
}
