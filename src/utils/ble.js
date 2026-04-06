/**
 * ble.js
 * Web Bluetooth Low Energy (BLE) wrapper for Kavach.
 *
 * Uses navigator.bluetooth.requestLEScan() (Chrome Experimental + HTTPS required).
 * Falls back gracefully on unsupported browsers.
 *
 * Privacy note: Device MAC addresses are intentionally never stored or logged.
 */

/** Returns true when the browser exposes the Web Bluetooth LeScan API */
export function isBluetoothSupported() {
  return (
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    typeof navigator.bluetooth.requestLEScan === "function"
  );
}

/**
 * Start a BLE LE scan.
 *
 * @param {{ onAdvertisement: (event: BluetoothAdvertisingEvent) => void,
 *           onError:         (err: Error) => void,
 *           onUnsupported:   () => void }} callbacks
 * @returns {Promise<{ scan: BluetoothLEScan | null, stop: () => void }>}
 *          Resolves with the scan object and a stop() convenience function.
 *          Resolves with null scan if unsupported or permission denied.
 */
export async function startBLEScan({ onAdvertisement, onError, onUnsupported } = {}) {
  if (!isBluetoothSupported()) {
    console.warn("[Kavach/BLE] Web Bluetooth LeScan not supported in this browser.");
    onUnsupported?.();
    return { scan: null, stop: () => {} };
  }

  let scan = null;

  try {
    // Request scan — acceptAllAdvertisements: true to capture unknown trackers
    // keepRepeatedAdvertisements is absolutely critical to receive multiple continuous RSSI updates per device!
    scan = await navigator.bluetooth.requestLEScan({
      acceptAllAdvertisements: true,
      keepRepeatedAdvertisements: true
    });

    // Listen for advertising events
    const handler = (event) => {
      // Deliberately omit event.device.id / MAC fingerprinting
      const entry = {
        name:  event.device.name ?? "Unknown Device",
        rssi:  event.rssi,
        txPower: event.txPower ?? null,
        timestamp: Date.now(),
        // serviceUUIDs included only for filtering — not stored
        serviceUUIDs: [...(event.uuids ?? [])],
      };
      onAdvertisement?.(entry);
    };

    navigator.bluetooth.addEventListener("advertisementreceived", handler);

    const stop = () => {
      try {
        scan?.stop();
      } catch (_) {
        // scan may already be stopped
      }
      navigator.bluetooth.removeEventListener("advertisementreceived", handler);
    };

    return { scan, stop };

  } catch (err) {
    if (err.name === "NotAllowedError") {
      const e = new Error("Bluetooth permission denied by user.");
      e.code = "PERMISSION_DENIED";
      onError?.(e);
    } else if (err.name === "NotSupportedError") {
      const e = new Error("Bluetooth LE Scan not supported on this device.");
      e.code = "NOT_SUPPORTED";
      onUnsupported?.();
    } else {
      onError?.(err);
    }
    return { scan: null, stop: () => {} };
  }
}

/**
 * Compute a rolling RSSI history for a device keyed by its internal (session-only) id.
 * We do NOT persist this across sessions.
 *
 * @param {Map<string, number[]>} store   — mutable map updated in place
 * @param {string}                key     — session-scoped device key (NOT MAC)
 * @param {number}                rssi    — new reading
 * @param {number}                maxLen  — max history length (default 20)
 */
export function updateRssiHistory(store, key, rssi, maxLen = 20) {
  if (!store.has(key)) store.set(key, []);
  const hist = store.get(key);
  hist.push(rssi);
  if (hist.length > maxLen) hist.shift();
}

/** Human-readable signal strength label from RSSI dBm value */
export function rssiToLabel(rssi) {
  if (rssi >= -50) return { label: "Excellent", color: "emerald" };
  if (rssi >= -65) return { label: "Good",      color: "emerald" };
  if (rssi >= -75) return { label: "Fair",      color: "amber"   };
  if (rssi >= -85) return { label: "Weak",      color: "amber"   };
  return                   { label: "Very Weak","color": "rose"   };
}

/** Estimate approximate distance from RSSI using path-loss model.
 *  txPower defaults to -59 dBm (typical BLE beacon at 1 m).
 */
export function rssiToDistance(rssi, txPower = -59) {
  if (rssi === 0) return -1;
  const ratio = rssi / txPower;
  if (ratio < 1) return Math.pow(ratio, 10).toFixed(2);
  const d = 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
  return d.toFixed(2);
}
