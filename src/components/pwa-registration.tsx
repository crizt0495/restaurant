"use client"

import * as React from "react"

export function PwaRegistration() {
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // silent fail in dev
    })
  }, [])
  return null
}