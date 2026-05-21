export const PLANNER_START_TIME = '08:00'
export const PLANNER_END_TIME = '20:00'
export const PLANNER_SLOT_MINUTES = 30
export const PLANNER_MINUTES_PER_HOUR = 60

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export const parseTimeToMinutes = (time: string): number | null => {
  const match = TIME_PATTERN.exec(time)

  if (!match) {
    return null
  }

  const [, hours, minutes] = match

  return Number(hours) * PLANNER_MINUTES_PER_HOUR + Number(minutes)
}

export const formatMinutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / PLANNER_MINUTES_PER_HOUR)
  const restMinutes = minutes % PLANNER_MINUTES_PER_HOUR

  return `${String(hours).padStart(2, '0')}:${String(restMinutes).padStart(
    2,
    '0',
  )}`
}

export const plannerStartMinutes = parseTimeToMinutes(PLANNER_START_TIME)!
export const plannerEndMinutes = parseTimeToMinutes(PLANNER_END_TIME)!

export const isValidTimeString = (time: string) =>
  parseTimeToMinutes(time) !== null

export const isThirtyMinuteStep = (time: string) => {
  const minutes = parseTimeToMinutes(time)

  return minutes !== null && minutes % PLANNER_SLOT_MINUTES === 0
}

export const isWithinPlannerHours = (time: string) => {
  const minutes = parseTimeToMinutes(time)

  return (
    minutes !== null &&
    minutes >= plannerStartMinutes &&
    minutes <= plannerEndMinutes
  )
}

export const isValidPlannerTime = (time: string) =>
  isValidTimeString(time) &&
  isThirtyMinuteStep(time) &&
  isWithinPlannerHours(time)

export const isEndAfterStart = (startTime: string, endTime: string) => {
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)

  return (
    startMinutes !== null &&
    endMinutes !== null &&
    endMinutes > startMinutes
  )
}

export const isValidPlannerTimeRange = (
  startTime: string,
  endTime: string,
) =>
  isValidPlannerTime(startTime) &&
  isValidPlannerTime(endTime) &&
  isEndAfterStart(startTime, endTime)

export const getNextPlannerSlotTime = (time: string) => {
  const minutes = parseTimeToMinutes(time)

  if (minutes === null) {
    return time
  }

  return formatMinutesToTime(
    Math.min(minutes + PLANNER_SLOT_MINUTES, plannerEndMinutes),
  )
}
