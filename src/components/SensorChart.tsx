import { useEffect, useRef, useState } from "react"
import type { Reading } from "../lib/device"
import { SENSOR_MAX } from "../product"

const HEIGHT = 200
const LEFT = 40
const RIGHT = 8
const TOP = 8
const BOTTOM = 20

export default function SensorChart({
  readings,
}: {
  readings: readonly Reading[]
}) {
  const containerRef = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const plotWidth = Math.max(0, width - LEFT - RIGHT)
  const plotHeight = HEIGHT - TOP - BOTTOM
  const points = readings
    .map((reading, index) => {
      const x =
        LEFT +
        (readings.length < 2 ? plotWidth : (index / (readings.length - 1)) * plotWidth)
      const y =
        TOP +
        plotHeight -
        (Math.min(SENSOR_MAX, Math.max(0, reading.value)) / SENSOR_MAX) *
          plotHeight
      return `${x},${y}`
    })
    .join(" ")
  const current = readings.at(-1)?.value
  const ticks = [SENSOR_MAX, Math.round(SENSOR_MAX / 2), 0]

  return (
    <section
      className="sensor-chart"
      aria-label="실시간 센서값"
      ref={containerRef}
    >
      {!readings.length ? (
        <p className="t-body chart-empty">
          센서를 연결하면 값이 여기에 그려집니다.
        </p>
      ) : (
        width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            role="img"
            aria-label={`센서값 추이, 현재 ${current}`}
          >
            {ticks.map((tick) => {
              const y = TOP + plotHeight - (tick / SENSOR_MAX) * plotHeight
              return (
                <g key={tick}>
                  <line className="chart-grid" x1={LEFT} x2={width - RIGHT} y1={y} y2={y} />
                  <text className="chart-label" x={LEFT - 8} y={y + 4} textAnchor="end">
                    {tick.toLocaleString("ko-KR")}
                  </text>
                </g>
              )
            })}
            <polyline className="chart-line" points={points} />
            <text className="chart-label" x={LEFT} y={HEIGHT - 2}>
              −60s
            </text>
            <text
              className="chart-label"
              x={width - RIGHT}
              y={HEIGHT - 2}
              textAnchor="end"
            >
              지금
            </text>
          </svg>
        )
      )}
    </section>
  )
}
