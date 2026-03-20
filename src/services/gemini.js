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

// 로컬 폴백 멘트 리스트 (API 할당량 초과 시 사용)
const FALLBACK_MENOTS = {
  happy: [
    "가식적인 저 자본주의 웃음... 연애운 0.1% 상승",
    "입꼬리는 웃고 있지만 눈은 슬픔에 젖어 있군요.",
    "억지로 웃는다고 없던 인연이 생기진 않습니다.",
    "그 웃음, 소개팅에서 쓰면 바로 차단각입니다."
  ],
  neutral: [
    "영혼 없는 표정... 거울 보고 연습 좀 더 하세요.",
    "관상에 연애 세포가 단 한 마리도 보이지 않음.",
    "그냥 무난해서 존재감도 무난한 상태.",
    "표정만 보면 이미 결혼 50년 차 권태기 같음."
  ],
  sad: [
    "슬퍼 보인다고 누가 연애해 줄 것 같나요?",
    "눈물 흘려도 당신의 연애운은 마른 장마 상태.",
    "표정에서 솔로 30년의 세월이 느껴짐.",
    "우울한 관상이네요... 집에서 혼자 치킨이나 드세요."
  ],
  default: [
    "분석 결과: 님은 그냥 평생 제미나이랑 노세요.",
    "연애세포 전멸. 핸드폰 충전이나 하세요.",
    "관상이 좀 킹받네요. 업데이트 추천.",
    "기적이 일어나지 않는 이상 무리입니다."
  ]
};

/**
 * @param {number} probability - 초기 랜덤 확률
 * @param {object} faceData - 로컬에서 분석된 얼굴 데이터 { expression, probability, landmarks }
 */
export const generateLoveResult = async (probability, faceData = null) => {
  const ai = initAI();
  if (!ai) return "API 키 설정 필요";

  // 시도할 모델 우선순위 리스트 (할당량 초과 시 자동 리트라이)
  const modelQueue = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ];

  let moodDesc = "알 수 없는 오묘한 상태";
  if (faceData) {
    const moodMap = { 
      happy: "가식적인 자본주의 미소", 
      neutral: "영혼 가출한 무표정", 
      sad: "연애 세포 사망한 눈빛", 
      angry: "솔로라 화난 상태",
      surprised: "놀란 토끼 눈"
    };
    moodDesc = moodMap[faceData.expression] || faceData.expression;
  }

  const prompt = `
    데이터: 사용자 현재 바이브는 '${moodDesc}'임.
    1. 0~100.0% 사이의 구체적인 연애 확률 생성.
    2. 기술 용어(확신도, 특징점 등) 언급 금지.
    3. 아주 킹받고 위트 있는 분석 멘트 1문장 생성.
    4. '[확률]% | [멘트]' 형식 엄수.
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
  const category = (faceData && FALLBACK_MENOTS[faceData.expression]) ? faceData.expression : 'default';
  const pool = FALLBACK_MENOTS[category];
  const randomMent = pool[Math.floor(Math.random() * pool.length)];
  const randomPct = (Math.random() * 30 + 5).toFixed(1);
  
  return `${randomPct}% | [로컬 분석] ${randomMent}`;
};





