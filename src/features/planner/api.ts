import type {
  CourseListResponse,
  ErrorResponse,
  PlannerErrorCode,
  PlannerResponse,
  SavePlannerRequest,
  SavePlannerResponse,
} from './types'

export class PlannerApiError extends Error {
  code: PlannerErrorCode
  status: number

  constructor(error: ErrorResponse, status: number) {
    super(error.message)
    this.name = 'PlannerApiError'
    this.code = error.code
    this.status = status
  }
}

const getApiBaseUrl = () => globalThis.location?.origin ?? 'http://localhost'

const createApiUrl = (
  pathname: string,
  searchParams?: Record<string, string>,
) => {
  const url = new URL(pathname, getApiBaseUrl())

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return url
}

const isErrorResponse = (value: unknown): value is ErrorResponse =>
  typeof value === 'object' &&
  value !== null &&
  'code' in value &&
  'message' in value &&
  typeof value.code === 'string' &&
  typeof value.message === 'string'

const isJsonContentType = (contentType: string | null) => {
  const normalizedContentType = contentType?.toLowerCase() ?? ''

  return (
    normalizedContentType.includes('application/json') ||
    normalizedContentType.includes('+json')
  )
}

const readJsonResponse = async (response: Response) => {
  if (!isJsonContentType(response.headers.get('content-type'))) {
    const responsePreview = (await response.text()).trim().slice(0, 80)
    const suffix = responsePreview ? ` 응답 시작: ${responsePreview}` : ''

    throw new Error(`API 응답이 JSON 형식이 아닙니다.${suffix}`)
  }

  return (await response.json()) as unknown
}

const requestJson = async <T>(
  pathname: string,
  init?: RequestInit,
  searchParams?: Record<string, string>,
): Promise<T> => {
  const response = await fetch(createApiUrl(pathname, searchParams), init)
  const data = await readJsonResponse(response)

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new PlannerApiError(data, response.status)
    }

    throw new Error('API 요청에 실패했습니다.')
  }

  return data as T
}

export const getCourses = async () =>
  requestJson<CourseListResponse>('/api/courses')

export const getPlanner = async (weekStart: string) =>
  requestJson<PlannerResponse>('/api/planner', undefined, { weekStart })

export const savePlanner = async (request: SavePlannerRequest) =>
  requestJson<SavePlannerResponse>('/api/planner', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
