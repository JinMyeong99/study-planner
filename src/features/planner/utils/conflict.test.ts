import { describe, expect, it } from 'vitest'

import { areBlocksOverlapping, findFirstTimeConflict } from './conflict'

describe('planner conflict utilities', () => {
  it('인접한 시간 블록은 충돌이 아니다', () => {
    expect(
      areBlocksOverlapping(
        { dayOfWeek: 0, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 0, startTime: '10:00', endTime: '11:00' },
      ),
    ).toBe(false)
  })

  it('같은 요일에서 겹치는 시간 블록은 충돌이다', () => {
    expect(
      areBlocksOverlapping(
        { dayOfWeek: 0, startTime: '09:00', endTime: '10:30' },
        { dayOfWeek: 0, startTime: '10:00', endTime: '11:00' },
      ),
    ).toBe(true)
  })

  it('다른 요일의 같은 시간 블록은 충돌이 아니다', () => {
    expect(
      areBlocksOverlapping(
        { dayOfWeek: 0, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
      ),
    ).toBe(false)
  })

  it('첫 번째 충돌 쌍을 반환한다', () => {
    const blocks = [
      { id: 'block-1', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' },
      { id: 'block-2', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
      { id: 'block-3', dayOfWeek: 1, startTime: '09:30', endTime: '10:30' },
    ]

    expect(findFirstTimeConflict(blocks)).toEqual([blocks[1], blocks[2]])
  })
})
