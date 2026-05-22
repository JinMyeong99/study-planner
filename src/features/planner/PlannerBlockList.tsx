import './PlannerBlockList.css'
import type { Course, StudyBlock } from './types'
import { createCourseMap } from './utils/course'
import { formatDayOfWeek } from './utils/date'
import { sortPlannerBlocks } from './utils/sort'

interface PlannerBlockListProps {
  blocks: StudyBlock[]
  conflictBlockIds?: Set<string>
  courses: Course[]
  onBlockSelect: (block: StudyBlock) => void
}

export const PlannerBlockList = ({
  blocks,
  conflictBlockIds = new Set<string>(),
  courses,
  onBlockSelect,
}: PlannerBlockListProps) => {
  if (blocks.length === 0) {
    return (
      <div className="planner-empty-state">
        <strong>강의를 추가해 주세요.</strong>
      </div>
    )
  }

  const courseMap = createCourseMap(courses)
  const sortedBlocks = sortPlannerBlocks(blocks)

  return (
    <ul className="planner-block-list">
      {sortedBlocks.map((block) => {
        const course = courseMap.get(block.courseId)
        const hasConflict = conflictBlockIds.has(block.id)

        return (
          <li key={block.id}>
            <button
              aria-label={`${course?.title ?? '알 수 없는 강의'} ${formatDayOfWeek(block.dayOfWeek)}요일 ${block.startTime} - ${block.endTime} 편집`}
              className={
                hasConflict
                  ? 'planner-block-card is-conflict'
                  : 'planner-block-card'
              }
              onClick={() => {
                onBlockSelect(block)
              }}
              type="button"
            >
              <span
                aria-hidden="true"
                className="planner-block-card__color"
                style={{ backgroundColor: course?.color ?? '#8f97a8' }}
              />
              <span className="planner-block-card__content">
                <strong>{course?.title ?? '알 수 없는 강의'}</strong>
                <span>
                  {formatDayOfWeek(block.dayOfWeek)}요일 · {block.startTime} -{' '}
                  {block.endTime}
                </span>
                {hasConflict ? (
                  <em className="planner-conflict-badge">시간 충돌</em>
                ) : null}
                {block.memo ? <p>{block.memo}</p> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
