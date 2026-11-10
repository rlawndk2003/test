import type { Status } from "../lib/device"

const labels: Record<Status, string> = {
  disconnected: "연결 안 됨",
  connecting: "연결 중…",
  connected: "연결됨",
  error: "연결 실패, 다시 시도",
}

export default function ConnectionControl({
  status,
  onToggle,
}: {
  status: Status
  onToggle: () => Promise<void>
}) {
  const connected = status === "connected"

  return (
    <div className="control-row">
      <div>
        <div className="t-label">센서</div>
        <div className={`connection-status t-label status-${status}`} role="status">
          <span aria-hidden="true" />
          {labels[status]}
        </div>
      </div>
      <button
        className={`t-label connection-button ${connected ? "connected" : ""}`}
        type="button"
        disabled={status === "connecting"}
        onClick={() => void onToggle()}
      >
        {connected ? "연결 끊기" : "센서 연결"}
      </button>
    </div>
  )
}
