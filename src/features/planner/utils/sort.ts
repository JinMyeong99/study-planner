import type { StudyBlock } from '../types'

export const sortPlannerBlocks = (blocks: StudyBlock[]) =>
  [...blocks].sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime),
  )
