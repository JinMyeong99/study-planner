export const PLANNER_WEEKDAY_LABELS = [
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
  '일',
] as const

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const DAYS_IN_WEEK = 7

const createLocalDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day)

const assertValidLocalDate = (
  date: Date,
  year: number,
  month: number,
  day: number,
) => {
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new RangeError('올바른 날짜 형식이 아닙니다.')
  }
}

const padDatePart = (value: number) => String(value).padStart(2, '0')

const formatMonthDay = (date: Date) =>
  `${date.getMonth() + 1}월 ${date.getDate()}일`

const formatShortMonthDay = (date: Date) =>
  `${date.getMonth() + 1}/${date.getDate()}`

export const parseLocalDate = (value: string) => {
  const match = DATE_PATTERN.exec(value)

  if (!match) {
    throw new RangeError('날짜는 YYYY-MM-DD 형식이어야 합니다.')
  }

  const [, yearValue, monthValue, dayValue] = match
  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const date = createLocalDate(year, month, day)

  assertValidLocalDate(date, year, month, day)

  return date
}

export const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())

  return `${year}-${month}-${day}`
}

export const addWeeksToLocalDate = (value: string, amount: number) => {
  const date = parseLocalDate(value)

  date.setDate(date.getDate() + amount * DAYS_IN_WEEK)

  return formatLocalDate(date)
}

export const getWeekdayDateLabels = (weekStart: string) => {
  const startDate = parseLocalDate(weekStart)

  return PLANNER_WEEKDAY_LABELS.map((_, dayOffset) => {
    const date = new Date(startDate)

    date.setDate(startDate.getDate() + dayOffset)

    return formatShortMonthDay(date)
  })
}

export const getWeekStartDate = (date: Date) => {
  const weekStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  const daysSinceMonday = (weekStart.getDay() + 6) % DAYS_IN_WEEK

  weekStart.setDate(weekStart.getDate() - daysSinceMonday)

  return weekStart
}

export const getWeekDateRangeLabel = (weekStart: string) => {
  const startDate = parseLocalDate(weekStart)
  const endDate = new Date(startDate)

  endDate.setDate(startDate.getDate() + DAYS_IN_WEEK - 1)

  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getFullYear()}년 ${formatMonthDay(
      startDate,
    )} - ${formatMonthDay(endDate)}`
  }

  return `${startDate.getFullYear()}년 ${formatMonthDay(
    startDate,
  )} - ${endDate.getFullYear()}년 ${formatMonthDay(endDate)}`
}

export const formatDayOfWeek = (dayOfWeek: number) =>
  PLANNER_WEEKDAY_LABELS[dayOfWeek] ?? '알 수 없음'
