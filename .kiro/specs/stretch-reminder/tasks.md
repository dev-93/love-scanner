# 구현 계획: 스트레칭 리마인더

## 개요

기존 러브 스캐너 앱(Vue 3 + Vite)에 Vue Router를 도입하고, `/stretch` 경로에 스트레칭 리마인더 페이지를 추가한다. 기존 러브 스캐너 기능은 그대로 유지하면서, 30분 타이머, 전체 화면 알림, 카메라 기반 동작 감지, 세션 기록 기능을 구현한다.

## Tasks

- [x] 1. Vue Router 도입 및 기존 러브 스캐너 페이지 분리
  - [x] 1.1 `vue-router` 패키지 설치 및 `src/router/index.js` 라우터 설정 파일 생성
    - `/` → LoveScannerPage, `/stretch` → StretchPage, `/:pathMatch(.*)*` → `/` 리다이렉트 설정
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 `src/App.vue`를 `<router-view>` 셸로 변환
    - 기존 러브 스캐너 로직(script, template, style)을 모두 제거하고 `<router-view />`만 렌더링
    - 글로벌 스타일은 유지
    - _Requirements: 1.4_
  - [x] 1.3 `src/pages/LoveScannerPage.vue` 생성 및 기존 App.vue 로직 이전
    - 기존 App.vue의 script setup, template, scoped style을 그대로 이전
    - CameraView, ScannerOverlay, gemini.js, scoreExpert.js import 유지
    - _Requirements: 1.4, 6.1, 6.2_
  - [x] 1.4 `src/main.js`에 Router 등록
    - `createApp(App).use(router).mount('#app')` 형태로 변경
    - _Requirements: 1.1, 1.2_
  - [x] 1.5 `vercel.json`에 SPA 리다이렉트 설정 추가
    - 모든 경로를 `index.html`로 리다이렉트하는 rewrites 규칙 추가
    - _Requirements: 1.3_

- [x] 2. 체크포인트 - 라우팅 동작 확인
  - 기존 러브 스캐너 기능이 `/` 경로에서 정상 동작하는지 확인
  - `/stretch` 경로 접근 시 빈 페이지라도 라우팅이 동작하는지 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. 스트레칭 타이머 및 유틸리티 구현
  - [x] 3.1 `src/services/stretchTimer.js` 타이머 유틸리티 생성
    - `formatTime(seconds)`: 초를 `MM:SS` 형식으로 변환하는 순수 함수
    - `parseTime(timeStr)`: `MM:SS` 문자열을 초로 변환하는 순수 함수
    - `STRETCH_EXERCISES` 배열 정의 (neck, shoulder, waist 타입 + 안내 텍스트)
    - `getRandomStretch()`: 랜덤 스트레칭 동작 선택 함수
    - _Requirements: 2.2, 3.2_
  - [ ]* 3.2 Property 2 속성 테스트: 시간 포맷팅 라운드트립
    - **Property 2: 시간 포맷팅 정확성**
    - fast-check으로 0~1800 범위 정수에 대해 `parseTime(formatTime(n)) === n` 검증
    - **Validates: Requirements 2.2**
  - [ ]* 3.3 Property 5 속성 테스트: 스트레칭 동작 선택 유효성
    - **Property 5: 스트레칭 동작 선택 유효성**
    - fast-check으로 `getRandomStretch()` 반환값이 항상 유효한 타입이고 안내 텍스트가 비어있지 않은지 검증
    - **Validates: Requirements 3.2**

- [x] 4. 스트레칭 페이지 핵심 컴포넌트 구현
  - [x] 4.1 `src/components/StretchTimer.vue` 타이머 UI 컴포넌트 생성
    - Props: `state` ('idle'|'counting'|'paused'), `remainingSeconds` (number)
    - Emits: `start`, `pause`, `resume`, `reset`
    - 남은 시간을 `MM:SS` 형식으로 표시, 시작/일시정지/재개/초기화 버튼 제공
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_
  - [x] 4.2 `src/components/StretchNotification.vue` 알림 오버레이 컴포넌트 생성
    - Props: `visible` (boolean), `stretch` ({ type, instruction })
    - Emits: `start-stretch`, `skip`
    - 전체 화면 오버레이, 스트레칭 안내 텍스트, "스트레칭 시작"/"건너뛰기" 버튼
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.3 `src/components/StretchStats.vue` 세션 통계 컴포넌트 생성
    - Props: `done` (number), `skipped` (number)
    - 완료 횟수와 건너뛰기 횟수를 화면에 표시
    - _Requirements: 5.1, 5.2_

- [x] 5. 동작 감지 서비스 및 카메라 컴포넌트 구현
  - [x] 5.1 `src/services/poseDetector.js` 동작 감지 로직 생성
    - `getHeadCenter(landmarks)`: 68개 랜드마크에서 머리 중심점 계산 (코 브릿지 + 턱 중심)
    - `detectStretchMovement(baselineLandmarks, currentLandmarks)`: 기준 대비 위치 변화 감지
    - `STRETCH_THRESHOLD` (30px), `DETECTION_TIMEOUT` (60000ms) 상수 정의
    - _Requirements: 4.1, 4.2_
  - [ ]* 5.2 Property 6 속성 테스트: 동작 감지 임계값 판정
    - **Property 6: 동작 감지 임계값 판정**
    - fast-check으로 유클리드 거리 ≥ STRETCH_THRESHOLD이면 isStretching=true, 미만이면 false 검증
    - **Validates: Requirements 4.2**
  - [x] 5.3 `src/components/StretchCamera.vue` 카메라 뷰 컴포넌트 생성
    - Props: `active` (boolean)
    - Emits: `stretch-detected`, `timeout`, `camera-denied`
    - face-api.js 모델 로드, 카메라 스트림 관리, 감지 루프 실행
    - 60초 타임아웃 처리, 카메라 권한 거부 시 안내 메시지 + 수동 완료 버튼
    - onMounted/onUnmounted에서 카메라 리소스 독립 관리
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 6.3_

- [x] 6. 체크포인트 - 개별 컴포넌트 동작 확인
  - 각 컴포넌트가 독립적으로 렌더링되는지 확인
  - poseDetector.js 순수 함수 동작 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. StretchPage 통합 및 상태 관리
  - [x] 7.1 `src/pages/StretchPage.vue` 메인 페이지 컴포넌트 생성
    - 상태 머신: idle → counting → paused / notifying → detecting → completed / timeout
    - `remainingSeconds` (0~1800), `currentStretch`, `stats` ({ done, skipped }) 반응형 상태 관리
    - `setInterval` 기반 카운트다운 + `document.visibilitychange` 이벤트로 탭 비활성화 시 타이머 보정
    - StretchTimer, StretchNotification, StretchCamera, StretchStats 컴포넌트 통합 배선
    - 스트레칭 완료 시 done+1, 건너뛰기 시 skipped+1, 다음 30분 타이머 자동 시작
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 3.1, 3.3, 3.4, 4.4, 4.5, 5.1, 5.2, 5.3_
  - [ ]* 7.2 Property 3 속성 테스트: 타이머 일시정지/재개 라운드트립
    - **Property 3: 타이머 일시정지/재개 라운드트립**
    - fast-check으로 1~1800 범위 값에서 pause→resume 후 남은 시간 동일 검증
    - **Validates: Requirements 2.4, 2.5**
  - [ ]* 7.3 Property 4 속성 테스트: 타이머 초기화 불변성
    - **Property 4: 타이머 초기화 불변성**
    - fast-check으로 임의 상태에서 reset 후 항상 idle + 1800초 검증
    - **Validates: Requirements 2.6**
  - [ ]* 7.4 Property 7 속성 테스트: 세션 기록 정확성
    - **Property 7: 세션 기록 정확성**
    - fast-check으로 done/skip 이벤트 시퀀스에 대해 `stats.done + stats.skipped === 총 이벤트 수` 검증
    - **Validates: Requirements 5.1**

- [ ] 8. 라우터 속성 테스트 및 통합 테스트
  - [ ]* 8.1 Property 1 속성 테스트: 존재하지 않는 경로 리다이렉트
    - **Property 1: 존재하지 않는 경로는 항상 루트로 리다이렉트**
    - fast-check으로 임의 경로 문자열에 대해 라우터 resolve 결과가 `/`로 리다이렉트되는지 검증
    - **Validates: Requirements 1.3**
  - [ ]* 8.2 기존 기능 회귀 테스트
    - LoveScannerPage가 `/` 경로에서 정상 렌더링되는지 확인
    - 페이지 전환 시 카메라 리소스 정리 확인
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. 최종 체크포인트 - 전체 기능 통합 확인
  - 모든 라우팅, 타이머, 알림, 감지, 통계 기능이 정상 동작하는지 확인
  - 기존 러브 스캐너 기능 회귀 없음 확인
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- `*` 표시된 태스크는 선택 사항이며 빠른 MVP를 위해 건너뛸 수 있습니다
- 각 태스크는 특정 요구사항을 참조하여 추적 가능합니다
- 체크포인트에서 점진적 검증을 수행합니다
- 속성 테스트는 fast-check 라이브러리를 사용하여 보편적 정확성 속성을 검증합니다
- 단위 테스트는 특정 예제와 엣지 케이스를 검증합니다
