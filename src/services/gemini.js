import { createClient } from "@google/genai";

let client = null;

const initClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = createClient({ apiKey });
  }
  return client;
};

// 로컬 폴백 멘트 리스트
const FALLBACK_MENOTS = {
  unsmiling: [
    "무표정도 하나의 매력. 그냥 그런 사람도 있어.",
    "표정은 없어도, 인연은 어딘가 있겠지.",
    "긴장했나요? 괜찮아요, 누구나 그럴 수 있어.",
    "웃지 않아도 됩니다. 결과는 결과일 뿐."
  ],
  forcedSmile: [
    "애썼어요. 어색해도 노력하는 거 보여.",
    "억지 미소도 미소는 미소. 인정.",
    "카메라 앞이라 어색했죠? 다들 그래요.",
    "자연스러운 게 제일 좋지만, 이것도 나쁘지 않아."
  ],
  default: [
    "표정 분석이 어려웠지만, 결과는 나왔습니다.",
    "데이터가 부족했지만, 이 정도면 충분해요.",
    "오늘의 연애운, 이렇게 나왔습니다.",
    "스캔 완료. 결과를 확인하세요."
  ]
};

export const generateLoveResult = async (probability, faceData = null, harmonyScore = null) => {
  const aiClient = initClient();
  if (!aiClient) return "API 키 설정 필요";

  const smileState = faceData?.wasSmiling ? "가식적으로 웃으려 노력함" : "끝까지 무뚝뚝함 (웃음 거부)";
  const harmonyLine = harmonyScore !== null
    ? `- 얼굴 대칭/황금비 점수: ${harmonyScore.toFixed(1)}점 (100점 만점)`
    : '';

  const prompt = `
    너는 표정을 분석해 연애 확률을 판정하는 AI 스캐너다.
    [분석 데이터]
    - 연애 확률: ${probability}%
    - 태도: ${smileState}
    - 감지된 표정: ${faceData?.expression || "알 수 없음"}
    ${harmonyLine}

    [출력 규칙]
    - 반드시 '[확률]% | [멘트]' 형식으로만 출력.
    - 확률은 ${probability}% 기준 ±5% 범위 내 소수점 한 자리로 표현.
    - 멘트는 딱 1문장, 20자 이내로 정중하게.
    - 모델: gemini-2.5-flash 전용
  `;

  try {
    // 팀장님 지시에 따라 오직 gemini-2.5-flash만 사용
    const result = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const responseText = result.response.text();
    return responseText.trim();
  } catch (error) {
    console.warn("Gemini 2.5 Flash 호출 실패:", error.message);
    
    // 로컬 폴백으로 선회
    const category = faceData ? (faceData.wasSmiling ? 'forcedSmile' : 'unsmiling') : 'default';
    const pool = FALLBACK_MENOTS[category] || FALLBACK_MENOTS.default;
    const randomMent = pool[Math.floor(Math.random() * pool.length)];
    const randomPct = (Math.random() * 20 + 0.1).toFixed(1);

    return `${randomPct}% | ${randomMent}`;
  }
};
