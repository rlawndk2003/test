import { useMemo, useState } from 'react'
import { periods, provinces } from './data'

const number = new Intl.NumberFormat('ko-KR')
const compact = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function LineChart({ values }: { values: readonly (number | null)[] }) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter((item): item is { value: number; index: number } => item.value !== null)
  const min = Math.min(...points.map((item) => item.value))
  const max = Math.max(...points.map((item) => item.value))
  const range = max - min || 1
  const x = (index: number) => 56 + (index / (periods.length - 1)) * 824
  const y = (value: number) => 255 - ((value - min) / range) * 190
  const path = points
    .map((point, i) => `${i ? 'L' : 'M'} ${x(point.index)} ${y(point.value)}`)
    .join(' ')
  const ticks = [max, (max + min) / 2, min]

  return (
    <div className="chart-scroll">
      <svg viewBox="0 0 920 330" role="img" aria-label="선택한 시도의 시점별 주민등록 세대수 선 그래프">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1="56" x2="880" y1={y(tick)} y2={y(tick)} className="grid-line" />
            <text x="46" y={y(tick) + 4} textAnchor="end" className="axis-label">
              {compact.format(Math.round(tick))}
            </text>
          </g>
        ))}
        <path d={path} className="trend-line" />
        {points.map((point) => (
          <g key={point.index}>
            <circle cx={x(point.index)} cy={y(point.value)} r="5" className="trend-point">
              <title>{`${periods[point.index]} · ${number.format(point.value)}세대`}</title>
            </circle>
            <text x={x(point.index)} y="292" textAnchor="middle" className="axis-label">
              {periods[point.index].replace('20', '’')}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function RankingChart({ selected }: { selected: string }) {
  const ranking = useMemo(
    () =>
      [...provinces]
        .map((province) => ({
          name: province.name,
          value: province.values.at(-1) ?? 0,
        }))
        .sort((a, b) => b.value - a.value),
    [],
  )
  const max = ranking[0].value

  return (
    <div className="ranking" role="img" aria-label="최신 시점 시도별 주민등록 세대수 순위 막대 그래프">
      {ranking.map((item, index) => (
        <div className={`rank-row ${item.name === selected ? 'is-selected' : ''}`} key={item.name}>
          <span className="rank-number">{index + 1}</span>
          <span className="rank-name">{item.name.replace('특별자치', '').replace('광역시', '').replace('특별시', '')}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className="rank-value">{compact.format(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [selected, setSelected] = useState('서울특별시')
  const province = provinces.find((item) => item.name === selected) ?? provinces[0]
  const latest = province.values.at(-1) ?? 0
  const first = province.values.find((value) => value !== null) ?? latest
  const change = ((latest - first) / first) * 100

  return (
    <main>
      <header className="hero">
        <div className="eyebrow"><span />KOSIS DATA EXPLORER</div>
        <div className="hero-row">
          <div>
            <h1>대한민국 세대의 변화</h1>
            <p>행정구역별 주민등록세대수로 살펴보는 2016–2026 지역 변화</p>
          </div>
          <div className="source-badge">통계청 원자료<br /><strong>2026.09 기준</strong></div>
        </div>
      </header>

      <section className="dashboard">
        <article className="card trend-card">
          <div className="card-heading">
            <div>
              <p className="kicker">시도별 추이</p>
              <h2>연도별 세대수 변화</h2>
            </div>
            <label>
              <span>시도 선택</span>
              <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                {provinces.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <div className="metric-row">
            <div><span>최신 세대수</span><strong>{number.format(latest)}</strong><small> 세대</small></div>
            <div className={change >= 0 ? 'up' : 'down'}>
              <span>2016년 대비</span><strong>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</strong>
            </div>
          </div>
          <LineChart values={province.values} />
          <p className="chart-note">※ 2026년은 6–9월 월별 수치이며, 점에 마우스를 올리면 정확한 값을 볼 수 있습니다.</p>
        </article>

        <article className="card rank-card">
          <div className="card-heading">
            <div>
              <p className="kicker">전국 비교</p>
              <h2>시도별 세대수 순위</h2>
            </div>
            <span className="latest-pill">2026.09</span>
          </div>
          <div className="rank-legend"><span>순위 · 시도</span><span>세대수</span></div>
          <RankingChart selected={selected} />
        </article>
      </section>

      <footer>자료: 통계청 「행정구역(시군구)별 주민등록세대수」 · 단위: 세대</footer>
    </main>
  )
}
