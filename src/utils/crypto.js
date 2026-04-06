import CryptoJS from "crypto-js";

/**
 * SHA-256 hex of UTF-8 string. Prefers Web Crypto; falls back to CryptoJS (HTTP / older browsers).
 */
export async function sha256Hex(text) {
  const data = typeof text === "string" ? text : JSON.stringify(text);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}
