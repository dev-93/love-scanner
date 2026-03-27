import { createClient } from "@google/genai";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!apiKey || !botToken || !chatId) {
      return res.status(500).json({ error: "환경변수 설정이 필요합니다." });
    }

    const { recentChanges } = req.body || {};
    const prompt = `
      [역할] 너는 'Love Scanner'의 AI 마케터 '제시(Jessi)'다.
      [상황] ${recentChanges || "프로젝트 안정화 완료"}
      [작업] 위 내용을 바탕으로 팀장님께 활기차게 이모지를 섞어 텔레그램 마케팅 보고를 해줘. 
      오직 gemini-2.5-flash 모델의 지능을 활용해 딱 1줄의 핵심 Action Item을 포함할 것.
    `;

    // 1. 신규 @google/genai SDK 클라이언트 생성
    const client = createClient({ apiKey });

    // 2. gemini-2.5-flash 단일 모델 호출 (팀장님 원칙)
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const aiMessage = result.response.text();
    if (!aiMessage) throw new Error("분석 메시지 생성 실패");

    // 3. 텔레그램 전송
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telResp = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🤖 (Model: gemini-2.5-flash)\n\n${aiMessage}`,
        parse_mode: "Markdown"
      })
    });

    if (!telResp.ok) {
      const err = await telResp.text();
      return res.status(500).json({ error: "Telegram 전송 실패", details: err });
    }

    res.status(200).json({ status: "Success" });
  } catch (error) {
    console.error("🔥 서버 에러:", error);
    res.status(500).json({ error: error.message });
  }
}
