import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// '킹받는' 컨셉의 프롬프트 전용
export const generateLoveResult = async (probability) => {
  if (!genAI) {
    return "API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 추가해 주세요.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      사용자의 오늘 연애 확률이 ${probability}%로 분석되었습니다.
      
      다음 조건에 맞는 결과 메시지를 한국어로 1문장만 출력해 주세요:
      1. '킹받는(약간 얄미우면서도 웃긴)' 유머 컨셉을 유지할 것.
      2. 0~20%, 21~50%, 51~80%, 81~100% 구간별로 감정이 다르게 표현될 것.
         - 낮은 확률: 팩폭(사실 폭격)이나 절망적인 상황을 위트 있게 표현
         - 중간 확률: 희망 고문이나 어설픈 조언
         - 높은 확률: 근거 없는 자신감이나 '오늘이 그날'이라는 칭찬
      3. 결과만 바로 출력하고 다른 설명은 생략할 것. (예: "오늘 안 되면 평생 안 된다는 뜻임")
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "연애 세포가 너무 킹받아서 분석에 실패했습니다.";
  }
};
