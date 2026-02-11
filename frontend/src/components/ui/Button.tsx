"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Button as ShadcnButton } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const variantMap = {
  primary: "default",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
} as const;

const variantOverrides = {
  primary: "bg-[#1a1d29] text-white shadow hover:bg-[#252836] focus-visible:ring-[#1a1d29]",
  secondary: "bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-400",
  outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-400",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400",
} as const;

const sizeMap = { sm: "sm" as const, md: "default" as const, lg: "lg" as const };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      fullWidth,
      leftIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <ShadcnButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        className={cn(variantOverrides[variant], fullWidth && "w-full", className)}
        {...props}
      >
        {leftIcon && <span className="shrink-0 [&_svg]:size-5">{leftIcon}</span>}
        {children}
      </ShadcnButton>
    );
  }
);
Button.displayName = "Button";
export { Button };
