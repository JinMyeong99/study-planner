import type { CSSProperties } from 'react'

import type { Course, StudyBlock } from './types'
import { PLANNER_WEEKDAY_LABELS } from './utils/date'
import { createPlannerHourLabels, createPlannerTimeSlots } from './utils/grid'

interface PlannerWeekGridProps {
  blocks: StudyBlock[]
  courses: Course[]
}

const timeSlots = createPlannerTimeSlots()
const hourLabels = createPlannerHourLabels()
const gridStyle = {
  '--planner-slot-count': timeSlots.length,
} as CSSProperties

export const PlannerWeekGrid = ({
  blocks,
  courses,
}: PlannerWeekGridProps) => {
  void blocks
  void courses

  return (
    <div className="planner-week-grid" aria-label="주간 시간 그리드">
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

        {PLANNER_WEEKDAY_LABELS.map((weekday) => (
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
          </div>
        ))}
      </div>
    </div>
  )
}
