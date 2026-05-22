import { useMemo } from 'react'

import './PlannerSummary.css'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { Course, StudyBlock } from '../types'
import { formatDayOfWeek } from '../utils/date'
import {
  calculateMinutesByCourse,
  calculateMinutesByDay,
  calculateTotalMinutes,
  formatStudyDuration,
} from '../utils/summary'

interface PlannerSummaryProps {
  blocks: StudyBlock[]
  courses: Course[]
}

export const PlannerSummary = ({ blocks, courses }: PlannerSummaryProps) => {
  const totalMinutes = useMemo(() => calculateTotalMinutes(blocks), [blocks])
  const minutesByDay = useMemo(() => calculateMinutesByDay(blocks), [blocks])
  const minutesByCourse = useMemo(
    () => calculateMinutesByCourse(blocks),
    [blocks],
  )

  const activeDays = [0, 1, 2, 3, 4, 5, 6].filter((day) => minutesByDay.has(day))
  const activeCourses = courses.filter((c) => minutesByCourse.has(c.id))

  const courseChartData = useMemo(
    () =>
      activeCourses.map((course) => ({
        name: course.title,
        minutes: minutesByCourse.get(course.id) ?? 0,
        fill: course.color,
      })),
    [activeCourses, minutesByCourse],
  )

  const dayChartData = useMemo(
    () =>
      activeDays.map((day) => ({
        name: formatDayOfWeek(day),
        minutes: minutesByDay.get(day) ?? 0,
      })),
    [activeDays, minutesByDay],
  )

  return (
    <section className="planner-summary" aria-labelledby="planner-summary-title">
      <div className="planner-panel__header">
        <h2 id="planner-summary-title">주간 스케줄 요약</h2>
        <span className="planner-summary__total">
          총 {formatStudyDuration(totalMinutes)}
        </span>
      </div>

      {blocks.length === 0 && (
        <p className="planner-summary__empty">
          이번 주 등록된 강의가 없습니다.
        </p>
      )}
      {blocks.length > 0 && (
        <div className="planner-summary__grid">
          <div>
            <h3 className="planner-summary__label">강의별</h3>
            <div className="planner-summary__chart">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={courseChartData}
                    dataKey="minutes"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {courseChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      typeof value === 'number'
                        ? formatStudyDuration(value)
                        : '',
                      '학습 시간',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="planner-summary__list">
              {activeCourses.map((course) => {
                const minutes = minutesByCourse.get(course.id) ?? 0
                return (
                  <li key={course.id} className="planner-summary__item">
                    <span
                      aria-hidden="true"
                      className="planner-summary__dot"
                      style={{ backgroundColor: course.color }}
                    />
                    <span className="planner-summary__name">{course.title}</span>
                    <span className="planner-summary__duration">
                      {formatStudyDuration(minutes)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h3 className="planner-summary__label">요일별</h3>
            <div className="planner-summary__chart">
              <ResponsiveContainer
                width="100%"
                height={dayChartData.length * 26 + 8}
              >
                <BarChart
                  layout="vertical"
                  data={dayChartData}
                  margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={24}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="minutes" radius={[0, 4, 4, 0]} fill="#4a90d9" />
                  <Tooltip
                    formatter={(value) => [
                      typeof value === 'number'
                        ? formatStudyDuration(value)
                        : '',
                      '학습 시간',
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="planner-summary__list">
              {activeDays.map((day) => {
                const minutes = minutesByDay.get(day) ?? 0
                return (
                  <li key={day} className="planner-summary__item">
                    <span className="planner-summary__name">
                      {formatDayOfWeek(day)}요일
                    </span>
                    <span className="planner-summary__duration">
                      {formatStudyDuration(minutes)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
