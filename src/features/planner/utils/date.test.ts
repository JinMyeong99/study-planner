import { describe, expect, it } from 'vitest'

import {
  addWeeksToLocalDate,
  formatDayOfWeek,
  formatLocalDate,
  getWeekDateRangeLabel,
  getWeekStartDate,
  getWeekdayDateLabels,
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

  it('주 시작일을 주 단위로 이동한다', () => {
    expect(addWeeksToLocalDate('2026-05-18', -1)).toBe('2026-05-11')
    expect(addWeeksToLocalDate('2026-05-18', 1)).toBe('2026-05-25')
    expect(addWeeksToLocalDate('2026-12-28', 1)).toBe('2027-01-04')
  })

  it('주간 요일별 날짜 라벨을 계산한다', () => {
    expect(getWeekdayDateLabels('2026-05-18')).toEqual([
      '5/18',
      '5/19',
      '5/20',
      '5/21',
      '5/22',
      '5/23',
      '5/24',
    ])
    expect(getWeekdayDateLabels('2026-12-28')).toEqual([
      '12/28',
      '12/29',
      '12/30',
      '12/31',
      '1/1',
      '1/2',
      '1/3',
    ])
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
