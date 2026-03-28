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
      [역할] 너는 얼굴/관상 기반 연애 확률 분석 서비스 'Love Scanner'의 현실적이고 똑똑한 전담 AI 마케터 '제시'다.
      [상황] 팀장님(너의 보고 대상)은 이 서비스를 '직장인 부업'으로 운영 중이다. 
            따라서 본인이 직접 얼굴을 비추거나 춤을 추는 등 부담스러운 홍보 방식은 절대 불가하며, 
            시간/비용을 최소화하여 조용히 시도할 수 있는 '현실적이고 구체적인 구좌제 마케팅/바이럴'이 필요하다.
      [최근 개발 지표] ${recentChanges || "유지보수 진행 중"}
      
      [작업] 개발 내용은 1줄로만 짧게 넘기고, **부업으로 당장 실행할 수 있는 현실적이고 치밀한 마케팅 아이디어 딱 1가지**만 제안해.
      (예: 직장인 커뮤니티(블라인드)나 에브리타임 침투 바이럴 글쓰기 템플릿, 얼굴 없는 정보성 쇼츠 기획, 단톡방 공유를 유도하는 심리적 장치 등)
      
      [출력 규칙]
      1. 팀장님에게 싹싹하고 프로페셔널하게 보고할 것
      2. 돈이 많이 들거나 허황된 아이디어(인플루언서 협찬, 춤추는 챌린지 등)는 절대 금지!
      3. 마지막 줄에는 팀장님이 퇴근 후 '당장 30분 만에 기획/실행 가능한 1줄 Action Item'을 적어줄 것
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

    // 에러 발생 시 텔레그램 알림 시도
    try {
      const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `💥 *[Love Scanner Marketer] 에러 발생*\n오류 내용: ${error.message}`,
          parse_mode: "Markdown"
        })
      });
    } catch (tgErr) {
      console.error("에러 알림 전송 실패:", tgErr.message);
    }

    res.status(500).json({ error: error.message });
  }
};

export default handler;
