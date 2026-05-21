import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../mocks/server'
import { getCourses, getPlanner, savePlanner } from './api'

describe('planner API', () => {
  it('강의 목록을 조회한다', async () => {
    const response = await getCourses()

    expect(response.courses.length).toBeGreaterThan(0)
    expect(response.courses[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        color: expect.any(String),
      }),
    )
  })

  it('저장된 블록이 없는 주차는 빈 배열을 반환한다', async () => {
    await expect(getPlanner('2099-01-04')).resolves.toEqual({
      weekStart: '2099-01-04',
      blocks: [],
    })
  })

  it('신규 블록을 저장하면 서버가 id를 생성해 반환한다', async () => {
    const response = await savePlanner({
      weekStart: '2099-01-04',
      blocks: [
        {
          courseId: 'course-react',
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '10:00',
          memo: '서버 상태 분리 복습',
        },
      ],
    })

    expect(response.blocks).toHaveLength(1)
    expect(response.blocks[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        courseId: 'course-react',
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '10:00',
      }),
    )
  })

  it('잘못된 블록 데이터는 INVALID_BLOCK 에러를 반환한다', async () => {
    await expect(
      savePlanner({
        weekStart: '2099-01-04',
        blocks: [
          {
            courseId: 'unknown-course',
            dayOfWeek: 0,
            startTime: '09:00',
            endTime: '10:00',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_BLOCK',
      status: 400,
    })
  })

  it('종료 시간이 시작 시간보다 빠르면 INVALID_TIME_RANGE 에러를 반환한다', async () => {
    await expect(
      savePlanner({
        weekStart: '2099-01-04',
        blocks: [
          {
            courseId: 'course-react',
            dayOfWeek: 0,
            startTime: '10:00',
            endTime: '09:00',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_TIME_RANGE',
      status: 400,
    })
  })

  it('같은 요일의 겹치는 블록은 TIME_CONFLICT 에러를 반환한다', async () => {
    await expect(
      savePlanner({
        weekStart: '2099-01-04',
        blocks: [
          {
            courseId: 'course-react',
            dayOfWeek: 0,
            startTime: '09:00',
            endTime: '10:30',
          },
          {
            courseId: 'course-typescript',
            dayOfWeek: 0,
            startTime: '10:00',
            endTime: '11:00',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'TIME_CONFLICT',
      status: 409,
    })
  })

  it('JSON이 아닌 API 응답은 명확한 에러로 변환한다', async () => {
    server.use(
      http.get('/api/planner', () =>
        new HttpResponse('<!doctype html><html lang="ko"></html>', {
          headers: {
            'Content-Type': 'text/html',
          },
        }),
      ),
    )

    await expect(getPlanner('2099-01-04')).rejects.toThrow(
      'API 응답이 JSON 형식이 아닙니다.',
    )
    await expect(getPlanner('2099-01-04')).rejects.not.toThrow(
      "Unexpected token '<'",
    )
  })
})
