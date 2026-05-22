import type { Course, StudyBlock } from '../types'
import type { PlannerBlockFormValues } from '../PlannerBlockModal'
import { areBlocksOverlapping } from './conflict'
import { createCourseMap } from './course'
import { formatDayOfWeek } from './date'
import { isValidPlannerTimeRange } from './time'

export const MAX_MEMO_LENGTH = 200

const findConflictBlock = (
  candidate: PlannerBlockFormValues,
  blocks: StudyBlock[],
  editingBlockId?: string,
) =>
  blocks.find(
    (block) =>
      block.id !== editingBlockId &&
      areBlocksOverlapping(candidate, block),
  ) ?? null

export const getValidationMessage = ({
  blocks,
  courses,
  editingBlockId,
  values,
}: {
  blocks: StudyBlock[]
  courses: Course[]
  editingBlockId?: string
  values: PlannerBlockFormValues
}) => {
  if (!courses.some((course) => course.id === values.courseId)) {
    return '강의를 선택해 주세요.'
  }

  if (
    !Number.isInteger(values.dayOfWeek) ||
    values.dayOfWeek < 0 ||
    values.dayOfWeek > 6
  ) {
    return '요일을 선택해 주세요.'
  }

  if (!isValidPlannerTimeRange(values.startTime, values.endTime)) {
    return '종료 시간은 시작 시간보다 늦어야 합니다.'
  }

  if (values.memo.length > MAX_MEMO_LENGTH) {
    return `메모는 ${MAX_MEMO_LENGTH}자 이하로 입력해 주세요.`
  }

  const courseMap = createCourseMap(courses)
  const conflictBlock = findConflictBlock(values, blocks, editingBlockId)

  if (conflictBlock) {
    const courseTitle =
      courseMap.get(conflictBlock.courseId)?.title ?? '알 수 없는 강의'

    return `${courseTitle}(${formatDayOfWeek(conflictBlock.dayOfWeek)}요일 ${conflictBlock.startTime} - ${conflictBlock.endTime})와 시간이 겹칩니다.`
  }

  return null
}
