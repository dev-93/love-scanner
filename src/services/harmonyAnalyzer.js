/**
 * 얼굴 랜드마크 기반 대칭도/비율 분석 모듈
 *
 * face-api의 68개 랜드마크 인덱스 참고:
 * 0-16:  턱선 (17개)
 * 17-21: 왼쪽 눈썹 (5개)
 * 22-26: 오른쪽 눈썹 (5개)
 * 27-30: 코 브릿지 (4개)
 * 31-35: 코 끝 (5개)
 * 36-41: 왼쪽 눈 (6개)
 * 42-47: 오른쪽 눈 (6개)
 * 48-59: 입 외곽 (12개)
 * 60-67: 입 내부 (8개)
 */

/**
 * 두 점 사이 거리
 */
const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

/**
 * 두 점의 중점
 */
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * 값을 0~100 사이로 정규화 (클램프)
 */
const clamp100 = (v) => Math.max(0, Math.min(100, v));

/**
 * 좌우 대칭도 계산 (0~100)
 * 얼굴 중심선 기준으로 주요 랜드마크 좌우 거리 차이를 분석
 */
const calcSymmetry = (pts) => {
  // 얼굴 중심 X축 (코 브릿지 중심)
  const noseBridge = pts[27];

  // 좌우 대칭 쌍 비교 포인트 (왼쪽 인덱스, 오른쪽 인덱스)
  const pairs = [
    [36, 45], // 눈 바깥쪽 끝
    [39, 42], // 눈 안쪽 끝
    [17, 26], // 눈썹 바깥쪽
    [21, 22], // 눈썹 안쪽
    [31, 35], // 코 끝 좌우
    [48, 54], // 입 끝
    [0, 16],  // 턱 좌우 끝
    [3, 13],  // 볼 좌우
  ];

  let totalDeviation = 0;
  let totalRef = 0;

  pairs.forEach(([li, ri]) => {
    const l = pts[li];
    const r = pts[ri];
    if (!l || !r) return;

    const leftDist = Math.abs(l.x - noseBridge.x);
    const rightDist = Math.abs(r.x - noseBridge.x);
    const ref = (leftDist + rightDist) / 2;

    if (ref < 1) return;

    const deviation = Math.abs(leftDist - rightDist) / ref;
    totalDeviation += deviation;
    totalRef += 1;
  });

  if (totalRef === 0) return 50;

  const avgDeviation = totalDeviation / totalRef;
  // deviation 0 = 완벽 대칭(100점), deviation 0.5+ = 낮은 대칭(0~점)
  const symmetryScore = clamp100(100 - avgDeviation * 200);
  return symmetryScore;
};

/**
 * 눈 간격 비율 (황금비 근사)
 * 이상적인 눈 간격 = 얼굴 너비의 약 1/5
 */
const calcEyeRatio = (pts) => {
  const faceWidth = dist(pts[0], pts[16]);    // 얼굴 너비
  const eyeGap = dist(pts[39], pts[42]);       // 두 눈 안쪽 간격
  const leftEyeW = dist(pts[36], pts[39]);     // 왼쪽 눈 너비
  const rightEyeW = dist(pts[42], pts[45]);    // 오른쪽 눈 너비

  if (faceWidth < 1) return 50;

  // 이상적: eyeGap ≈ leftEyeW ≈ rightEyeW (눈 너비와 간격이 동일)
  const avgEyeW = (leftEyeW + rightEyeW) / 2;
  const idealRatio = 1.0; // 눈 너비 대비 간격 비율
  const actualRatio = eyeGap / (avgEyeW || 1);
  const deviation = Math.abs(actualRatio - idealRatio);

  return clamp100(100 - deviation * 60);
};

/**
 * 얼굴 가로세로 비율 (황금비: 1 : 1.618)
 */
const calcFaceProportion = (pts) => {
  const faceWidth = dist(pts[0], pts[16]);     // 좌우 너비
  const faceHeight = dist(pts[27], pts[8]);     // 코 브릿지~턱 끝 (얼굴 하단)

  if (faceWidth < 1) return 50;

  const ratio = faceHeight / faceWidth;
  const golden = 1.618;
  const deviation = Math.abs(ratio - golden) / golden;

  return clamp100(100 - deviation * 120);
};

/**
 * 입 너비 비율 (이상적: 눈동자 간격과 비슷)
 */
const calcMouthRatio = (pts) => {
  const mouthWidth = dist(pts[48], pts[54]);
  const leftPupil = midpoint(pts[36], pts[39]);
  const rightPupil = midpoint(pts[42], pts[45]);
  const pupilDist = dist(leftPupil, rightPupil);

  if (pupilDist < 1) return 50;

  // 이상적 입 너비 ≈ 동공 간격 (0.9~1.1 배)
  const ratio = mouthWidth / pupilDist;
  const deviation = Math.abs(ratio - 1.0);

  return clamp100(100 - deviation * 80);
};

/**
 * 메인 함수: 랜드마크 배열에서 매력도 점수 반환 (0~100)
 * @param {Array} landmarks - face-api landmarks.positions 배열
 * @returns {{ harmonyScore: number, detail: object }}
 */
export const analyzeFacialHarmony = (landmarks) => {
  if (!landmarks || landmarks.length < 68) {
    return { harmonyScore: 50, detail: null };
  }

  const pts = landmarks;

  const symmetry     = calcSymmetry(pts);       // 좌우 대칭도
  const eyeRatio     = calcEyeRatio(pts);        // 눈 간격 비율
  const proportion   = calcFaceProportion(pts);  // 얼굴 황금비
  const mouthRatio   = calcMouthRatio(pts);      // 입 너비 비율

  // 가중 평균 (대칭 > 비율 > 눈 > 입) - 생김새 완성도 위주
  const harmonyScore = (
    symmetry   * 0.50 +
    proportion * 0.30 +
    eyeRatio   * 0.15 +
    mouthRatio * 0.05
  );

  return {
    harmonyScore: Math.round(harmonyScore * 10) / 10,
    detail: { symmetry, eyeRatio, proportion, mouthRatio },
  };
};
