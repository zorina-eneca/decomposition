import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === "date") {
      try {
        (e.target as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
      } catch {}
    }
    props.onFocus?.(e);
  };

  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border-0 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      onFocus={handleFocus}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
