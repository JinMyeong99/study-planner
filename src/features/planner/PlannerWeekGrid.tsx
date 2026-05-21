import type { CSSProperties } from 'react'

import type { Course, StudyBlock } from './types'
import { PLANNER_WEEKDAY_LABELS } from './utils/date'
import {
  createPlannerHourLabels,
  createPlannerTimeSlots,
  getBlockGridPlacement,
} from './utils/grid'

interface PlannerWeekGridProps {
  blocks: StudyBlock[]
  courses: Course[]
}

const timeSlots = createPlannerTimeSlots()
const hourLabels = createPlannerHourLabels()
const gridStyle = {
  '--planner-slot-count': timeSlots.length,
} as CSSProperties

const createCourseMap = (courses: Course[]) =>
  new Map(courses.map((course) => [course.id, course]))

const getCourseBackground = (color: string) => `${color}1f`

const getBlocksByDay = (blocks: StudyBlock[]) =>
  PLANNER_WEEKDAY_LABELS.map((_, dayOfWeek) =>
    blocks.filter((block) => block.dayOfWeek === dayOfWeek),
  )

export const PlannerWeekGrid = ({
  blocks,
  courses,
}: PlannerWeekGridProps) => {
  const courseMap = createCourseMap(courses)
  const blocksByDay = getBlocksByDay(blocks)

  return (
    <div
      className="planner-week-grid"
      role="region"
      aria-label="주간 시간 그리드"
    >
      <div className="planner-week-grid__header">
        <span aria-hidden="true" />
        {PLANNER_WEEKDAY_LABELS.map((weekday) => (
          <strong key={weekday}>{weekday}</strong>
        ))}
      </div>

      <div
        className="planner-week-grid__body"
        style={gridStyle}
      >
        <div className="planner-week-grid__time-axis" aria-hidden="true">
          {hourLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {PLANNER_WEEKDAY_LABELS.map((weekday, dayOfWeek) => (
          <div
            className="planner-week-grid__day-column"
            key={weekday}
            aria-label={`${weekday}요일`}
          >
            {timeSlots.map((slot) => (
              <span
                aria-hidden="true"
                className="planner-week-grid__slot"
                key={slot}
              />
            ))}
            {blocksByDay[dayOfWeek].map((block) => {
              const course = courseMap.get(block.courseId)
              const placement = getBlockGridPlacement(block)
              const blockStyle = {
                '--planner-block-color': course?.color ?? '#8f97a8',
                '--planner-block-bg': getCourseBackground(
                  course?.color ?? '#8f97a8',
                ),
                height: `${placement.height}%`,
                top: `${placement.top}%`,
              } as CSSProperties

              return (
                <article
                  className="planner-week-grid__block"
                  key={block.id}
                  style={blockStyle}
                >
                  <strong>{course?.title ?? '알 수 없는 강의'}</strong>
                  <span>
                    {block.startTime} - {block.endTime}
                  </span>
                  {block.memo ? <p>{block.memo}</p> : null}
                </article>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
