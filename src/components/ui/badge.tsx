import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-white shadow shadow-secondary/10",
        secondary:
          "border-transparent bg-black text-white shadow shadow-black/10",
        destructive:
          "border-transparent bg-red-500 text-white shadow shadow-red-500/10",
        outline: "text-on-surface border-black/10",
        success: "border-transparent bg-green-500 text-white shadow shadow-green-500/10",
        warning: "border-transparent bg-orange-500 text-white shadow shadow-orange-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
