import type { StudyBlock } from '../types'
import {
  formatMinutesToTime,
  parseTimeToMinutes,
  plannerEndMinutes,
  plannerStartMinutes,
  PLANNER_MINUTES_PER_HOUR,
  PLANNER_SLOT_MINUTES,
} from './time'

export const plannerTotalMinutes = plannerEndMinutes - plannerStartMinutes

export const createPlannerTimeSlots = () => {
  const slots: string[] = []

  for (
    let minutes = plannerStartMinutes;
    minutes < plannerEndMinutes;
    minutes += PLANNER_SLOT_MINUTES
  ) {
    slots.push(formatMinutesToTime(minutes))
  }

  return slots
}

export const createPlannerHourLabels = () => {
  const labels: string[] = []

  for (
    let minutes = plannerStartMinutes;
    minutes <= plannerEndMinutes;
    minutes += PLANNER_MINUTES_PER_HOUR
  ) {
    labels.push(formatMinutesToTime(minutes))
  }

  return labels
}

export const getBlockDurationMinutes = (block: StudyBlock) => {
  const startMinutes = parseTimeToMinutes(block.startTime)
  const endMinutes = parseTimeToMinutes(block.endTime)

  if (startMinutes === null || endMinutes === null) {
    throw new RangeError('블록 시간이 올바르지 않습니다.')
  }

  return endMinutes - startMinutes
}

export const getBlockGridPlacement = (block: StudyBlock) => {
  const startMinutes = parseTimeToMinutes(block.startTime)
  const endMinutes = parseTimeToMinutes(block.endTime)

  if (startMinutes === null || endMinutes === null) {
    throw new RangeError('블록 시간이 올바르지 않습니다.')
  }

  return {
    top: ((startMinutes - plannerStartMinutes) / plannerTotalMinutes) * 100,
    height: ((endMinutes - startMinutes) / plannerTotalMinutes) * 100,
  }
}
