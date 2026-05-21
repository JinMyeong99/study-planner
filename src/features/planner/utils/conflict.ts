import { parseTimeToMinutes } from './time'

export interface TimeBlockLike {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export type TimeConflictPair<T extends TimeBlockLike> = [T, T]

export const areBlocksOverlapping = (
  firstBlock: TimeBlockLike,
  secondBlock: TimeBlockLike,
) => {
  if (firstBlock.dayOfWeek !== secondBlock.dayOfWeek) {
    return false
  }

  const firstStart = parseTimeToMinutes(firstBlock.startTime)
  const firstEnd = parseTimeToMinutes(firstBlock.endTime)
  const secondStart = parseTimeToMinutes(secondBlock.startTime)
  const secondEnd = parseTimeToMinutes(secondBlock.endTime)

  if (
    firstStart === null ||
    firstEnd === null ||
    secondStart === null ||
    secondEnd === null
  ) {
    return false
  }

  return firstStart < secondEnd && secondStart < firstEnd
}

export const findFirstTimeConflict = <T extends TimeBlockLike>(
  blocks: T[],
): TimeConflictPair<T> | null => {
  for (let outerIndex = 0; outerIndex < blocks.length; outerIndex += 1) {
    for (
      let innerIndex = outerIndex + 1;
      innerIndex < blocks.length;
      innerIndex += 1
    ) {
      const firstBlock = blocks[outerIndex]
      const secondBlock = blocks[innerIndex]

      if (areBlocksOverlapping(firstBlock, secondBlock)) {
        return [firstBlock, secondBlock]
      }
    }
  }

  return null
}
