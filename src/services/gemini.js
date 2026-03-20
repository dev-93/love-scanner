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

/**
 * @param {number} probability - 초기 랜덤 확률
 * @param {object} faceData - 로컬에서 분석된 얼굴 데이터 { expression, probability, landmarks }
 */
export const generateLoveResult = async (probability, faceData = null) => {
  const ai = initAI();
  if (!ai) {
    return "API 키 설정 필요 (VITE_GEMINI_API_KEY)";
  }

  try {
    // 사용자가 지정한 gemini-2.5-flash 모델 사용
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });
    
    let analysisContext = "";
    if (faceData) {
      analysisContext = `로컬 얼굴 인식 결과: 표정('${faceData.expression}'), 표정 확신도(${faceData.probability}%), 특징점(${faceData.landmarks}개 감지).`;
    } else {
      analysisContext = "얼굴을 감지하지 못했습니다.";
    }

    const prompt = `
      현재 사용자의 연애운 관상 분석 데이터: ${analysisContext}
      이 정보를 바탕으로 오늘 연애 확률(0~100%)과 킹받는 분석 멘트 1문장을 생성해줘.
      
      조건:
      1. 반드시 '[확률]% | [멘트]' 형식을 지켜줘. (예: 12% | 관상에 연애 세포가 하나도 안 보임)
      2. '킹받는' 유머 컨셉을 유지할 것.
      3. 얼굴 데이터가 'happy'라면 비꼬는 칭찬을, 'neutral'이나 'sad'라면 팩폭을 날려줘.
      4. 결과만 바로 출력해.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `${probability}% | 연애 세포가 킹받아서 분석 거부 중 (Error: ${error.message.substring(0, 20)})`;
  }
};


