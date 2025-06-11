"use client"

import type * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"

export function Providers({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("anon_credits") === null) {
      localStorage.setItem("anon_credits", "50");
    }
  }, []);
  
  return (
    <SessionProvider>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </SessionProvider>
  )
}

