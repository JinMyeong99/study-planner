import { describe, expect, it } from 'vitest'

import type { StudyBlock } from '../types'
import {
  calculateMinutesByCourse,
  calculateMinutesByDay,
  calculateTotalMinutes,
  formatStudyDuration,
} from './summary'

const makeBlock = (
  overrides: Partial<StudyBlock> & {
    startTime: string
    endTime: string
    dayOfWeek: number
    courseId: string
  },
): StudyBlock => ({
  id: 'test-id',
  memo: '',
  ...overrides,
})

describe('calculateTotalMinutes', () => {
  it('빈 배열이면 0을 반환한다', () => {
    expect(calculateTotalMinutes([])).toBe(0)
  })

  it('단일 블록의 분을 반환한다', () => {
    const block = makeBlock({ courseId: 'c1', dayOfWeek: 0, startTime: '09:00', endTime: '10:30' })
    expect(calculateTotalMinutes([block])).toBe(90)
  })

  it('여러 블록의 분을 합산한다', () => {
    const blocks = [
      makeBlock({ courseId: 'c1', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' }),
      makeBlock({ courseId: 'c2', dayOfWeek: 1, startTime: '14:00', endTime: '15:30' }),
    ]
    expect(calculateTotalMinutes(blocks)).toBe(150)
  })
})

describe('calculateMinutesByDay', () => {
  it('빈 배열이면 빈 Map을 반환한다', () => {
    expect(calculateMinutesByDay([])).toEqual(new Map())
  })

  it('요일별로 분을 합산한다', () => {
    const blocks = [
      makeBlock({ courseId: 'c1', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' }),
      makeBlock({ courseId: 'c1', dayOfWeek: 0, startTime: '11:00', endTime: '11:30' }),
      makeBlock({ courseId: 'c2', dayOfWeek: 2, startTime: '14:00', endTime: '15:00' }),
    ]
    const result = calculateMinutesByDay(blocks)
    expect(result.get(0)).toBe(90)
    expect(result.get(2)).toBe(60)
    expect(result.get(1)).toBeUndefined()
  })
})

describe('calculateMinutesByCourse', () => {
  it('빈 배열이면 빈 Map을 반환한다', () => {
    expect(calculateMinutesByCourse([])).toEqual(new Map())
  })

  it('강의별로 분을 합산한다', () => {
    const blocks = [
      makeBlock({ courseId: 'react', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' }),
      makeBlock({ courseId: 'react', dayOfWeek: 1, startTime: '11:00', endTime: '12:00' }),
      makeBlock({ courseId: 'ts', dayOfWeek: 2, startTime: '14:00', endTime: '15:30' }),
    ]
    const result = calculateMinutesByCourse(blocks)
    expect(result.get('react')).toBe(120)
    expect(result.get('ts')).toBe(90)
  })
})

describe('formatStudyDuration', () => {
  it('0분을 포맷한다', () => {
    expect(formatStudyDuration(0)).toBe('0분')
  })

  it('분만 있는 경우를 포맷한다', () => {
    expect(formatStudyDuration(30)).toBe('30분')
  })

  it('시간만 있는 경우를 포맷한다', () => {
    expect(formatStudyDuration(60)).toBe('1시간')
  })

  it('시간과 분이 모두 있는 경우를 포맷한다', () => {
    expect(formatStudyDuration(90)).toBe('1시간 30분')
  })

  it('여러 시간을 포맷한다', () => {
    expect(formatStudyDuration(150)).toBe('2시간 30분')
  })
})
