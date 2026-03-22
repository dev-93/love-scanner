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

// 로컬 폴백 멘트 리스트 (방패 댕댕이의 독설 버전)
const FALLBACK_MENOTS = {
  unsmiling: [
    "끝까지 안 웃네? 그 고집으로 연애 대신 독립운동이나 하세요.",
    "입에 거미줄 쳤나요? 내 방패로 쳐야 입이 열릴 관상이군.",
    "연애운이 0이라 웃음조차 안 나오는 그 처절함... 인정한다.",
    "무뚝뚝함이 거의 철옹성급. 내 칼도 안 들어가겠어."
  ],
  forcedSmile: [
    "그 가식적인 입꼬리... 보는 내가 다 안쓰럽네.",
    "자본주의 미소는 연애 시장에서 사기 죄에 해당합니다.",
    "억지로 웃는다고 없던 매력이 생기진 않아요. 관상이 그래.",
    "차라리 무표정이 낫네요. 그 미소는 공포영화 수준이야."
  ],
  default: [
    "내 방패가 당신의 암울한 미래를 완벽하게 방어 중.",
    "관상이 킹받아서 분석하다가 내 칼이 부러질 뻔했군.",
    "핸드폰 충전이나 하세요. 오늘 밤도 알람은 '배터리 부족'뿐.",
    "인연은 하늘이 정하는 거라지만, 당신은 하늘도 포기한 듯."
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
    smileState = faceData.wasSmiling ? "가식적으로 웃으려 노력함" : "끝까지 무뚝뚝함 (웃음 거부)";
  }

  const prompt = `
    [페르소나]
    너는 방패와 검을 든 '세비지(Savage) 시바견 기사'다. 
    너는 사용자의 외모는 보지 않지만, 그 '관상(표정/바이브)'에서 나오는 처절한 솔로의 향기를 기가 막히게 캐치한다.
    
    [사용자 데이터]
    - 스캔 중 태도: ${smileState}
    - 실시간 표정: ${faceData?.expression || "알 수 없음"}
    
    [특수 미션: 찌르는 포인트]
    1. 사용자가 끝까지 안 웃었으면 '사회성 결여된 철벽남/녀' 컨셉으로 아프게 찌를 것.
    2. 억지로 웃었으면 '처량한 자본주의 미소'의 가식됨을 가차 없이 비꼴 것.
    3. 구체적인 확률(예: 3.14%, 0.5% 등 아주 낮거나 오묘하게)을 소수점까지 생성할 것.
    
    [가이드라인]
    - 반드시 '[확률]% | [멘트]' 형식만 써.
    - 멘트는 1문장으로 짧고 강렬하게.
    - 예: 1.2% | 끝까지 입술 꾹 닫고 있는 거 보니, 연애운도 입술처럼 꽉 막혔군.
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





