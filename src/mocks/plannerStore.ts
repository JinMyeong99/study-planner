import type {
  Course,
  PlannerResponse,
  SavePlannerRequest,
  SavePlannerResponse,
  StudyBlock,
} from '../features/planner/types'

const mockCourses: Course[] = [
  {
    id: 'course-react',
    title: 'React 상태 관리',
    color: '#4A90D9',
  },
  {
    id: 'course-typescript',
    title: 'TypeScript 기초',
    color: '#F5A623',
  },
  {
    id: 'course-algorithm',
    title: '알고리즘 문제 풀이',
    color: '#7ED321',
  },
  {
    id: 'course-database',
    title: '데이터베이스 설계',
    color: '#BD10E0',
  },
]

const initialPlannerBlocksByWeek = new Map<string, StudyBlock[]>([
  [
    '2026-05-18',
    [
      {
        id: 'block-1',
        courseId: 'course-react',
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '10:30',
        memo: '상태와 서버 상태 분리 복습',
      },
      {
        id: 'block-2',
        courseId: 'course-typescript',
        dayOfWeek: 2,
        startTime: '14:00',
        endTime: '16:00',
        memo: '타입 좁히기 예제 풀이',
      },
    ],
  ],
])

const cloneBlock = (block: StudyBlock): StudyBlock => ({ ...block })

function clonePlannerMap(source: Map<string, StudyBlock[]>) {
  return new Map(
    Array.from(source.entries()).map(([weekStart, blocks]) => [
      weekStart,
      blocks.map(cloneBlock),
    ]),
  )
}

let plannerBlocksByWeek = clonePlannerMap(initialPlannerBlocksByWeek)
let nextBlockId = 3

const createBlockId = () => {
  const id = `block-${nextBlockId}`
  nextBlockId += 1
  return id
}

export const resetPlannerStore = () => {
  plannerBlocksByWeek = clonePlannerMap(initialPlannerBlocksByWeek)
  nextBlockId = 3
}

export const getStoredCourses = (): Course[] =>
  mockCourses.map((course) => ({ ...course }))

export const hasStoredCourse = (courseId: string) =>
  mockCourses.some((course) => course.id === courseId)

export const getStoredPlanner = (weekStart: string): PlannerResponse => ({
  weekStart,
  blocks: (plannerBlocksByWeek.get(weekStart) ?? []).map(cloneBlock),
})

export const saveStoredPlanner = ({
  weekStart,
  blocks,
}: SavePlannerRequest): SavePlannerResponse => {
  const savedBlocks = blocks.map<StudyBlock>((block) => ({
    id: block.id ?? createBlockId(),
    courseId: block.courseId,
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    ...(block.memo ? { memo: block.memo } : {}),
  }))

  plannerBlocksByWeek.set(weekStart, savedBlocks)

  return {
    weekStart,
    blocks: savedBlocks.map(cloneBlock),
  }
}
