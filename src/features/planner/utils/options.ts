import type { Course } from '../types'
import type { PlannerSelectOption } from '../PlannerSelect'
import { PLANNER_WEEKDAY_LABELS } from './date'
import {
  formatMinutesToTime,
  plannerEndMinutes,
  plannerStartMinutes,
  PLANNER_SLOT_MINUTES,
} from './time'

const createPlannerTimeOptions = () => {
  const options: string[] = []

  for (
    let minutes = plannerStartMinutes;
    minutes <= plannerEndMinutes;
    minutes += PLANNER_SLOT_MINUTES
  ) {
    options.push(formatMinutesToTime(minutes))
  }

  return options
}

const timeOptions = createPlannerTimeOptions()

export const startTimeSelectOptions: PlannerSelectOption[] = timeOptions
  .slice(0, -1)
  .map((time) => ({ label: time, value: time }))

export const endTimeSelectOptions: PlannerSelectOption[] = timeOptions
  .slice(1)
  .map((time) => ({ label: time, value: time }))

export const weekdayOptions: PlannerSelectOption[] = PLANNER_WEEKDAY_LABELS.map(
  (weekday, dayOfWeek) => ({
    label: `${weekday}요일`,
    value: String(dayOfWeek),
  }),
)

export const createCourseOptions = (courses: Course[]): PlannerSelectOption[] => [
  { label: '강의 선택', value: '' },
  ...courses.map((course) => ({
    color: course.color,
    label: course.title,
    value: course.id,
  })),
]
