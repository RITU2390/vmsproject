import type * as React from "react"
import { cn } from "@/lib/utils"

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: "default" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "outline" && "border border-border text-foreground",
        className,
      )}
      {...props}
    />
  )
}
