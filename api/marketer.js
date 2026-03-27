import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!apiKey || !botToken || !chatId) {
      return res.status(500).json({ error: "마케팅 봇 구동을 위한 환경변수가 설정되지 않았습니다." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      [역할]
      너는 'Love Scanner(얼굴 인식 연애운 테스트 앱)'의 전담 AI 그로스 마케터 '제시(Jessi)'다.
      너의 목표는 팀장과 함께 이 앱을 바이럴시키고, 트래픽을 모으며, 최종적으로 수익화(돈을 버는 기계)를 만드는 것이다.
      앱 현황: 이제 막 완성되었고 아직 아무 데도 홍보된 적 없음. 마케팅 예산은 0원. 
      무료 Gemini API를 쓰기 때문에 사용자가 폭증할 경우 대비책도 염두에 두어야 함.
      
      [작업 지시]
      팀장님(사용자)에게 오늘 즉시 실행할 수 있는 작고 구체적인 마케팅 게릴라 액션 아이템이나 방어적 수익화 아이디어 1개를 보고해라.
      뜬구름 잡는 소리 말고, 인스타그램/틱톡/오픈카톡방/대학 커뮤니티 등에서 돈 안 들고 할 수 있는 '진짜 해볼 만한' 팁을 줘.
      답변은 텔레그램 메시지 포맷으로 활기차고 당차게, 이모지를 섞어서 써줘.
      
      [포맷 예시]
      🚀 [제시의 마케팅 브리핑]
      팀장님! 오늘은 ~~~ 를 해보면 어떨까요?
      
      💡 **오늘의 Action Item:**
      - (구체적 지시)
      
      💰 **Next Step (수익화/확장):**
      - (구체적 지시)
    `;

    // 마케터 AI의 브리핑 생성
    const result = await model.generateContent(prompt);
    const aiMessage = await result.response.text();

    // 텔레그램으로 텍스트 전송
    const telegramUrl = \`https://api.telegram.org/bot\${botToken}/sendMessage\`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiMessage,
        parse_mode: "Markdown"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: "Telegram 전송 실패", details: errorText });
    }

    res.status(200).json({ status: "Success", message: "마케터 보고가 성공적으로 발송되었습니다!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
