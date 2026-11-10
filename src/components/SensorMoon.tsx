import type { CSSProperties } from "react"
import { SENSOR_MAX, SENSOR_MIN } from "../product"

type LevelStyle = CSSProperties & {
  "--level": number
  "--moon-brightness": number
  "--moon-glow-size": string
}

export default function SensorMoon({
  value,
  power,
}: {
  value?: number
  power: boolean
}) {
  const level =
    value === undefined
      ? 0
      : Math.min(
          1,
          Math.max(0, (value - SENSOR_MIN) / (SENSOR_MAX - SENSOR_MIN)),
        )
  const brightness = Math.round(level * 100)

  return (
    <section className="moon-section" aria-label="달 상태">
      <div
        className="moon"
        style={
          {
            "--level": level,
            "--moon-brightness": 0.25 + 0.75 * level,
            "--moon-glow-size": `${level * 48}px`,
          } as LevelStyle
        }
        data-power={power ? "on" : "off"}
        role="img"
        aria-label={power ? `달 밝기 ${brightness}%` : "달 꺼짐"}
      >
        <img src="/images/moon.webp" alt="" />
      </div>
      <div className="t-value sensor-value">
        {value === undefined ? "—" : value.toLocaleString("ko-KR")}
      </div>
    </section>
  )
}
