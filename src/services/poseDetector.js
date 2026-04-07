/**
 * 얼굴 랜드마크 기반 동작 감지 로직
 * 순수 함수만 포함 - Vue 의존성 없음
 */

/** 스트레칭 동작 판정 임계값 (픽셀) */
export const STRETCH_THRESHOLD = 50;

/** 감지 타임아웃 (ms) */
export const DETECTION_TIMEOUT = 60000;

/**
 * 68개 랜드마크에서 머리 중심점 계산
 * 코 브릿지 landmark[27] + 턱 중심 landmark[8] 의 중점
 * @param {Array<{x: number, y: number}>} landmarks - 68개 랜드마크 좌표
 * @returns {{ x: number, y: number }}
 */
export function getHeadCenter(landmarks) {
    const noseBridge = landmarks[27];
    const chinCenter = landmarks[8];
    return {
        x: (noseBridge.x + chinCenter.x) / 2,
        y: (noseBridge.y + chinCenter.y) / 2,
    };
}

/**
 * 두 점 사이의 유클리드 거리 계산
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
function euclideanDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 점 사이의 이동 방향 계산
 * @param {{ x: number, y: number }} from - 기준점
 * @param {{ x: number, y: number }} to - 현재점
 * @returns {string} 'left' | 'right' | 'up' | 'down' | 'none'
 */
function getDirection(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return 'none';

    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
}

/**
 * 기준 자세 대비 머리 위치 변화를 감지하여 스트레칭 수행 여부 판정
 * @param {Array<{x: number, y: number}>} baselineLandmarks - 감지 시작 시점의 68개 랜드마크
 * @param {Array<{x: number, y: number}>} currentLandmarks - 현재 프레임의 68개 랜드마크
 * @returns {{ isStretching: boolean, confidence: number, direction: string }}
 */
export function detectStretchMovement(baselineLandmarks, currentLandmarks) {
    const baseCenter = getHeadCenter(baselineLandmarks);
    const currentCenter = getHeadCenter(currentLandmarks);

    const distance = euclideanDistance(baseCenter, currentCenter);
    const isStretching = distance >= STRETCH_THRESHOLD;

    // confidence: 0~1, 임계값 대비 비율 (최대 1)
    const confidence = Math.min(distance / STRETCH_THRESHOLD, 1);

    const direction = isStretching
        ? getDirection(baseCenter, currentCenter)
        : 'none';

    return { isStretching, confidence, direction };
}
