import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import './PlannerSummary.css'

const EmptyBarTick = ({ x, y }: { x: string | number; y: string | number }) => (
  <circle cx={Number(x) - 12} cy={Number(y)} r={5} fill="var(--planner-line)" />
)

const EMPTY_PIE_DATA = [{ value: 1 }]
const EMPTY_BAR_DATA = [{ name: '', minutes: 85 }]

export const PlannerSummaryEmpty = () => (
  <div className="planner-summary__grid">
    <div>
      <h3 className="planner-summary__label">강의별</h3>
      <div className="planner-summary__chart">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={EMPTY_PIE_DATA}
              dataKey="value"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={0}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="var(--planner-line)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="planner-summary__list">
        <li className="planner-summary__item">
          <span className="planner-summary__dot" style={{ backgroundColor: 'var(--planner-line)' }} />
          <span className="planner-summary__name planner-summary__name--empty">강의 없음</span>
          <span className="planner-summary__duration planner-summary__duration--empty">0분</span>
        </li>
      </ul>
    </div>
    <div>
      <h3 className="planner-summary__label">요일별</h3>
      <div className="planner-summary__chart">
        <ResponsiveContainer width="100%" height={34}>
          <BarChart
            layout="vertical"
            data={EMPTY_BAR_DATA}
            margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
          >
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              width={24}
              tick={EmptyBarTick}
              axisLine={false}
              tickLine={false}
            />
            <Bar
              dataKey="minutes"
              radius={[0, 4, 4, 0]}
              fill="var(--planner-line)"
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="planner-summary__list">
        <li className="planner-summary__item">
          <span className="planner-summary__name planner-summary__name--empty">강의 없음</span>
          <span className="planner-summary__duration planner-summary__duration--empty">0분</span>
        </li>
      </ul>
    </div>
  </div>
)
