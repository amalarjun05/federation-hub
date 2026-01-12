import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  loading?: boolean;
}

export function ActionButton({ 
  children, 
  variant = "primary", 
  size = "md",
  className = "",
  loading = false,
  disabled,
  ...props 
}: ActionButtonProps) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 btn-glow",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border glow-hover",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary glow-hover",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_25px_hsl(0_75%_55%/0.3)]",
    outline: "border border-border bg-transparent text-foreground hover:bg-secondary glow-hover",
    success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-[0_0_25px_hsl(160_84%_45%/0.3)]",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-lg",
    md: "text-sm px-4 py-2 rounded-xl",
    lg: "text-base px-6 py-3 rounded-xl",
    icon: "p-2.5 rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
