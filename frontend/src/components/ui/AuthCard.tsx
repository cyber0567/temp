import { type ReactNode } from "react";
import { Card } from "@/components/ui/shadcn/card";
import { cn } from "@/lib/utils";

export function AuthCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-200 dark:bg-white",
        className
      )}
    >
      {children}
    </Card>
  );
}
