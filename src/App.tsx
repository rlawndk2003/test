import { useMemo, useState } from 'react'
import { periods, provinces } from './data'

const number = new Intl.NumberFormat('ko-KR')
const compact = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const sensorTimes = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
const temperatures = [21.2, 20.8, 20.4, 20.7, 22.1, 23.4, 24.3, 25.1, 24.8, 23.9, 23.1, 22.6]
const humidity = [48, 50, 52, 53, 51, 48, 45, 43, 44, 47, 49, 51]

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

function SensorChart() {
  const x = (index: number) => 52 + (index / (sensorTimes.length - 1)) * 828
  const yTemp = (value: number) => 250 - ((value - 19) / 8) * 190
  const yHumidity = (value: number) => 250 - ((value - 35) / 25) * 190
  const path = (values: number[], y: (value: number) => number) =>
    values.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ')

  return (
    <div className="chart-scroll sensor-chart">
      <svg viewBox="0 0 920 320" role="img" aria-label="24시간 온도와 습도 변화 선 그래프">
        {[60, 155, 250].map((position, index) => (
          <g key={position}>
            <line x1="52" x2="880" y1={position} y2={position} className="grid-line" />
            <text x="42" y={position + 4} textAnchor="end" className="axis-label">
              {index === 0 ? '높음' : index === 1 ? '보통' : '낮음'}
            </text>
          </g>
        ))}
        <path d={path(temperatures, yTemp)} className="sensor-line temperature-line" />
        <path d={path(humidity, yHumidity)} className="sensor-line humidity-line" />
        {temperatures.map((value, index) => (
          <g key={sensorTimes[index]}>
            <circle cx={x(index)} cy={yTemp(value)} r="4" className="sensor-point temperature-point">
              <title>{`${sensorTimes[index]} · ${value.toFixed(1)}°C`}</title>
            </circle>
            <circle cx={x(index)} cy={yHumidity(humidity[index])} r="4" className="sensor-point humidity-point">
              <title>{`${sensorTimes[index]} · 습도 ${humidity[index]}%`}</title>
            </circle>
            <text x={x(index)} y="286" textAnchor="middle" className="axis-label">{sensorTimes[index]}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function SensorDashboard() {
  return (
    <>
      <section className="sensor-dashboard">
        <div className="sensor-summary">
          <article className="sensor-card temperature-card">
            <div className="sensor-card-top">
              <span className="sensor-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M14 14.76V5a4 4 0 0 0-8 0v9.76a6 6 0 1 0 8 0ZM10 4a1 1 0 0 1 1 1v11.35a3 3 0 1 1-2 0V5a1 1 0 0 1 1-1Z" /></svg>
              </span>
              <span className="live-status"><i /> 정상</span>
            </div>
            <p>현재 온도</p>
            <div className="sensor-value">23.4<small>°C</small></div>
            <div className="sensor-delta">지난 1시간 대비 <strong>+0.6°C</strong></div>
          </article>
          <article className="sensor-card humidity-card">
            <div className="sensor-card-top">
              <span className="sensor-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 2S5 10.18 5 15a7 7 0 0 0 14 0c0-4.82-7-13-7-13Zm0 17a4 4 0 0 1-4-4c0-2.18 2.36-5.75 4-7.92 1.64 2.17 4 5.74 4 7.92a4 4 0 0 1-4 4Z" /></svg>
              </span>
              <span className="live-status"><i /> 정상</span>
            </div>
            <p>현재 습도</p>
            <div className="sensor-value">48<small>%</small></div>
            <div className="sensor-delta">지난 1시간 대비 <strong>−2%</strong></div>
          </article>
          <article className="sensor-info-card">
            <p className="kicker">SENSOR STATUS</p>
            <h2>회의실 A</h2>
            <dl>
              <div><dt>마지막 업데이트</dt><dd>방금 전</dd></div>
              <div><dt>쾌적도</dt><dd className="comfort">쾌적</dd></div>
              <div><dt>센서 ID</dt><dd>TH-001</dd></div>
            </dl>
          </article>
        </div>

        <article className="card sensor-history">
          <div className="card-heading">
            <div>
              <p className="kicker">24시간 모니터링</p>
              <h2>온도 · 습도 변화</h2>
            </div>
            <div className="chart-legend">
              <span><i className="temp-dot" /> 온도</span>
              <span><i className="humid-dot" /> 습도</span>
            </div>
          </div>
          <SensorChart />
          <p className="chart-note">예시 데이터입니다. 실제 센서 연결 후 실시간 값으로 업데이트됩니다.</p>
        </article>
      </section>
      <footer>센서 데이터 · 예시 값 · 마지막 업데이트: 방금 전</footer>
    </>
  )
}

export default function App() {
  const [view, setView] = useState<'household' | 'sensor'>('household')
  const [selected, setSelected] = useState('서울특별시')
  const province = provinces.find((item) => item.name === selected) ?? provinces[0]
  const latest = province.values.at(-1) ?? 0
  const first = province.values.find((value) => value !== null) ?? latest
  const change = ((latest - first) / first) * 100

  return (
    <main>
      <header className={`hero ${view === 'sensor' ? 'sensor-hero' : ''}`}>
        <div className="topbar">
          <div className="eyebrow"><span />DATA MONITOR</div>
          <nav aria-label="대시보드 전환">
            <button className={view === 'household' ? 'active' : ''} onClick={() => setView('household')}>인구 데이터</button>
            <button className={view === 'sensor' ? 'active' : ''} onClick={() => setView('sensor')}>온습도 센서</button>
          </nav>
        </div>
        <div className="hero-row">
          <div>
            <h1>{view === 'household' ? '대한민국 세대의 변화' : '공간의 상태를 한눈에'}</h1>
            <p>{view === 'household' ? '행정구역별 주민등록세대수로 살펴보는 2016–2026 지역 변화' : '실내 온도와 습도의 현재 상태와 시간대별 변화를 확인하세요'}</p>
          </div>
          <div className="source-badge">
            {view === 'household' ? <>통계청 원자료<br /><strong>2026.09 기준</strong></> : <>센서 연결 상태<br /><strong className="connected">● 온라인</strong></>}
          </div>
        </div>
      </header>

      {view === 'sensor' ? <SensorDashboard /> : <><section className="dashboard">
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
      <footer>자료: 통계청 「행정구역(시군구)별 주민등록세대수」 · 단위: 세대</footer></>}
    </main>
  )
}
