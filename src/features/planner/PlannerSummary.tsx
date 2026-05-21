import { useMemo } from 'react'

import type { Course, StudyBlock } from './types'
import { formatDayOfWeek } from './utils/date'
import {
  calculateMinutesByCourse,
  calculateMinutesByDay,
  calculateTotalMinutes,
  formatStudyDuration,
} from './utils/summary'

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6] as const

interface PlannerSummaryProps {
  blocks: StudyBlock[]
  courses: Course[]
}

export const PlannerSummary = ({ blocks, courses }: PlannerSummaryProps) => {
  const totalMinutes = useMemo(() => calculateTotalMinutes(blocks), [blocks])
  const minutesByDay = useMemo(() => calculateMinutesByDay(blocks), [blocks])
  const minutesByCourse = useMemo(
    () => calculateMinutesByCourse(blocks),
    [blocks],
  )

  const activeDays = DAY_ORDER.filter((day) => minutesByDay.has(day))
  const activeCourses = courses.filter((c) => minutesByCourse.has(c.id))

  return (
    <section className="planner-summary" aria-labelledby="planner-summary-title">
      <div className="planner-panel__header">
        <h2 id="planner-summary-title">주간 요약</h2>
        <span className="planner-summary__total">
          총 {formatStudyDuration(totalMinutes)}
        </span>
      </div>

      {blocks.length > 0 && (
        <div className="planner-summary__grid">
          <div>
            <h3 className="planner-summary__label">강의별</h3>
            <ul className="planner-summary__list">
              {activeCourses.map((course) => {
                const minutes = minutesByCourse.get(course.id) ?? 0
                return (
                  <li key={course.id} className="planner-summary__item">
                    <span
                      aria-hidden="true"
                      className="planner-summary__dot"
                      style={{ backgroundColor: course.color }}
                    />
                    <span className="planner-summary__name">{course.title}</span>
                    <span className="planner-summary__duration">
                      {formatStudyDuration(minutes)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h3 className="planner-summary__label">요일별</h3>
            <ul className="planner-summary__list">
              {activeDays.map((day) => {
                const minutes = minutesByDay.get(day) ?? 0
                return (
                  <li key={day} className="planner-summary__item">
                    <span className="planner-summary__name">
                      {formatDayOfWeek(day)}요일
                    </span>
                    <span className="planner-summary__duration">
                      {formatStudyDuration(minutes)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
