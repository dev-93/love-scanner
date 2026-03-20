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
      // 제미나이가 표정을 더 인간적으로 이해하도록 변환
      const moodMap = {
        happy: "세상을 다 가진 듯한 가식적인 웃음",
        neutral: "영혼 가출한 멍때리는 표정",
        sad: "연애 세포가 전멸한 듯한 슬픈 눈빛",
        angry: "솔로 탈출 못해서 화가 잔뜩 난 상태",
        surprised: "누가 고백이라도 한 줄 알고 놀란 상태",
        fearful: "거울 보고 본인 연애운에 경악한 상태",
        disgusted: "소개팅 앱 광고 보고 정색하는 상태"
      };
      const moodDesc = moodMap[faceData.expression] || "설명하기 힘든 오묘한 표정";
      analysisContext = `사용자의 현재 표정 분위기: ${moodDesc}. (참고: 특징점 ${faceData.landmarks}개 추출됨)`;
    } else {
      analysisContext = "카메라에 얼굴이 제대로 안 보여서 대충 짐작해야 함.";
    }

    const prompt = `
      [연애 스캐너 분석 요청]
      데이터: ${analysisContext}
      
      이 정보를 바탕으로 연애 확률(0~100.0%)과 분석 멘트를 생성해줘.
      
      ⚠️ 제약 조건:
      1. **기술적인 수치 언급 금지**: "98%의 확신으로", "특징점 몇 개" 같은 딱딱한 데이터 용어는 절대 쓰지 마세요.
      2. **창의적인 팩폭**: 사용자의 표정(예: ${analysisContext})을 보고 느낀 '바이브(vibe)'를 아주 킹받고 재치 있게 1문장으로 표현하세요.
      3. **확률의 구체성**: 확률은 소수점 첫째 자리까지 아주 정밀하게 표현하세요. (예: 13.7%, 88.2% 등)
      4. **형식 엄수**: 반드시 '[확률]% | [멘트]' 형식을 지키고 그 외의 잡담은 금지합니다.
      5. **욕설 절대 금지**: 킹받지만 선은 넘지 않는 유머를 발휘하세요.
    `;

    const result = await model.generateContent(prompt);

    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `${probability}% | 오늘은 AI도 부끄러워서 말을 아끼는 군요. (분석 일시 중단)`;
  }
};



