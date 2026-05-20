import { http, HttpResponse } from 'msw'

import { findFirstTimeConflict } from '../features/planner/utils/conflict'
import { isEndAfterStart, isValidPlannerTime } from '../features/planner/utils/time'
import type {
  CourseListResponse,
  ErrorResponse,
  PlannerResponse,
  SavePlannerBlock,
  SavePlannerRequest,
  SavePlannerResponse,
} from '../features/planner/types'
import {
  getStoredCourses,
  getStoredPlanner,
  hasStoredCourse,
  saveStoredPlanner,
} from './plannerStore'

type SavePlannerValidationResult =
  | { ok: true; request: SavePlannerRequest }
  | { ok: false; error: ErrorResponse }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const createErrorResponse = (
  code: ErrorResponse['code'],
  message: string,
  status: number,
) => HttpResponse.json({ code, message } satisfies ErrorResponse, { status })

const isSavePlannerBlock = (value: unknown): value is SavePlannerBlock => {
  if (!isRecord(value)) {
    return false
  }

  return (
    (typeof value.id === 'string' || value.id === undefined) &&
    typeof value.courseId === 'string' &&
    typeof value.dayOfWeek === 'number' &&
    Number.isInteger(value.dayOfWeek) &&
    typeof value.startTime === 'string' &&
    typeof value.endTime === 'string' &&
    (typeof value.memo === 'string' || value.memo === undefined)
  )
}

const isSavePlannerRequest = (value: unknown): value is SavePlannerRequest =>
  isRecord(value) &&
  typeof value.weekStart === 'string' &&
  Array.isArray(value.blocks) &&
  value.blocks.every(isSavePlannerBlock)

const isValidSaveBlock = (block: SavePlannerBlock) =>
  hasStoredCourse(block.courseId) &&
  block.dayOfWeek >= 0 &&
  block.dayOfWeek <= 6 &&
  isValidPlannerTime(block.startTime) &&
  isValidPlannerTime(block.endTime) &&
  (block.memo?.length ?? 0) <= 200

const validateSavePlannerRequest = (
  body: unknown,
): SavePlannerValidationResult => {
  if (!isSavePlannerRequest(body) || body.weekStart.trim() === '') {
    return {
      ok: false,
      error: {
        code: 'INVALID_BLOCK',
        message: '플래너 저장 요청 형식이 올바르지 않습니다.',
      },
    }
  }

  const hasInvalidBlock = body.blocks.some((block) => !isValidSaveBlock(block))

  if (hasInvalidBlock) {
    return {
      ok: false,
      error: {
        code: 'INVALID_BLOCK',
        message: '블록 데이터가 올바르지 않습니다.',
      },
    }
  }

  const hasInvalidTimeRange = body.blocks.some(
    (block) => !isEndAfterStart(block.startTime, block.endTime),
  )

  if (hasInvalidTimeRange) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TIME_RANGE',
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
      },
    }
  }

  if (findFirstTimeConflict(body.blocks)) {
    return {
      ok: false,
      error: {
        code: 'TIME_CONFLICT',
        message: '같은 요일에 겹치는 학습 블록이 있습니다.',
      },
    }
  }

  return { ok: true, request: body }
}

export const plannerHandlers = [
  http.get('/api/courses', () =>
    HttpResponse.json<CourseListResponse>({
      courses: getStoredCourses(),
    }),
  ),

  http.get('/api/planner', ({ request }) => {
    const url = new URL(request.url)
    const weekStart = url.searchParams.get('weekStart')

    if (!weekStart) {
      return createErrorResponse(
        'INVALID_BLOCK',
        'weekStart 쿼리 파라미터가 필요합니다.',
        400,
      )
    }

    return HttpResponse.json(getStoredPlanner(weekStart) satisfies PlannerResponse)
  }),

  http.put('/api/planner', async ({ request }) => {
    const body = await request.json()
    const validationResult = validateSavePlannerRequest(body)

    if (!validationResult.ok) {
      const status = validationResult.error.code === 'TIME_CONFLICT' ? 409 : 400

      return createErrorResponse(
        validationResult.error.code,
        validationResult.error.message,
        status,
      )
    }

    return HttpResponse.json(
      saveStoredPlanner(validationResult.request) satisfies SavePlannerResponse,
    )
  }),
]
