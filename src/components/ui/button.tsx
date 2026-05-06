import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-slate-950 text-white hover:bg-slate-900 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/10",
        outline:
          "border-2 border-slate-950 bg-transparent hover:bg-slate-950 hover:text-white text-on-surface shadow-sm transition-all duration-300",
        secondary:
          "bg-secondary text-white hover:opacity-95 shadow-[0_10px_20px_-10px_rgba(34,197,94,0.3)] hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.4)]",
        ghost: "hover:bg-black/5 text-on-surface",
        link: "text-secondary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-secondary to-primary text-white hover:opacity-90 shadow-xl shadow-secondary/20",
        white: "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10",
      },
      size: {
        default: "h-12 px-8 rounded-2xl",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-[20px] px-10 text-base",
        xl: "h-16 rounded-[24px] px-12 text-lg",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        type={props.type || "button"}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2 shrink-0">{leftIcon}</span>
        )}
        <span className={cn(isLoading && "opacity-0")}>{children}</span>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {!isLoading && rightIcon && (
          <span className="ml-2 shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
