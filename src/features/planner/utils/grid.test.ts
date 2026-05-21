import { describe, expect, it } from 'vitest'

import type { StudyBlock } from '../types'
import {
  createPlannerHourLabels,
  createPlannerTimeSlots,
  getBlockDurationMinutes,
  getBlockGridPlacement,
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

  it('블록의 시작 위치와 높이를 전체 그리드 비율로 계산한다', () => {
    const placement = getBlockGridPlacement(createStudyBlock('09:00', '10:30'))

    expect(placement.top).toBeCloseTo((60 / 720) * 100)
    expect(placement.height).toBeCloseTo((90 / 720) * 100)
  })
})
