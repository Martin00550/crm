import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
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
      },
      size: {
        default: "h-12 px-8 rounded-full",
        sm: "h-9 rounded-full px-4 text-[10px]",
        lg: "h-14 rounded-full px-10 text-base",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
