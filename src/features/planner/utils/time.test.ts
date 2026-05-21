import { describe, expect, it } from 'vitest'

import {
  getNextPlannerSlotTime,
  isEndAfterStart,
  isThirtyMinuteStep,
  isValidPlannerTime,
  isValidPlannerTimeRange,
  parseTimeToMinutes,
} from './time'

describe('planner time utilities', () => {
  it('HH:mm 시간을 분 단위로 변환한다', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570)
  })

  it('잘못된 시간 형식은 null을 반환한다', () => {
    expect(parseTimeToMinutes('24:00')).toBeNull()
    expect(parseTimeToMinutes('09:5')).toBeNull()
  })

  it('30분 단위가 아닌 시간은 invalid로 판단한다', () => {
    expect(isThirtyMinuteStep('09:15')).toBe(false)
    expect(isThirtyMinuteStep('09:30')).toBe(true)
  })

  it('플래너 시간 범위는 08:00부터 20:00까지 허용한다', () => {
    expect(isValidPlannerTime('07:30')).toBe(false)
    expect(isValidPlannerTime('08:00')).toBe(true)
    expect(isValidPlannerTime('20:00')).toBe(true)
    expect(isValidPlannerTime('20:30')).toBe(false)
  })

  it('종료 시간이 시작 시간보다 늦어야 valid range로 판단한다', () => {
    expect(isEndAfterStart('09:00', '10:00')).toBe(true)
    expect(isEndAfterStart('09:00', '09:00')).toBe(false)
    expect(isEndAfterStart('10:00', '09:00')).toBe(false)
  })

  it('플래너 시간 범위와 종료 시간 조건을 함께 검증한다', () => {
    expect(isValidPlannerTimeRange('09:00', '10:30')).toBe(true)
    expect(isValidPlannerTimeRange('09:15', '10:00')).toBe(false)
    expect(isValidPlannerTimeRange('09:00', '09:00')).toBe(false)
  })

  it('다음 30분 슬롯 시간을 계산하되 종료 범위를 넘기지 않는다', () => {
    expect(getNextPlannerSlotTime('10:30')).toBe('11:00')
    expect(getNextPlannerSlotTime('19:30')).toBe('20:00')
  })
})
