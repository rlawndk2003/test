import type { CSSProperties } from "react"
import { SENSOR_MAX, SENSOR_MIN } from "../product"

type LevelStyle = CSSProperties & {
  "--sprout-opacity": number
}

export default function SensorSprout({ value }: { value?: number }) {
  const level =
    value === undefined
      ? 0
      : Math.min(
          1,
          Math.max(0, (value - SENSOR_MIN) / (SENSOR_MAX - SENSOR_MIN)),
        )
  const clarity = Math.round(level * 100)

  return (
    <section className="sprout-section" aria-label="새싹 상태">
      <div
        className="sprout"
        style={
          {
            "--sprout-opacity": 0.15 + level * 0.85,
          } as LevelStyle
        }
        role="img"
        aria-label={`새싹 선명도 ${clarity}%`}
      >
        <svg viewBox="0 0 320 320" aria-hidden="true">
          <path className="sprout-stem" d="M160 264 C158 220 164 174 184 122" />
          <path
            className="sprout-leaf sprout-leaf-left"
            d="M165 190 C126 191 102 164 103 125 C142 125 169 148 165 190 Z"
          />
          <path
            className="sprout-leaf sprout-leaf-right"
            d="M177 146 C181 103 212 78 253 82 C250 123 221 149 177 146 Z"
          />
        </svg>
      </div>
      <div className="t-value sensor-value">
        {value === undefined ? "—" : value.toLocaleString("ko-KR")}
      </div>
    </section>
  )
}
