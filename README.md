# 주간 학습 플래너

## 프로젝트 개요

온라인 교육 플랫폼에서 한 주간의 학습 스케줄을 편집하고 저장하는 플래너입니다.
주간 시간 그리드에서 강의 블록을 추가·수정·삭제할 수 있고, 시간 충돌 감지, 미저장 변경 보호, 주간 학습 요약 차트를 제공합니다.

## 기술 스택

| 라이브러리 | 버전 | 선택 이유 |
|---|---|---|
| React | ^19.2.6 | 과제 권장 프레임워크 |
| TypeScript | ~6.0.2 | 타입 안정성, 과제 필수 요건 |
| TanStack Query | ^5.100.11 | 서버 상태(캐싱·로딩·에러) 관리. useState만으로 구현 시 로딩·에러·재시도 처리가 중복 코드로 증가 |
| Recharts | ^3.8.1 | 선언적 React 컴포넌트 기반 차트. 가산점 항목(차트 시각화)을 최소한의 코드로 구현 |
| MSW | ^2.14.6 | 개발·테스트 환경 Mock 서버. 실제 fetch 흐름을 유지하면서 API를 모킹 |
| Vite | ^8.0.12 | 빠른 HMR, `import.meta.env.DEV` 빌드 타임 치환으로 MSW를 프로덕션 번들에서 자동 제외 |
| Vitest | ^4.1.7 | Vite와 동일한 설정을 공유해 별도 번들러 설정 없이 빠른 단위 테스트 실행 |

## 실행 방법

```bash
npm ci

npm run dev      # 개발 서버 실행 (localhost:5173, MSW 자동 활성화)
npm run test     # 단위 테스트 실행
npm run build    # 프로덕션 빌드 (TypeScript 검사 포함)
npm run lint     # ESLint 검사
```

> **실행은 `npm run dev`를 사용해 주세요.** Mock API(MSW)는 개발 서버에서만 자동 활성화됩니다. 프로덕션 빌드(`npm run build`)에서는 실제 API 서버 연결이 필요합니다.

## 프로젝트 구조

```
src/
├── features/planner/          # 플래너 도메인 (관련 파일 일괄 관리)
│   ├── components/            # UI 컴포넌트
│   │   ├── PlannerWeekGrid    # 7일 × 시간대 그리드, 블록 배치
│   │   ├── PlannerBlockModal  # 블록 생성·편집 모달
│   │   ├── PlannerSummary     # 주간 요약 (파이·바 차트)
│   │   ├── PlannerBlockList   # 블록 목록
│   │   ├── PlannerSelect      # 커스텀 셀렉트
│   │   └── ConfirmDialog      # 확인 다이얼로그
│   ├── hooks/
│   │   ├── useEditablePlannerState  # 편집 중(draft) 상태 관리
│   │   ├── usePlannerData           # 서버 데이터 조회 (TanStack Query)
│   │   ├── useWeekNavigation        # 주간 이동 및 미저장 확인
│   │   ├── useAutoCloseToast        # Toast 자동 닫기
│   │   └── useUnsavedChangesWarning # 이탈 방지 (beforeunload)
│   ├── utils/
│   │   ├── time.ts       # 시간 파싱·포맷·유효성 검증 (순수 함수)
│   │   ├── grid.ts       # 분 → CSS px 위치 계산
│   │   ├── conflict.ts   # 시간 충돌 감지 (순수 함수)
│   │   ├── summary.ts    # 주간 통계 계산 (총시간·강의별·요일별)
│   │   ├── validation.ts # 모달 폼 검증
│   │   └── ...           # date, save, blocks, form, options
│   ├── types.ts           # 공유 타입 정의
│   ├── api.ts             # API 요청 함수
│   ├── queryKeys.ts       # TanStack Query 키 팩토리
│   └── PlannerPage.tsx    # 메인 페이지 (상태 조합·이벤트 연결)
├── lib/
│   └── queryClient.ts     # QueryClient 싱글톤
├── mocks/                 # MSW 핸들러·인메모리 스토어
└── test/                  # 테스트 설정
```

기능 도메인(`planner`)을 단일 폴더에 집약해 관련 타입·API·유틸·테스트가 함께 위치하도록 했습니다. 변경 범위가 도메인 내부로 국한되어 파일 탐색 부담이 줄어듭니다.

## 요구사항 해석 및 가정

### 시간 충돌 판정 기준

충돌 조건: `A.startTime < B.endTime && B.startTime < A.endTime` (strict 부등호)

| 케이스 | 판정 | 이유 |
|---|---|---|
| `09:00~10:00` / `10:00~11:00` | **충돌 아님** | 끝나는 시점과 시작 시점이 같으면 연속 수강이므로 충돌로 보지 않음 |
| `09:00~10:30` / `10:00~11:00` | **충돌** | 실제로 겹치는 구간이 존재 |
| 다른 요일의 동일 시간 | **충돌 아님** | 요일이 다르면 독립적 |

구현 위치: `src/features/planner/utils/conflict.ts` → `areBlocksOverlapping`
경계값 테스트: `src/features/planner/utils/conflict.test.ts`

### 시간 단위 및 유효하지 않은 시간 처리

`PLANNER_SLOT_MINUTES = 30` (30분 단위, 가산점 항목)

시간 계산·그리드 위치·모달 선택 옵션 전체에 일관 적용합니다. 이 상수 하나만 변경하면 전체 단위가 바뀌도록 설계했습니다.

30분 단위를 벗어나는 시간(09:15 등)은 두 가지 방식으로 차단합니다:

1. **입력 단계**: 모달 셀렉트 옵션이 30분 단위 시간만 제공 — 애초에 선택 불가
2. **검증 단계**: `isValidPlannerTime()`이 30분 단위 여부를 검증, 통과하지 못하면 저장 차단

### 빈 주차(블록 0개) 처리

- **그리드**: 빈 슬롯 클릭 가능 상태 유지 — 바로 블록을 추가할 수 있습니다
- **주간 요약**: "이번 주 등록된 강의가 없습니다." 메시지 표시
- **블록 리스트**: "강의를 추가해 주세요." 안내 메시지 표시

### 저장되지 않은 변경 사항 알림

세 가지 방식으로 사용자에게 알립니다:

1. 그리드 하단 "저장되지 않은 변경 사항" 텍스트 (상시 노출)
2. 브라우저 이탈·새로고침 시 `beforeunload` 확인 대화상자
3. 주간 이동 시 `ConfirmDialog`로 변경 버리기 여부 확인

## 설계 결정과 이유

### 서버 상태 vs 편집 상태 분리

```
서버 상태 (TanStack Query)            편집 상태 (useState)
─────────────────────────────────    ──────────────────────────────────
usePlannerData → savedBlocks         useEditablePlannerState → draftBlocks
                                                              → isDirty
저장 성공 → resetDraft() 호출         실패 시 draftBlocks 유지 (재시도 가능)
```

두 상태를 분리한 핵심 이유는 **저장 실패 시 사용자 입력을 잃지 않기 위해서**입니다. 저장 버튼을 누르기 전까지 서버에 영향을 주지 않고, 저장에 실패해도 편집 내용은 그대로 남아 재시도할 수 있습니다.

### 시간 로직을 UI와 분리한 이유

- `utils/time.ts`: 파싱·포맷·유효성 검증 (순수 함수, 사이드이펙트 없음)
- `utils/grid.ts`: 분 → CSS px 변환 (`top = ((startMin - 480) / 30) * 42`)
- `utils/conflict.ts`: 충돌 감지 (순수 함수, 독립 단위 테스트 가능)

컴포넌트에서 시간 계산을 하면 렌더링 로직과 비즈니스 로직이 뒤섞여 테스트와 재사용이 어렵습니다. 유틸 함수로 분리하면 UI 변경 없이 시간 로직만 독립적으로 검증할 수 있습니다.

### 주간 요약을 프론트에서 집계한 이유

- **즉시 반영**: 미저장(draft) 상태의 변경이 요약에 실시간으로 반영되어야 합니다. 서버 엔드포인트를 추가하면 저장 전 상태를 서버에 전송해야 하는 문제가 생깁니다.
- **단순성**: 클라이언트에서 충분히 계산 가능한 집계를 위해 별도 API를 추가하지 않았습니다.
- **성능**: `useMemo`로 `blocks` 변경 시에만 재계산해 불필요한 연산을 최소화합니다.

### 그리드 위치 계산

블록의 위치와 높이를 시작·종료 시간으로 동적 계산합니다 (하드코딩 없음):

```
height = (durationMinutes / 30) * 42px
top    = ((startMinutes - 480) / 30) * 42px   // 480 = 08:00
```

실제 구현은 `plannerStartMinutes`, `PLANNER_SLOT_MINUTES`, `PLANNER_GRID_SLOT_HEIGHT` 상수를 사용합니다. `PLANNER_GRID_SLOT_HEIGHT = 42`(30분당 px)와 `PLANNER_SLOT_MINUTES = 30`을 변경하면 전체 그리드 비율이 같은 계산 흐름으로 조정됩니다.

## 제약사항

| 항목 | 상태 |
|---|---|
| 인증·인가 | 과제 제외 항목 |

## AI 활용 범위

Claude Code와 Codex를 사용해 개발 전반에서 AI 도움을 받았습니다.

AI가 프로젝트 맥락을 유지하도록 `AGENTS.md`와 `CLAUDE.md`에 프로젝트 규칙, 구현 원칙, 검증 기준을 정리해 두고 이를 기반으로 작업했습니다.

- **활용**: 요구사항 정리, 컴포넌트 구조 설계, 유틸 함수 구현, CSS 스타일링, 테스트 작성, 문서 보완
- **직접 검토 및 결정**: 서버 상태와 편집 상태 분리, 시간 충돌 경계값, 30분 단위 시간 정책, Mock API 동작 방식, 최종 코드 리뷰와 검증
- **검증**: AI가 생성한 코드는 실행 결과와 테스트 결과를 확인하며 수정했습니다
