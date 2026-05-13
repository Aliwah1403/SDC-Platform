import * as React from "react"

import { cn } from "@/lib/utils"

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("grid gap-4", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
}

type FieldErrorItem = {
  message?: string
}

function FieldError({
  className,
  errors,
}: {
  className?: string
  errors?: Array<FieldErrorItem | undefined>
}) {
  const messages = (errors ?? [])
    .map((error) => error?.message)
    .filter((msg): msg is string => Boolean(msg))

  if (messages.length === 0) return null

  return (
    <p data-slot="field-error" className={cn("text-sm text-destructive", className)}>
      {messages[0]}
    </p>
  )
}

export { Field, FieldError, FieldGroup, FieldLabel }
