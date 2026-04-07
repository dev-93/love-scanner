/**
 * 스트레칭 타이머 유틸리티
 * 순수 함수와 상수만 포함 - Vue 의존성 없음
 */

/** 타이머 기본 시간 (30분 = 1800초) */
export const TIMER_DURATION = 1800;

/** 스트레칭 동작 목록 */
export const STRETCH_EXERCISES = [
    { type: 'neck', instruction: '고개를 천천히 좌우로 기울여 목을 풀어주세요' },
    { type: 'shoulder', instruction: '양 어깨를 귀 쪽으로 올렸다 내려주세요' },
    { type: 'waist', instruction: '상체를 좌우로 천천히 비틀어 허리를 풀어주세요' },
];

/**
 * 초를 MM:SS 형식 문자열로 변환
 * @param {number} seconds - 0 이상의 정수
 * @returns {string} MM:SS 형식 문자열
 */
export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * MM:SS 형식 문자열을 초로 변환
 * @param {string} timeStr - MM:SS 형식 문자열
 * @returns {number} 초 단위 정수
 */
export function parseTime(timeStr) {
    const [m, s] = timeStr.split(':').map(Number);
    return m * 60 + s;
}

/**
 * 랜덤 스트레칭 동작 선택
 * @returns {{ type: string, instruction: string }}
 */
export function getRandomStretch() {
    const index = Math.floor(Math.random() * STRETCH_EXERCISES.length);
    return STRETCH_EXERCISES[index];
}
