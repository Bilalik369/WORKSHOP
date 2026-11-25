import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15em] cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-r from-navy to-royal text-white shadow-[0_12px_30px_-10px_rgb(10_42_140/0.55)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-10px_rgb(10_42_140/0.6)] active:translate-y-0",
        outline:
          "border-[1.5px] border-navy/25 bg-white/70 text-navy backdrop-blur hover:-translate-y-0.5 hover:border-navy/60 hover:bg-white active:translate-y-0",
        mint: "bg-linear-to-r from-mint to-mint-soft text-navy-deep shadow-[0_12px_30px_-12px_rgb(31_181_154/0.7)] hover:-translate-y-0.5 active:translate-y-0",
        ghost: "text-navy hover:bg-navy/5",
        danger:
          "bg-rose-700 text-white hover:-translate-y-0.5 hover:bg-rose-800 active:translate-y-0",
        link: "text-navy underline-offset-4 hover:underline rounded-md",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[0.95rem]",
        lg: "h-13 px-8 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
