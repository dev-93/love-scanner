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
    "표정 근육이 동면 중... 연애 성공 확률 측정 자체가 불가능한 수준.",
    "저 표정으로 썸 탈 생각이면, 상대방이 먼저 도망갑니다.",
    "극도의 무표정. 이건 연애 세포가 아예 없는 수준이예요.",
    "웃음 한 번 안 나오는 사람한테 연애 성공 확률이 있을 리가요."
  ],
  forcedSmile: [
    "그 억지 미소... 상대방도 다 느낍니다. 진정성 0점.",
    "가식 필터가 최고치를 기록했어요. 솔직함이 최고의 연애 전략인데.",
    "만들어낸 미소로는 진짜 인연을 만날 수 없어요.",
    "억지로 웃는 거 환히 보이는데, 연애에서도 그러면 금방 들켜요."
  ],
  default: [
    "오늘은 연애보다 혼자가 더 편할 것 같은 바이브네요.",
    "분석 결과, 오늘은 연애보다 치킨이 더 확실한 선택입니다.",
    "연애 세포가 약간 졸고 있는 상태. 내일 다시 도전해보세요.",
    "운명의 상대는 있지만, 오늘은 아닐 수도 있어요."
  ]
};

/**
 * @param {number} probability - 초기 랜덤 확률
 * @param {object} faceData - { expression, probability, landmarks, wasSmiling }
 */
export const generateLoveResult = async (probability, faceData = null) => {
  const ai = initAI();
  if (!ai) return "API 키 설정 필요";

  const modelQueue = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];

  let smileState = "관측 불가";
  if (faceData) {
    smileState = faceData.wasSmiling ? "스캔 중 미소를 보였음" : "스캔 내내 무표정 또는 웃지 않음";
  }

  const prompt = `
    [역할]
    너는 '오늘의 연애 확률'을 분석해주는 AI야.
    표정 데이터를 바탕으로 오늘 하루 연애 성공 확률을 측정하고, 짧고 킹받는 한마디를 날린다.
    
    [사용자 데이터]
    - 스캔 중 태도: ${smileState}
    - 실시간 표정: ${faceData?.expression || "알 수 없음"}
    
    [가이드라인]
    - 반드시 '[확률]% | [멘트]' 형식만 써.
    - 확률은 소수점 첫째 자리까지 (예: 12.3%, 0.5%, 87.4%)
    - 멘트는 1문장, 최대 30자 이내로 짧고 강렬하게.
    - 무표정이면 낮은 확률 + 아프게 찌르는 멘트.
    - 잘 웃었으면 높은 확률 + 약간 들뜨게 만드는 멘트.
    - 예시: 3.2% | 그 표정으로 썸 탈 생각이면 포기하세요.
    - 예시: 82.7% | 오늘 누군가 당신한테 먼저 연락 올 수도 있어요.
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
      continue;
    }
  }

  // 모든 모델이 실패했을 경우의 최종 로컬 폴백
  console.error("All Gemini models failed. Switching to local fallback.");
  const category = faceData ? (faceData.wasSmiling ? 'forcedSmile' : 'unsmiling') : 'default';
  const pool = FALLBACK_MENOTS[category] || FALLBACK_MENOTS.default;
  const randomMent = pool[Math.floor(Math.random() * pool.length)];
  const randomPct = (Math.random() * 30 + 5).toFixed(1);
  
  return `${randomPct}% | ${randomMent}`;
};






