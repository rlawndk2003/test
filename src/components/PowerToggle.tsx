import { useState } from "react"
import { setLedPower } from "../lib/device"

export default function PowerToggle({
  power,
  onPowerChange,
}: {
  power: boolean
  onPowerChange: (power: boolean) => void
}) {
  const [error, setError] = useState(false)

  const togglePower = async () => {
    const next = !power
    onPowerChange(next)
    setError(false)
    const succeeded = await setLedPower(next)
    if (!succeeded) {
      onPowerChange(power)
      setError(true)
    }
  }

  return (
    <div>
      <div className="control-row">
        <div>
          <div className="t-label">LED 전원</div>
          <div className="t-caption power-state">{power ? "켜짐" : "꺼짐"}</div>
        </div>
        <button
          className="power-toggle"
          type="button"
          role="switch"
          aria-checked={power}
          aria-label="LED 전원"
          onClick={() => void togglePower()}
        >
          <span className="toggle-track" aria-hidden="true">
            <span className="toggle-thumb" />
          </span>
        </button>
      </div>
      {error && (
        <p className="t-caption power-error" role="alert">
          전원 변경 실패, 다시 시도
        </p>
      )}
    </div>
  )
}
