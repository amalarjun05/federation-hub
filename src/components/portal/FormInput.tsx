import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
            "transition-colors duration-200",
            error && "border-destructive focus:border-destructive focus:ring-destructive/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
            "transition-colors duration-200 resize-none",
            error && "border-destructive focus:border-destructive focus:ring-destructive/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, options, className = "", ...props }: FormSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground",
          "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
          "transition-colors duration-200",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
