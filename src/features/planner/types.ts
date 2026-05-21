export interface Course {
  id: string
  title: string
  color: string
}

export interface CourseListResponse {
  courses: Course[]
}

export interface StudyBlock {
  id: string
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  memo?: string
}

export interface PlannerResponse {
  weekStart: string
  blocks: StudyBlock[]
}

export interface SavePlannerBlock {
  id?: string
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  memo?: string
}

export interface SavePlannerRequest {
  weekStart: string
  blocks: SavePlannerBlock[]
}

export interface SavePlannerResponse {
  weekStart: string
  blocks: StudyBlock[]
}

export type PlannerErrorCode =
  | 'TIME_CONFLICT'
  | 'INVALID_TIME_RANGE'
  | 'INVALID_BLOCK'

export interface ErrorResponse {
  code: PlannerErrorCode
  message: string
}
