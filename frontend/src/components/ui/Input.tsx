"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import { Input as ShadcnInput } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, leftIcon, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="w-full">
        {label && (
          <Label
            htmlFor={inputId}
            className="mb-1.5 block text-[#333333] font-medium dark:text-zinc-300"
          >
            {label}
          </Label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]">
              {leftIcon}
            </span>
          )}
          <ShadcnInput
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 w-full rounded-xl border border-[#E0E0E0] bg-white px-4 py-2.5 text-gray-900 shadow-none focus-visible:bg-white",
              "placeholder:text-[#A0A0A0] placeholder:font-normal",
              "focus-visible:border-[#1a1d29] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a1d29]/15 focus-visible:ring-offset-0",
              "dark:border-[#E0E0E0] dark:bg-white dark:text-gray-900 dark:placeholder:text-[#A0A0A0] dark:focus-visible:border-[#1a1d29] dark:focus-visible:ring-[#1a1d29]/15",
              leftIcon && "pl-11",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20 dark:border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };
