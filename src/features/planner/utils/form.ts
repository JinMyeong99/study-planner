import type { PlannerBlockFormValues, StudyBlock } from '../types'
import { getNextPlannerSlotTime } from './time'

export const createFormValuesFromBlock = (
  block: StudyBlock,
): PlannerBlockFormValues => ({
  courseId: block.courseId,
  dayOfWeek: block.dayOfWeek,
  startTime: block.startTime,
  endTime: block.endTime,
  memo: block.memo ?? '',
})

export const createFormValuesFromSlot = ({
  dayOfWeek,
  startTime,
}: {
  dayOfWeek: number
  startTime: string
}): PlannerBlockFormValues => ({
  courseId: '',
  dayOfWeek,
  startTime,
  endTime: getNextPlannerSlotTime(startTime),
  memo: '',
})

export const getMemoPayload = (memo: string) => {
  const trimmedMemo = memo.trim()

  return trimmedMemo ? { memo: trimmedMemo } : {}
}
