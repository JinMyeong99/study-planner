import { describe, expect, it } from 'vitest'

import type { StudyBlock } from '../types'
import {
  createPlannerHourLabels,
  createPlannerTimeSlots,
  getBlockDurationMinutes,
  getBlockGridPlacement,
  PLANNER_GRID_SLOT_HEIGHT,
} from './grid'

const createStudyBlock = (
  startTime: string,
  endTime: string,
): StudyBlock => ({
  id: `${startTime}-${endTime}`,
  courseId: 'course-react',
  dayOfWeek: 0,
  startTime,
  endTime,
})

describe('planner grid utilities', () => {
  it('08:00부터 20:00 전까지 30분 슬롯 24개를 생성한다', () => {
    const slots = createPlannerTimeSlots()

    expect(slots).toHaveLength(24)
    expect(slots[0]).toBe('08:00')
    expect(slots.at(-1)).toBe('19:30')
  })

  it('08:00부터 20:00까지 1시간 단위 라벨을 생성한다', () => {
    const labels = createPlannerHourLabels()

    expect(labels).toHaveLength(13)
    expect(labels[0]).toBe('08:00')
    expect(labels).toContain('12:00')
    expect(labels.at(-1)).toBe('20:00')
  })

  it('블록의 학습 시간을 분 단위로 계산한다', () => {
    expect(getBlockDurationMinutes(createStudyBlock('14:00', '16:00'))).toBe(
      120,
    )
  })

  it('블록의 시작 위치와 높이를 30분 슬롯 높이 기준 px 값으로 계산한다', () => {
    const placement = getBlockGridPlacement(createStudyBlock('09:00', '10:30'))

    expect(placement.top).toBe(2 * PLANNER_GRID_SLOT_HEIGHT)
    expect(placement.height).toBe(3 * PLANNER_GRID_SLOT_HEIGHT)
    expect(placement.durationMinutes).toBe(90)
  })

  it('늦은 시간대 블록도 누적 오차 없이 슬롯 위치로 계산한다', () => {
    expect(getBlockGridPlacement(createStudyBlock('13:00', '13:30'))).toEqual({
      durationMinutes: 30,
      height: 1 * PLANNER_GRID_SLOT_HEIGHT,
      top: 10 * PLANNER_GRID_SLOT_HEIGHT,
    })
    expect(getBlockGridPlacement(createStudyBlock('16:00', '17:30'))).toEqual({
      durationMinutes: 90,
      height: 3 * PLANNER_GRID_SLOT_HEIGHT,
      top: 16 * PLANNER_GRID_SLOT_HEIGHT,
    })
  })
})
