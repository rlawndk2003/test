import argparse
import math
import os
import sys
from pathlib import Path

import serial
from serial.tools import list_ports
from dotenv import load_dotenv
from postgrest.exceptions import APIError
from supabase import create_client


def find_serial_port() -> str:
    ports = list(list_ports.comports())
    arduino_ports = [
        port
        for port in ports
        if any(
            hint in " ".join(
                filter(None, (port.device, port.description, port.manufacturer))
            ).lower()
            for hint in (
                "arduino",
                "usbmodem",
                "usbserial",
                "ttyacm",
                "ttyusb",
                "ch340",
                "cp210",
                "ftdi",
            )
        )
    ]

    if len(arduino_ports) == 1:
        return arduino_ports[0].device
    if len(arduino_ports) > 1:
        matches = ", ".join(port.device for port in arduino_ports)
        raise RuntimeError(
            f"Multiple possible Arduino ports found ({matches}); specify one with --port."
        )

    available = ", ".join(port.device for port in ports) or "none"
    raise RuntimeError(
        f"No likely Arduino serial port found (available: {available}); specify it with --port."
    )


def parse_value(line: str) -> int | float:
    text = line.strip()
    try:
        return int(text)
    except ValueError:
        value = float(text)
        if not math.isfinite(value):
            raise ValueError(f"Value is not a finite number: {text!r}")
        return value


def normalize_supabase_url(url: str) -> str:
    base_url = url.rstrip("/")
    if base_url.endswith("/rest/v1"):
        base_url = base_url[: -len("/rest/v1")]
    return base_url


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Read numeric values from Arduino and insert them into Supabase."
    )
    parser.add_argument(
        "--port",
        help="Arduino serial port (auto-detected when exactly one likely port is found).",
    )
    args = parser.parse_args()

    load_dotenv(Path(__file__).with_name(".env"))
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY")
    if not url or not key:
        print(
            "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in the environment or .env file.",
            file=sys.stderr,
        )
        return 1

    try:
        port = args.port or find_serial_port()
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 1

    client = create_client(normalize_supabase_url(url), key)
    print(f"Reading values from {port} at 9600 baud. Press Ctrl+C to stop.")

    try:
        with serial.Serial(port, baudrate=9600, timeout=1) as connection:
            while True:
                line = connection.readline().decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                try:
                    value = parse_value(line)
                except ValueError as error:
                    print(f"Skipping invalid serial value {line!r}: {error}", file=sys.stderr)
                    continue

                try:
                    client.table("readings").insert({"value": value}).execute()
                except APIError as error:
                    print(
                        f"Supabase insert failed ({error.code}): {error.message}",
                        file=sys.stderr,
                    )
                    if error.code == "PGRST204":
                        print(
                            "Apply the migration in "
                            "supabase/migrations/20261103065000_add_value_to_readings.sql "
                            "to the project configured in .env. If the column already "
                            "exists, reload the API schema with: "
                            "NOTIFY pgrst, 'reload schema';",
                            file=sys.stderr,
                        )
                    return 1
                print(f"Uploaded value: {value}")
    except KeyboardInterrupt:
        print("\nStopped.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
