import { useEffect, useMemo, useRef, useState } from "react"
import { periods, provinces } from "./data"

const number = new Intl.NumberFormat("ko-KR")
const compact = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
})

type Reading = {
  key: number
  value: number
  receivedAt: Date
}

type SerialPortConnection = {
  open: (options: { baudRate: number }) => Promise<void>
  close: () => Promise<void>
  readable: ReadableStream<Uint8Array> | null
}

type WebSerialApi = {
  requestPort: () => Promise<SerialPortConnection>
}

type SerialConnectionStatus = "disconnected" | "connecting" | "connected" | "disconnecting"

function getWebSerialApi() {
  if (typeof navigator === "undefined" || !("serial" in navigator)) return null
  return (navigator as Navigator & { serial?: WebSerialApi }).serial ?? null
}

function formatReadingTime(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value)
}

type ChartPoint = {
  value: number
  index: number
}

function LineChart({ values }: { values: readonly (number | null)[] }) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter((item): item is ChartPoint => item.value !== null)
  const min = Math.min(...points.map((item) => item.value))
  const max = Math.max(...points.map((item) => item.value))
  const range = max - min || 1
  const x = (index: number) => 56 + (index / (periods.length - 1)) * 824
  const y = (value: number) => 255 - ((value - min) / range) * 190
  const path = points
    .map((point, i) => `${i ? "L" : "M"} ${x(point.index)} ${y(point.value)}`)
    .join(" ")
  const ticks = [max, (max + min) / 2, min]

  return (
    <div className="chart-scroll">
      <svg
        viewBox="0 0 920 330"
        role="img"
        aria-label="선택한 시도의 시점별 주민등록 세대수 선 그래프"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1="56"
              x2="880"
              y1={y(tick)}
              y2={y(tick)}
              className="grid-line"
            />
            <text
              x="46"
              y={y(tick) + 4}
              textAnchor="end"
              className="axis-label"
            >
              {compact.format(Math.round(tick))}
            </text>
          </g>
        ))}
        <path d={path} className="trend-line" />
        {points.map((point) => (
          <g key={point.index}>
            <circle
              cx={x(point.index)}
              cy={y(point.value)}
              r="5"
              className="trend-point"
            >
              <title>{`${periods[point.index]} · ${number.format(point.value)}세대`}</title>
            </circle>
            <text
              x={x(point.index)}
              y="292"
              textAnchor="middle"
              className="axis-label"
            >
              {periods[point.index].replace("20", "’")}
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
    <div
      className="ranking"
      role="img"
      aria-label="최신 시점 시도별 주민등록 세대수 순위 막대 그래프"
    >
      {ranking.map((item, index) => (
        <div
          className={`rank-row ${item.name === selected ? "is-selected" : ""}`}
          key={item.name}
        >
          <span className="rank-number">{index + 1}</span>
          <span className="rank-name">
            {item.name
              .replace("특별자치", "")
              .replace("광역시", "")
              .replace("특별시", "")}
          </span>
          <span className="bar-track">
            <span
              className="bar-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="rank-value">{compact.format(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

function SensorChart({ readings }: { readings: readonly Reading[] }) {
  if (!readings.length) {
    return (
      <div className="empty-chart">
        시리얼 포트에 연결하면 측정값이 여기에 표시됩니다.
      </div>
    )
  }

  const values = readings.map((reading) => reading.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || Math.max(Math.abs(max) * 0.1, 1)
  const chartMin = min - range * 0.1
  const chartMax = max + range * 0.1
  const x = (index: number) =>
    readings.length === 1 ? 468 : 56 + (index / (readings.length - 1)) * 824
  const y = (value: number) =>
    255 - ((value - chartMin) / (chartMax - chartMin)) * 190
  const path = readings
    .map(
      (reading, index) =>
        `${index ? "L" : "M"} ${x(index)} ${y(reading.value)}`,
    )
    .join(" ")
  const ticks = [chartMax, (chartMax + chartMin) / 2, chartMin]
  const labelIndices = [
    ...new Set([0, 25, 50, 75, readings.length - 1]),
  ].filter((index) => index < readings.length)

  return (
    <div className="chart-scroll sensor-chart">
      <svg
        viewBox="0 0 920 330"
        role="img"
        aria-label="최근 측정값 100개의 선 그래프"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1="56"
              x2="880"
              y1={y(tick)}
              y2={y(tick)}
              className="grid-line"
            />
            <text
              x="46"
              y={y(tick) + 4}
              textAnchor="end"
              className="axis-label"
            >
              {number.format(Number(tick.toFixed(2)))}
            </text>
          </g>
        ))}
        <path d={path} className="sensor-line reading-line" />
        {readings.map((reading, index) => (
          <circle
            key={reading.key}
            cx={x(index)}
            cy={y(reading.value)}
            r={readings.length > 50 ? 2.5 : 4}
            className="sensor-point reading-point"
          >
            <title>{`${formatReadingTime(reading.receivedAt)} · ${number.format(reading.value)}`}</title>
          </circle>
        ))}
        {labelIndices.map((index) => (
          <text
            key={index}
            x={x(index)}
            y="292"
            textAnchor="middle"
            className="axis-label"
          >
            {formatReadingTime(readings[index].receivedAt)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function SensorDashboard() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] =
    useState<SerialConnectionStatus>("disconnected")
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const portRef = useRef<SerialPortConnection | null>(null)
  const nextReadingKeyRef = useRef(0)
  const disconnectRequestedRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      disconnectRequestedRef.current = true
      void readerRef.current?.cancel().catch((reason: unknown) => {
        console.error(
          "Failed to cancel the serial reader during cleanup.",
          reason,
        )
      })
    }
  }, [])

  const connectSerial = async () => {
    const serial = getWebSerialApi()
    if (!serial) {
      setError(
        "Web Serial API를 사용할 수 없습니다. 데스크톱 Chrome 또는 Edge의 HTTPS 페이지에서 열어주세요.",
      )
      return
    }

    setError(null)
    setConnectionStatus("connecting")
    disconnectRequestedRef.current = false
    let port: SerialPortConnection | null = null
    let portOpened = false
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

    const appendLine = (line: string) => {
      const text = line.trim()
      if (!text) return
      const value = Number(text)
      if (!Number.isFinite(value)) {
        if (mountedRef.current) {
          setError(
            `숫자가 아닌 시리얼 데이터를 건너뜁니다: ${text.slice(0, 40)}`,
          )
        }
        return
      }

      if (!mountedRef.current) return
      setError(null)
      const reading = {
        key: nextReadingKeyRef.current++,
        value,
        receivedAt: new Date(),
      }
      setReadings((current) => [...current, reading].slice(-100))
    }

    try {
      port = await serial.requestPort()
      await port.open({ baudRate: 9600 })
      portOpened = true
      if (!mountedRef.current) return
      if (!port.readable) {
        throw new Error("선택한 시리얼 포트에서 데이터를 읽을 수 없습니다.")
      }

      portRef.current = port
      reader = port.readable.getReader()
      readerRef.current = reader
      setConnectionStatus("connected")

      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ""
        lines.forEach(appendLine)
      }
      buffer += decoder.decode()
      appendLine(buffer)
    } catch (reason) {
      if (mountedRef.current && !disconnectRequestedRef.current) {
        if (reason instanceof DOMException && reason.name === "NotFoundError") {
          setError("시리얼 포트 선택이 취소되었습니다.")
        } else {
          setError(
            reason instanceof Error
              ? `시리얼 연결 오류: ${reason.message}`
              : "시리얼 연결 중 알 수 없는 오류가 발생했습니다.",
          )
        }
      }
    } finally {
      reader?.releaseLock()
      if (readerRef.current === reader) readerRef.current = null
      if (portRef.current === port) portRef.current = null
      if (port && portOpened) {
        try {
          await port.close()
        } catch (reason) {
          if (mountedRef.current && !disconnectRequestedRef.current) {
            setError(
              reason instanceof Error
                ? `시리얼 포트 닫기 실패: ${reason.message}`
                : "시리얼 포트를 닫지 못했습니다.",
            )
          }
        }
      }
      if (mountedRef.current) setConnectionStatus("disconnected")
      disconnectRequestedRef.current = false
    }
  }

  const handleSerialButton = async () => {
    if (connectionStatus === "connected") {
      disconnectRequestedRef.current = true
      setConnectionStatus("disconnecting")
      try {
        await readerRef.current?.cancel()
      } catch (reason) {
        setError(
          reason instanceof Error
            ? `시리얼 연결 해제 실패: ${reason.message}`
            : "시리얼 연결을 해제하지 못했습니다.",
        )
      }
      return
    }
    await connectSerial()
  }

  const latest = readings.at(-1)
  const statusLabel =
    connectionStatus === "connected"
      ? "시리얼 연결됨"
      : connectionStatus === "connecting"
        ? "포트 선택 중"
        : connectionStatus === "disconnecting"
          ? "연결 해제 중"
          : "연결 안 됨"
  const buttonLabel =
    connectionStatus === "connected"
      ? "연결 해제"
      : connectionStatus === "disconnecting"
        ? "해제 중…"
        : connectionStatus === "connecting"
          ? "포트 선택 중…"
          : "시리얼 연결"

  return (
    <>
      <section className="sensor-dashboard readings-dashboard">
        <div className="sensor-summary readings-summary">
          <article className="sensor-card reading-current-card">
            <div className="sensor-card-top">
              <span className="sensor-icon reading-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M3 12h4l3-8 4 16 3-8h4" />
                </svg>
              </span>
              <span className={`live-status ${error ? "status-error" : ""}`}>
                <i /> {statusLabel}
              </span>
            </div>
            <p>최신 측정값</p>
            <div className="sensor-value">
              {latest ? number.format(latest.value) : "—"}
            </div>
            <div className="sensor-delta">
              {latest
                ? `최근 ${readings.length}개 중 최신`
                : "시리얼 포트 연결을 기다리는 중"}
            </div>
          </article>
          <article className="sensor-info-card reading-info-card">
            <p className="kicker">WEB SERIAL · 9600 BAUD</p>
            <h2>시리얼 측정 상태</h2>
            <dl>
              <div>
                <dt>마지막 수신</dt>
                <dd>{latest ? formatReadingTime(latest.receivedAt) : "—"}</dd>
              </div>
              <div>
                <dt>연결 상태</dt>
                <dd
                  className={connectionStatus === "connected" ? "comfort" : ""}
                >
                  {statusLabel}
                </dd>
              </div>
              <div>
                <dt>표시 범위</dt>
                <dd>최근 100개</dd>
              </div>
            </dl>
          </article>
        </div>

        <article className="card sensor-history">
          <div className="card-heading">
            <div>
              <p className="kicker">LATEST 100 SERIAL VALUES</p>
              <h2>측정값 변화</h2>
            </div>
            <div className="serial-actions">
              <div className="chart-legend">
                <span>
                  <i className="reading-dot" /> value
                </span>
              </div>
              <button
                className={`serial-connect-button ${
                  connectionStatus === "connected" ? "is-connected" : ""
                }`}
                type="button"
                onClick={handleSerialButton}
                disabled={
                  connectionStatus === "connecting" ||
                  connectionStatus === "disconnecting"
                }
              >
                {buttonLabel}
              </button>
            </div>
          </div>
          {error && (
            <p className="readings-error" role="alert">
              {error}
            </p>
          )}
          <SensorChart readings={readings} />
          <p className="chart-note">
            Arduino의 숫자 한 줄씩을 9600 baud로 읽습니다. 최근 100개 값만
            브라우저에 표시하며 데이터베이스에는 저장하지 않습니다.
          </p>
        </article>
      </section>
      <footer>
        Web Serial · 9600 baud ·{" "}
        {latest
          ? `마지막 수신: ${formatReadingTime(latest.receivedAt)}`
          : "값 대기 중"}{" "}
        · 데이터베이스 저장 안 함
      </footer>
    </>
  )
}

export default function App() {
  const [view, setView] = useState<"household" | "sensor">("sensor")
  const [selected, setSelected] = useState("서울특별시")
  const province =
    provinces.find((item) => item.name === selected) ?? provinces[0]
  const latest = province.values.at(-1) ?? 0
  const first = province.values.find((value) => value !== null) ?? latest
  const change = ((latest - first) / first) * 100

  return (
    <main>
      <header className={`hero ${view === "sensor" ? "sensor-hero" : ""}`}>
        <div className="topbar">
          <div className="eyebrow">
            <span />
            DATA MONITOR
          </div>
          <nav aria-label="대시보드 전환">
            <button
              className={view === "household" ? "active" : ""}
              onClick={() => setView("household")}
            >
              인구 데이터
            </button>
            <button
              className={view === "sensor" ? "active" : ""}
              onClick={() => setView("sensor")}
            >
              실시간 측정값
            </button>
          </nav>
        </div>
        <div className="hero-row">
          <div>
            <h1>
              {view === "household"
                ? "대한민국 세대의 변화"
                : "공간의 상태를 한눈에"}
            </h1>
            <p>
              {view === "household"
                ? "행정구역별 주민등록세대수로 살펴보는 2016–2026 지역 변화"
                : "Arduino 시리얼 포트에서 측정값을 받아 실시간으로 확인하세요"}
            </p>
          </div>
          <div className="source-badge">
            {view === "household" ? (
              <>
                통계청 원자료
                <br />
                <strong>2026.09 기준</strong>
              </>
            ) : (
              <>
                연결 방식
                <br />
                <strong className="connected">USB Serial · 9600</strong>
              </>
            )}
          </div>
        </div>
      </header>

      {view === "sensor" ? (
        <SensorDashboard />
      ) : (
        <>
          <section className="dashboard">
            <article className="card trend-card">
              <div className="card-heading">
                <div>
                  <p className="kicker">시도별 추이</p>
                  <h2>연도별 세대수 변화</h2>
                </div>
                <label>
                  <span>시도 선택</span>
                  <select
                    value={selected}
                    onChange={(event) => setSelected(event.target.value)}
                  >
                    {provinces.map((item) => (
                      <option key={item.name}>{item.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="metric-row">
                <div>
                  <span>최신 세대수</span>
                  <strong>{number.format(latest)}</strong>
                  <small> 세대</small>
                </div>
                <div className={change >= 0 ? "up" : "down"}>
                  <span>2016년 대비</span>
                  <strong>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </strong>
                </div>
              </div>
              <LineChart values={province.values} />
              <p className="chart-note">
                ※ 2026년은 6–9월 월별 수치이며, 점에 마우스를 올리면 정확한 값을
                볼 수 있습니다.
              </p>
            </article>

            <article className="card rank-card">
              <div className="card-heading">
                <div>
                  <p className="kicker">전국 비교</p>
                  <h2>시도별 세대수 순위</h2>
                </div>
                <span className="latest-pill">2026.09</span>
              </div>
              <div className="rank-legend">
                <span>순위 · 시도</span>
                <span>세대수</span>
              </div>
              <RankingChart selected={selected} />
            </article>
          </section>
          <footer>
            자료: 통계청 「행정구역(시군구)별 주민등록세대수」 · 단위: 세대
          </footer>
        </>
      )}
    </main>
  )
}
