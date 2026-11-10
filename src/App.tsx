import { useEffect, useState } from "react"
import ConnectionControl from "./components/ConnectionControl"
import PowerToggle from "./components/PowerToggle"
import ProductHeader from "./components/ProductHeader"
import SensorChart from "./components/SensorChart"
import SensorSprout from "./components/SensorSprout"
import {
  connectSensor,
  disconnectSensor,
  loadPower,
  type Reading,
  type Status,
} from "./lib/device"
import { MAX_POINTS } from "./product"

export default function App() {
  const [status, setStatus] = useState<Status>("disconnected")
  const [power, setPower] = useState(false)
  const [readings, setReadings] = useState<Reading[]>([])

  useEffect(() => {
    let active = true

    void loadPower().then((value) => {
      if (active) setPower(value)
    })

    return () => {
      active = false
      void disconnectSensor()
    }
  }, [])

  const handleConnect = async () => {
    if (status === "connected") {
      await disconnectSensor()
      setStatus("disconnected")
      return
    }

    await connectSensor({
      onInit: (rows) => setReadings(rows),
      onReading: (row) =>
        setReadings((current) => [...current, row].slice(-MAX_POINTS)),
      onStatus: setStatus,
    })
  }

  const latestValue = readings.at(-1)?.value

  return (
    <main className="app-shell">
      <ProductHeader />
      <SensorSprout value={latestValue} />
      <div className="dashboard-grid">
        <section className="controls" aria-label="조명 제어">
          <ConnectionControl status={status} onToggle={handleConnect} />
          <PowerToggle power={power} onPowerChange={setPower} />
        </section>
        <SensorChart readings={readings} />
      </div>
    </main>
  )
}
