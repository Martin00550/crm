import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white hover:bg-black/90 shadow-lg shadow-black/10",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/10",
        outline:
          "border-2 border-black/10 bg-transparent hover:bg-black/5 text-on-surface",
        secondary:
          "bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/10",
        ghost: "hover:bg-black/5 text-on-surface",
        link: "text-secondary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-secondary to-primary text-white hover:opacity-90 shadow-xl shadow-secondary/20",
        white: "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10",
      },
      size: {
        default: "h-12 px-8 rounded-full",
        sm: "h-9 rounded-full px-4 text-[10px]",
        lg: "h-14 rounded-full px-10 text-base",
        xl: "h-16 rounded-full px-12 text-lg",
        icon: "h-10 w-10 rounded-full",
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
