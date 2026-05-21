import type { StudyBlock } from '../types'
import { getBlockDurationMinutes } from './grid'

export const calculateTotalMinutes = (blocks: StudyBlock[]): number =>
  blocks.reduce((sum, block) => sum + getBlockDurationMinutes(block), 0)

export const calculateMinutesByDay = (
  blocks: StudyBlock[],
): Map<number, number> => {
  const byDay = new Map<number, number>()

  for (const block of blocks) {
    const prev = byDay.get(block.dayOfWeek) ?? 0
    byDay.set(block.dayOfWeek, prev + getBlockDurationMinutes(block))
  }

  return byDay
}

export const calculateMinutesByCourse = (
  blocks: StudyBlock[],
): Map<string, number> => {
  const byCourse = new Map<string, number>()

  for (const block of blocks) {
    const prev = byCourse.get(block.courseId) ?? 0
    byCourse.set(block.courseId, prev + getBlockDurationMinutes(block))
  }

  return byCourse
}

export const formatStudyDuration = (minutes: number): string => {
  if (minutes === 0) return '0분'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}분`
  if (mins === 0) return `${hours}시간`
  return `${hours}시간 ${mins}분`
}
