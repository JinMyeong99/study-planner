import type {
  Course,
  SavePlannerRequest,
  StudyBlock,
} from '../types'
import type { TimeConflictPair } from './conflict'
import { createCourseMap } from './blocks'
import { formatDayOfWeek } from './date'

const isDraftBlockId = (blockId: string) => blockId.startsWith('draft-')

export const formatBlockSummary = (
  block: StudyBlock,
  courseMap: Map<string, Course>,
) => {
  const courseTitle = courseMap.get(block.courseId)?.title ?? '알 수 없는 강의'

  return `${courseTitle}(${formatDayOfWeek(block.dayOfWeek)}요일 ${block.startTime} - ${block.endTime})`
}

export const createSavePlannerPayload = (
  weekStart: string,
  draftBlocks: StudyBlock[],
): SavePlannerRequest => ({
  weekStart,
  blocks: draftBlocks.map((block) => ({
    ...(isDraftBlockId(block.id) ? {} : { id: block.id }),
    courseId: block.courseId,
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    ...(block.memo ? { memo: block.memo } : {}),
  })),
})

export const getConflictBlockIds = (
  conflictPair: TimeConflictPair<StudyBlock> | null,
) => new Set(conflictPair?.map((block) => block.id) ?? [])

export const formatConflictMessage = (
  conflictPair: TimeConflictPair<StudyBlock>,
  courses: Course[],
) => {
  const courseMap = createCourseMap(courses)
  const [firstBlock, secondBlock] = conflictPair

  return `${formatBlockSummary(firstBlock, courseMap)}와 ${formatBlockSummary(
    secondBlock,
    courseMap,
  )} 시간이 겹칩니다.`
}
