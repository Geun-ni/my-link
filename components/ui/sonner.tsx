"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { RiCheckboxCircleLine, RiInformationLine, RiErrorWarningLine, RiCloseCircleLine, RiLoaderLine } from "@remixicon/react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      gap={8}
      icons={{
        success: (
          <RiCheckboxCircleLine className="size-4" />
        ),
        info: (
          <RiInformationLine className="size-4" />
        ),
        warning: (
          <RiErrorWarningLine className="size-4" />
        ),
        error: (
          <RiCloseCircleLine className="size-4" />
        ),
        loading: (
          <RiLoaderLine className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--width": "360px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !rounded-2xl !shadow-xl !shadow-fuchsia-100/30 dark:!shadow-purple-900/30 !border !border-fuchsia-100/60 dark:!border-purple-700/40 !backdrop-blur-xl",
          title: "!font-semibold !text-sm",
          description: "!text-xs !text-slate-500 dark:!text-slate-400",
          success:
            "!bg-white/95 dark:!bg-purple-950/95 [&>[data-icon]]:!text-fuchsia-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
