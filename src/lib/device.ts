import type { RealtimeChannel } from "@supabase/supabase-js"
import { DEVICE_ID, MAX_POINTS, SENSOR_MAX, SENSOR_MIN } from "../product"
import { db, IS_DEMO_MODE } from "./supabase"

export type Reading = { value: number; created_at: string }
export type Status = "disconnected" | "connecting" | "connected" | "error"

let channel: RealtimeChannel | null = null
let demoTimer: ReturnType<typeof setInterval> | null = null
let demoPower = false

export async function connectSensor(opts: {
  onInit: (rows: Reading[]) => void
  onReading: (row: Reading) => void
  onStatus: (s: Status) => void
}): Promise<void> {
  await disconnectSensor()
  opts.onStatus("connecting")

  if (IS_DEMO_MODE) {
    const now = Date.now()
    const initialRows = Array.from({ length: 30 }, (_, index) => {
      const phase = index / 5
      return {
        value: Math.round(
          SENSOR_MIN +
            ((Math.sin(phase) + 1) / 2) * (SENSOR_MAX - SENSOR_MIN),
        ),
        created_at: new Date(now - (29 - index) * 500).toISOString(),
      }
    })
    opts.onInit(initialRows)
    opts.onStatus("connected")

    let step = 30
    demoTimer = setInterval(() => {
      const wave = (Math.sin(step / 5) + 1) / 2
      const noise = (Math.random() - 0.5) * 0.06
      opts.onReading({
        value: Math.round(
          SENSOR_MIN +
            Math.min(1, Math.max(0, wave + noise)) *
              (SENSOR_MAX - SENSOR_MIN),
        ),
        created_at: new Date().toISOString(),
      })
      step += 1
    }, 500)
    return
  }

  const { data, error } = await db
    .from("sensor_readings")
    .select("value, created_at")
    .eq("device_id", DEVICE_ID)
    .order("created_at", { ascending: false })
    .limit(MAX_POINTS)

  if (error) {
    opts.onStatus("error")
    return
  }

  opts.onInit([...(data as Reading[])].reverse())
  channel = db
    .channel(`sensor-readings-${DEVICE_ID}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sensor_readings",
        filter: `device_id=eq.${DEVICE_ID}`,
      },
      (payload) => opts.onReading(payload.new as Reading),
    )
    .subscribe((state) => {
      if (state === "SUBSCRIBED") opts.onStatus("connected")
      if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
        opts.onStatus("error")
      }
    })
}

export async function disconnectSensor(): Promise<void> {
  if (demoTimer) {
    clearInterval(demoTimer)
    demoTimer = null
  }
  if (channel) {
    await db.removeChannel(channel)
    channel = null
  }
}

export async function setLedPower(on: boolean): Promise<boolean> {
  if (IS_DEMO_MODE) {
    demoPower = on
    return true
  }

  const { error } = await db
    .from("device_state")
    .update({ led_on: on, updated_at: new Date().toISOString() })
    .eq("device_id", DEVICE_ID)
  return !error
}

export async function loadPower(): Promise<boolean> {
  if (IS_DEMO_MODE) return demoPower

  const { data, error } = await db
    .from("device_state")
    .select("led_on")
    .eq("device_id", DEVICE_ID)
    .maybeSingle()
  return error ? false : Boolean(data?.led_on)
}
