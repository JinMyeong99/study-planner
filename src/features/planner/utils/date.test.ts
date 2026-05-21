import { describe, expect, it } from 'vitest'

import {
  formatDayOfWeek,
  formatLocalDate,
  getWeekDateRangeLabel,
  getWeekStartDate,
  parseLocalDate,
} from './date'

describe('planner date utils', () => {
  it('월요일 날짜는 같은 날짜를 주 시작일로 계산한다', () => {
    const date = new Date(2026, 4, 18)

    expect(formatLocalDate(getWeekStartDate(date))).toBe('2026-05-18')
  })

  it('일요일 날짜는 직전 월요일을 주 시작일로 계산한다', () => {
    const date = new Date(2026, 4, 24)

    expect(formatLocalDate(getWeekStartDate(date))).toBe('2026-05-18')
  })

  it('로컬 날짜를 YYYY-MM-DD 형식으로 변환한다', () => {
    const date = new Date(2026, 0, 5)

    expect(formatLocalDate(date)).toBe('2026-01-05')
  })

  it('YYYY-MM-DD 값을 로컬 날짜로 파싱한다', () => {
    const date = parseLocalDate('2026-05-18')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(4)
    expect(date.getDate()).toBe(18)
  })

  it('주간 범위 라벨을 월요일부터 일요일까지 표시한다', () => {
    expect(getWeekDateRangeLabel('2026-05-18')).toBe(
      '2026년 5월 18일 - 5월 24일',
    )
  })

  it('플래너 요일 번호를 월요일 기준 라벨로 변환한다', () => {
    expect(formatDayOfWeek(0)).toBe('월')
    expect(formatDayOfWeek(6)).toBe('일')
  })
})
