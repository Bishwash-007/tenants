"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const REFRESH_INTERVAL_MS = 10 * 60 * 1000
const MIN_REFRESH_GAP_MS = 60 * 1000

export function SessionKeeper() {
  const router = useRouter()

  useEffect(() => {
    let lastRefresh = Date.now()
    let cancelled = false

    async function refresh() {
      if (cancelled) {
        return
      }

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "x-session-keeper": "1" },
        })

        if (response.status === 401) {
          router.replace("/login?error=session")
          return
        }
      } catch {
        // A transient network failure should not sign the user out.
      }
    }

    const interval = window.setInterval(() => {
      lastRefresh = Date.now()
      void refresh()
    }, REFRESH_INTERVAL_MS)

    function onVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefresh > MIN_REFRESH_GAP_MS
      ) {
        lastRefresh = Date.now()
        void refresh()
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [router])

  return null
}
