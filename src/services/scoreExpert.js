/**
 * 연애 확률 전문가 스코어링 모듈
 * 표정 데이터를 다차원으로 분석하여 연애 성공 확률을 계산합니다.
 */

// 표정별 기본 확률 범위 (min, max)
const EXPRESSION_RANGES = {
  happy:     { min: 62, max: 94 },  // 웃는 얼굴 - 높음
  surprised: { min: 38, max: 72 },  // 놀란 표정 - 중간 (설레는 느낌)
  neutral:   { min: 15, max: 42 },  // 무표정 - 낮음
  fearful:   { min: 20, max: 48 },  // 긴장된 표정 - 약간 낮음 (설레기도 함)
  sad:       { min: 8,  max: 28 },  // 슬픈 표정 - 낮음
  disgusted: { min: 3,  max: 18 },  // 혐오 표정 - 매우 낮음
  angry:     { min: 2,  max: 15 },  // 화난 표정 - 최저
};

/**
 * 랜덤 범위 내 소수점 1자리 값 생성
 */
const randomInRange = (min, max) => {
  const raw = Math.random() * (max - min) + min;
  return Math.round(raw * 10) / 10;
};

/**
 * 미소 지속 여부에 따른 보정값 계산
 * @param {boolean} wasSmiling - 스캔 중 미소 감지 여부
 * @param {number} baseScore - 기본 점수
 */
const applySmileBonus = (wasSmiling, baseScore) => {
  if (wasSmiling) {
    // 웃었는데 행복 표정이면 보너스, 다른 표정이면 소폭 보정
    const bonus = Math.random() * 8 + 2; // +2 ~ +10
    return Math.min(baseScore + bonus, 97);
  } else {
    // 끝까지 안 웃었으면 패널티
    const penalty = Math.random() * 10 + 3; // -3 ~ -13
    return Math.max(baseScore - penalty, 1);
  }
};

/**
 * 표정 신뢰도(probability)에 따른 보정
 * 확실하게 웃으면 더 높고, 애매하면 중간값으로 당김
 */
const applyConfidenceAdjust = (score, probability) => {
  const confidence = parseFloat(probability) / 100; // 0~1
  // 신뢰도가 낮으면 50점 방향으로 당김 (애매한 표정)
  const pull = (50 - score) * (1 - confidence) * 0.3;
  return Math.round((score + pull) * 10) / 10;
};

/**
 * 메인 스코어 계산 함수
 * @param {object|null} faceData - { expression, probability, landmarks, wasSmiling }
 * @returns {{ percent: number, expressionLabel: string }}
 */
export const calculateLoveScore = (faceData) => {
  // 얼굴 데이터 없을 때 - 중하위 랜덤
  if (!faceData) {
    return {
      percent: randomInRange(10, 45),
      expressionLabel: '감지 불가',
    };
  }

  const { expression, probability, wasSmiling } = faceData;
  const range = EXPRESSION_RANGES[expression] || EXPRESSION_RANGES.neutral;

  // 1단계: 표정 범위에서 기본 점수 추출
  let score = randomInRange(range.min, range.max);

  // 2단계: 미소 지속 보너스/패널티 적용
  score = applySmileBonus(wasSmiling, score);

  // 3단계: 신뢰도에 따른 미세 보정
  score = applyConfidenceAdjust(score, probability);

  // 소수점 1자리로 최종 클리핑
  score = Math.max(0.1, Math.min(99.9, Math.round(score * 10) / 10));

  const expressionLabels = {
    happy:     '행복',
    surprised: '놀람',
    neutral:   '무표정',
    fearful:   '긴장',
    sad:       '슬픔',
    disgusted: '혐오',
    angry:     '분노',
  };

  return {
    percent: score,
    expressionLabel: expressionLabels[expression] || '알 수 없음',
  };
};
