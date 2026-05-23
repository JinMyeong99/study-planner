import './PlannerSummary.css'

const donutMask = 'radial-gradient(circle, transparent 44px, black 44px)'

export const PlannerSummarySkeleton = () => (
  <section className="planner-summary" aria-hidden="true">
    <div className="planner-panel__header">
      <div className="planner-skeleton" style={{ width: 104, height: 22 }} />
      <div className="planner-skeleton" style={{ width: 68, height: 18 }} />
    </div>
    <div className="planner-summary__grid">
      <div>
        <div className="planner-skeleton planner-summary__label" style={{ width: 52, height: 20 }} />
        <div
          className="planner-summary__chart"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}
        >
          <div
            className="planner-skeleton"
            style={{
              width: 136,
              height: 136,
              borderRadius: '50%',
              maskImage: donutMask,
              WebkitMaskImage: donutMask,
            }}
          />
        </div>
        <ul className="planner-summary__list">
          <li className="planner-summary__item">
            <div className="planner-skeleton" style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0 }} />
            <div className="planner-skeleton" style={{ width: 88, height: 18 }} />
            <div className="planner-skeleton" style={{ width: 44, height: 18, marginLeft: 'auto' }} />
          </li>
        </ul>
      </div>
      <div>
        <div className="planner-skeleton planner-summary__label" style={{ width: 52, height: 20 }} />
        <div
          className="planner-summary__chart"
          style={{ height: 34, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <div className="planner-skeleton" style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0 }} />
          <div className="planner-skeleton" style={{ flex: 1, height: 27, borderRadius: 4 }} />
        </div>
        <ul className="planner-summary__list">
          <li className="planner-summary__item">
            <div className="planner-skeleton" style={{ width: 40, height: 18 }} />
            <div className="planner-skeleton" style={{ width: 44, height: 18, marginLeft: 'auto' }} />
          </li>
        </ul>
      </div>
    </div>
  </section>
)
