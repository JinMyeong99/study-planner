import { useState, useMemo, type CSSProperties } from 'react'

import './PlannerWeekGrid.css'
import { PLANNER_BLOCK_FALLBACK_COLOR } from '../constants'
import type { Course, StudyBlock } from '../types'
import { createCourseMap } from '../utils/blocks'
import { getWeekdayDateLabels, PLANNER_WEEKDAY_LABELS } from '../utils/date'
import {
  createPlannerHourLabels,
  createPlannerTimeSlots,
  getBlockGridPlacement,
  PLANNER_GRID_SLOT_HEIGHT,
} from '../utils/grid'

interface PlannerWeekGridProps {
  blocks: StudyBlock[]
  conflictBlockIds?: Set<string>
  courses: Course[]
  onBlockClick: (block: StudyBlock) => void
  onSlotClick: (selection: { dayOfWeek: number; startTime: string }) => void
  weekStart: string
}

const timeSlots = createPlannerTimeSlots()
const hourLabels = createPlannerHourLabels()
const gridStyle = {
  '--planner-grid-height': `${timeSlots.length * PLANNER_GRID_SLOT_HEIGHT}px`,
  '--planner-slot-height': `${PLANNER_GRID_SLOT_HEIGHT}px`,
  '--planner-slot-count': timeSlots.length,
} as CSSProperties

const getCourseBackground = (color: string) =>
  `color-mix(in srgb, ${color} 12%, var(--planner-surface))`

const getBlocksByDay = (blocks: StudyBlock[]) => {
  const byDay: StudyBlock[][] = Array.from({ length: 7 }, () => [])

  for (const block of blocks) {
    byDay[block.dayOfWeek].push(block)
  }

  return byDay
}

const getBlockClassName = (durationMinutes: number, hasMemo: boolean) =>
  [
    'planner-week-grid__block',
    durationMinutes <= 30 ? 'is-compact' : '',
    durationMinutes >= 90 && hasMemo ? 'has-large-memo-preview' : '',
  ]
    .filter(Boolean)
    .join(' ')

export const PlannerWeekGrid = ({
  blocks,
  conflictBlockIds = new Set<string>(),
  courses,
  onBlockClick,
  onSlotClick,
  weekStart,
}: PlannerWeekGridProps) => {
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(0)
  const courseMap = useMemo(() => createCourseMap(courses), [courses])
  const blocksByDay = useMemo(() => getBlocksByDay(blocks), [blocks])
  const weekdayDateLabels = useMemo(() => getWeekdayDateLabels(weekStart), [weekStart])

  return (
    <div
      className="planner-week-grid"
      role="region"
      aria-label="주간 시간 그리드"
    >
      <div
        aria-label="요일 선택"
        className="planner-week-grid__day-tabs"
        role="tablist"
      >
        {PLANNER_WEEKDAY_LABELS.map((weekday, dayOfWeek) => {
          const dateLabel = weekdayDateLabels[dayOfWeek]

          return (
            <button
              aria-label={`${weekday}요일 ${dateLabel}`}
              aria-selected={selectedDayOfWeek === dayOfWeek}
              className="planner-week-grid__day-tab"
              key={weekday}
              onClick={() => {
                setSelectedDayOfWeek(dayOfWeek)
              }}
              role="tab"
              type="button"
            >
              <span aria-hidden="true" className="planner-week-grid__day-label">{weekday}</span>
              <span aria-hidden="true" className="planner-week-grid__date-label">{dateLabel}</span>
            </button>
          )
        })}
      </div>

      <div className="planner-week-grid__header">
        <span aria-hidden="true" />
        {PLANNER_WEEKDAY_LABELS.map((weekday, dayOfWeek) => {
          const dateLabel = weekdayDateLabels[dayOfWeek]

          return (
            <strong
              aria-label={`${weekday}요일 ${dateLabel}`}
              className={
                selectedDayOfWeek === dayOfWeek
                  ? 'planner-week-grid__weekday is-selected'
                  : 'planner-week-grid__weekday'
              }
              key={weekday}
            >
              <span className="planner-week-grid__day-label">{weekday}</span>
              <span className="planner-week-grid__date-label">{dateLabel}</span>
            </strong>
          )
        })}
      </div>

      <div
        className="planner-week-grid__body"
        style={gridStyle}
      >
        <div className="planner-week-grid__time-axis" aria-hidden="true">
          {hourLabels.map((label, index) => (
            <span
              key={label}
              style={{
                top: `${index * PLANNER_GRID_SLOT_HEIGHT * 2}px`,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {PLANNER_WEEKDAY_LABELS.map((weekday, dayOfWeek) => (
          <div
            className={
              selectedDayOfWeek === dayOfWeek
                ? 'planner-week-grid__day-column is-selected'
                : 'planner-week-grid__day-column'
            }
            key={weekday}
            aria-label={`${weekday}요일`}
          >
            {timeSlots.map((slot) => (
              <button
                aria-label={`${weekday}요일 ${slot} 학습 블록 추가`}
                className="planner-week-grid__slot"
                key={slot}
                onClick={() => {
                  onSlotClick({
                    dayOfWeek,
                    startTime: slot,
                  })
                }}
                type="button"
              />
            ))}
            {blocksByDay[dayOfWeek].map((block) => {
              const course = courseMap.get(block.courseId)
              const placement = getBlockGridPlacement(block)
              const hasConflict = conflictBlockIds.has(block.id)
              const blockStyle = {
                '--planner-block-color': course?.color ?? PLANNER_BLOCK_FALLBACK_COLOR,
                '--planner-block-bg': getCourseBackground(
                  course?.color ?? PLANNER_BLOCK_FALLBACK_COLOR,
                ),
                height: `${placement.height}px`,
                top: `${placement.top}px`,
              } as CSSProperties
              const courseTitle = course?.title ?? '알 수 없는 강의'

              return (
                <button
                  aria-label={`${courseTitle} ${block.startTime} - ${block.endTime} 편집`}
                  className={[
                    getBlockClassName(
                      placement.durationMinutes,
                      Boolean(block.memo),
                    ),
                    hasConflict ? 'is-conflict' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={block.id}
                  onClick={() => {
                    onBlockClick(block)
                  }}
                  style={blockStyle}
                  type="button"
                >
                  <strong>{courseTitle}</strong>
                  <span>
                    {block.startTime} - {block.endTime}
                  </span>
                  {hasConflict ? (
                    <em className="planner-conflict-badge">시간 충돌</em>
                  ) : null}
                  {block.memo && placement.durationMinutes >= 60 ? (
                    <p>{block.memo}</p>
                  ) : null}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
