import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background backdrop-blur-sm transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary/90 text-primary-foreground shadow-[0_10px_28px_rgba(108,47,255,0.32)] hover:bg-primary hover:shadow-[0_14px_32px_rgba(108,47,255,0.38)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_8px_22px_rgba(255,60,117,0.24)] hover:bg-destructive/90",
        outline:
          "border border-white/30 bg-white/25 text-foreground hover:bg-white/40 dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]",
        secondary:
          "bg-white/35 text-foreground hover:bg-white/46 dark:bg-white/[0.08] dark:hover:bg-white/[0.14]",
        ghost: "text-muted-foreground hover:bg-white/22 hover:text-foreground dark:hover:bg-white/[0.08]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
