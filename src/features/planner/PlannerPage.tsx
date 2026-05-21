import { useMemo } from 'react'

import {
  formatDayOfWeek,
  formatLocalDate,
  getWeekDateRangeLabel,
  getWeekStartDate,
} from './utils/date'
import { parseTimeToMinutes } from './utils/time'
import { useEditablePlannerState } from './hooks/useEditablePlannerState'
import { usePlannerData } from './hooks/usePlannerData'
import type { Course, StudyBlock } from './types'
import './PlannerPage.css'

export interface PlannerPageProps {
  initialWeekStart?: string
}

const sortPlannerBlocks = (blocks: StudyBlock[]) =>
  [...blocks].sort((firstBlock, secondBlock) => {
    const firstStart = parseTimeToMinutes(firstBlock.startTime) ?? 0
    const secondStart = parseTimeToMinutes(secondBlock.startTime) ?? 0

    return (
      firstBlock.dayOfWeek - secondBlock.dayOfWeek ||
      firstStart - secondStart ||
      firstBlock.endTime.localeCompare(secondBlock.endTime)
    )
  })

const createCourseMap = (courses: Course[]) =>
  new Map(courses.map((course) => [course.id, course]))

const getCurrentWeekStart = () => formatLocalDate(getWeekStartDate(new Date()))

const PlannerBlockList = ({
  blocks,
  courses,
}: {
  blocks: StudyBlock[]
  courses: Course[]
}) => {
  const courseMap = createCourseMap(courses)
  const sortedBlocks = sortPlannerBlocks(blocks)

  if (sortedBlocks.length === 0) {
    return (
      <div className="planner-empty-state">
        <strong>이번 주 학습 블록이 없습니다.</strong>
        <span>다음 작업에서 시간 슬롯을 클릭해 블록을 추가할 수 있습니다.</span>
      </div>
    )
  }

  return (
    <ul className="planner-block-list">
      {sortedBlocks.map((block) => {
        const course = courseMap.get(block.courseId)

        return (
          <li className="planner-block-card" key={block.id}>
            <span
              aria-hidden="true"
              className="planner-block-card__color"
              style={{ backgroundColor: course?.color ?? '#8f97a8' }}
            />
            <div className="planner-block-card__content">
              <strong>{course?.title ?? '알 수 없는 강의'}</strong>
              <span>
                {formatDayOfWeek(block.dayOfWeek)}요일 · {block.startTime} -{' '}
                {block.endTime}
              </span>
              {block.memo ? <p>{block.memo}</p> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export const PlannerPage = ({ initialWeekStart }: PlannerPageProps) => {
  const defaultWeekStart = useMemo(() => getCurrentWeekStart(), [])
  const weekStart = initialWeekStart ?? defaultWeekStart
  const plannerData = usePlannerData(weekStart)
  const isPlannerReady = !plannerData.isLoading && !plannerData.isError
  const editablePlanner = useEditablePlannerState({
    weekStart: plannerData.plannerWeekStart,
    savedBlocks: plannerData.savedBlocks,
    isReady: isPlannerReady,
  })
  const canShowPlannerContent = isPlannerReady && editablePlanner.isReady

  return (
    <main className="planner-page">
      <section className="planner-hero" aria-labelledby="planner-title">
        <div>
          <h1 id="planner-title">주간 학습 플래너</h1>
          <p>{getWeekDateRangeLabel(weekStart)}</p>
        </div>
        <div className="planner-status-panel" aria-label="플래너 상태">
          <span>
            서버 상태:{' '}
            <strong>
              {plannerData.isLoading
                ? '불러오는 중'
                : plannerData.isError
                  ? '오류'
                  : '로드 완료'}
            </strong>
          </span>
          <span>
            편집 상태:{' '}
            <strong>
              {editablePlanner.isDirty ? '저장되지 않은 변경 사항' : '변경 없음'}
            </strong>
          </span>
        </div>
      </section>

      {plannerData.isLoading ? (
        <section className="planner-message" role="status">
          주간 플래너를 불러오는 중입니다.
        </section>
      ) : null}

      {plannerData.isError ? (
        <section className="planner-message planner-message--error" role="alert">
          <strong>플래너 정보를 불러오지 못했습니다.</strong>
          <p>{plannerData.errorMessage}</p>
          <button
            onClick={() => {
              void plannerData.refetch()
            }}
            type="button"
          >
            다시 시도
          </button>
        </section>
      ) : null}

      {canShowPlannerContent ? (
        <div className="planner-layout">
          <section className="planner-panel" aria-labelledby="planner-grid-title">
            <div className="planner-panel__header">
              <h2 id="planner-grid-title">주간 시간표</h2>
              <span>08:00 - 20:00 · 30분 단위 예정</span>
            </div>
            <div className="planner-grid-placeholder">
              <strong>시간 그리드 준비 영역</strong>
              <p>
                다음 작업에서 7일 × 시간대 그리드와 블록 위치 계산을 이
                영역에 연결합니다.
              </p>
            </div>
          </section>

          <section
            className="planner-panel"
            aria-labelledby="planner-block-list-title"
          >
            <div className="planner-panel__header">
              <h2 id="planner-block-list-title">저장된 학습 블록</h2>
              <span>{editablePlanner.draftBlocks.length}개</span>
            </div>
            <PlannerBlockList
              blocks={editablePlanner.draftBlocks}
              courses={plannerData.courses}
            />
          </section>
        </div>
      ) : null}
    </main>
  )
}
