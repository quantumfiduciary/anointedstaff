import { useEffect, useState } from "react"

export type PreferredOs = "windows" | "mac" | "linux"

export function detectOs(): PreferredOs {
  if (typeof navigator === "undefined") return "windows"
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("mac")) return "mac"
  if (ua.includes("linux")) return "linux"
  return "windows"
}

export function usePreferredOs() {
  const [os, setOs] = useState<PreferredOs>("windows")
  useEffect(() => {
    setOs(detectOs())
  }, [])
  return os
}
