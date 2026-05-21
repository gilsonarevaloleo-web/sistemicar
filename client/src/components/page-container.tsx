import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 md:px-6 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl",
        className
      )}
    >
      {children}
    </div>
  );
}
