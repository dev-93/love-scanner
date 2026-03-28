// src/services/gemini.js

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "API 키 설정 필요";

  const smileState = faceData?.wasSmiling ? "가식적으로 웃으려 노력함" : "끝까지 무뚝뚝함 (웃음 거부)";
  const harmonyLine = harmonyScore !== null
    ? `- 얼굴 대칭/황금비 점수: ${harmonyScore.toFixed(1)}점 (100점 만점)`
    : '';

  const prompt = `
    너는 관상(Physiognomy)과 표정을 분석해 연애 확률과 스타일을 판정하는 AI 전문가다.
    [분석 데이터]
    - 기본 연애 확률: ${probability}%
    - 태도: ${smileState}
    - 감제된 표정: ${faceData?.expression || "알 수 없음"}
    - 성별: ${faceData?.gender === 'male' ? '남성' : '여성'} (${Math.round(faceData?.genderProbability * 100)}% 확신)
    - 추정 나이: ${faceData?.age || "알 수 없음"}세
    - 얼굴 구조 데이터: 68개의 랜드마크 좌표 기반 (턱선, 이목구비 비율 분석 포함)
    ${harmonyLine}

    [출력 규칙]
    - 반드시 '[확률]% | [나의 스타일] | [어울리는 상대] | [관상 총평]' 형식으로만 출력하라.
    - 확률: ${probability}% 기준 ±3% 범위 내.
    - 나의 스타일: 4-5자 (예: '냉철한 도시남', '상상력 풍부한 예술가')
    - 어울리는 상대: 4-5자 (예: '햇살 같은 댕댕이', '차분한 지성인')
    - 관상 총평: 얼굴 구조(턱선, 이마, 눈매 등)를 기반으로 한 관상 분석을 제공하되, 사용자가 살짝 '킹받을(Teasing)' 수 있도록 위트 있고 뼈 때리는 농담을 섞어 출력하라. (예: '그 눈빛은 연애보다 혼자 거울 보는 시간이 더 많을 상', '턱선이 날카로운 걸 보니 연애할 때도 고집 좀 부리겠군요'). 
    - 주의: 욕설이나 도가 넘는 비하는 절대 금지. 전문적인 관상학 용어(예: 하정, 중정, 복덕궁 등)를 섞어쓰면 더 킹받고 전문적이다. 딱 1문장, 45자 이내로 작성.
    - 모델: gemini-2.5-flash
  `;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return responseText.trim() || `${probability}% | 지적인 분석가 | 따뜻한 포용주의자 | 조화로운 이목구비에서 차분하고 신중한 연애 스타일이 느껴집니다.`;
  } catch (error) {
    console.warn("Gemini 2.5 Flash 호출 실패 (폴백 가동):", error.message);
    
    const category = faceData ? (faceData.wasSmiling ? 'forcedSmile' : 'unsmiling') : 'default';
    const pool = FALLBACK_MENOTS[category] || FALLBACK_MENOTS.default;
    const randomMent = pool[Math.floor(Math.random() * pool.length)];
    const randomPct = (Math.random() * 20 + 0.1).toFixed(1);

    return `${randomPct}% | 차분한 관찰자 | 열정적인 활동가 | ${randomMent}`;
  }
};
