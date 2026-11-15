import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
  containerClassName?: string;
}

export function TextInput({
  label,
  error,
  hint,
  icon: Icon,
  trailing,
  className,
  containerClassName,
  id,
  ...props
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
        ) : null}

        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400",
            Icon && "pl-10",
            Boolean(trailing) && "pr-12",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-gray-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100",
            className
          )}
          {...props}
        />

        {trailing ? (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={messageId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
