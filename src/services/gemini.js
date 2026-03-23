import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

let genAI = null;

const initAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
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

/**
 * @param {number} probability - 초기 랜덤 확률
 * @param {object} faceData - { expression, probability, landmarks, wasSmiling }
 */
export const generateLoveResult = async (probability, faceData = null, harmonyScore = null) => {
  const ai = initAI();
  if (!ai) return "API 키 설정 필요";

  const modelQueue = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];

  let smileState = "관측 불가";
  if (faceData) {
    smileState = faceData.wasSmiling ? "가식적으로 웃으려 노력함" : "끝까지 무뚝뚝함 (웃음 거부)";
  }

  const harmonyLine = harmonyScore !== null
    ? `- 얼굴 대칭/황금비 점수: ${harmonyScore.toFixed(1)}점 (100점 만점)`
    : '';

  const prompt = `
    [역할]
    너는 표정과 바이브를 분석해 연애 확률을 판정하는 AI 스캐너다.
    결과는 짧고 담백하게, 과도한 해석 없이 전달한다.

    [분석 데이터]
    - 연애 확률: ${probability}%
    - 스캔 중 표정 태도: ${smileState}
    - 감지된 표정: ${faceData?.expression || "알 수 없음"}
    ${harmonyLine}

    [출력 규칙]
    - 반드시 '[확률]% | [멘트]' 형식으로만 출력.
    - 확률은 ${probability}% 기준 ±5% 범위 내 소수점 한 자리로 표현.
    - 멘트는 딱 1문장, 20자 이내로 간결하게.
    - 판정은 중립적으로. 비난하거나 과하게 칭찬하지 않는다.
    - 예: 34.7% | 표정에서 여유가 느껴집니다.
  `;



  // 모델 큐를 순회하며 성공할 때까지 시도
  for (const modelName of modelQueue) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.warn(`${modelName} failed:`, error.status || error.message);
      // 429(할당량 초과) 또는 모델 없음 에러 시 다음 모델 시도
      continue;
    }
  }

  // 모든 모델이 실패했을 경우의 최종 로컬 폴백
  console.error("All Gemini models failed. Switching to local fallback.");
  const category = faceData ? (faceData.wasSmiling ? 'forcedSmile' : 'unsmiling') : 'default';
  const pool = FALLBACK_MENOTS[category] || FALLBACK_MENOTS.default;
  const randomMent = pool[Math.floor(Math.random() * pool.length)];
  const randomPct = (Math.random() * 20 + 0.1).toFixed(1); // 폴백 시 더 낮은 확률

  return `${randomPct}% | ${randomMent}`;
};





