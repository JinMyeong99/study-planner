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

const STORAGE_KEY = 'planner-mock-store'

const initialPlannerBlocksByWeek = new Map<string, StudyBlock[]>()

const cloneBlock = (block: StudyBlock): StudyBlock => ({ ...block })

function clonePlannerMap(source: Map<string, StudyBlock[]>) {
  return new Map(
    Array.from(source.entries()).map(([weekStart, blocks]) => [
      weekStart,
      blocks.map(cloneBlock),
    ]),
  )
}

const serializeStore = (map: Map<string, StudyBlock[]>): string =>
  JSON.stringify(Array.from(map.entries()))

const deserializeStore = (raw: string): Map<string, StudyBlock[]> => {
  try {
    const entries = JSON.parse(raw) as [string, StudyBlock[]][]
    return new Map(entries)
  } catch {
    return new Map()
  }
}

const stored = localStorage.getItem(STORAGE_KEY)
let plannerBlocksByWeek = stored
  ? deserializeStore(stored)
  : clonePlannerMap(initialPlannerBlocksByWeek)
let nextBlockId = 1

const createBlockId = () => {
  const id = `block-${nextBlockId}`
  nextBlockId += 1
  return id
}

export const resetPlannerStore = () => {
  plannerBlocksByWeek = clonePlannerMap(initialPlannerBlocksByWeek)
  nextBlockId = 1
  localStorage.removeItem(STORAGE_KEY)
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
  localStorage.setItem(STORAGE_KEY, serializeStore(plannerBlocksByWeek))

  return {
    weekStart,
    blocks: savedBlocks.map(cloneBlock),
  }
}
