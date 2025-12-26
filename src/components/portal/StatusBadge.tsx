import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatusBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ 
  children, 
  variant = "default", 
  size = "sm",
  pulse = false,
  className = "" 
}: StatusBadgeProps) {
  const variants = {
    default: "bg-secondary text-secondary-foreground border-border",
    success: "bg-success/20 text-success border-success/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    destructive: "bg-destructive/20 text-destructive border-destructive/30",
    info: "bg-accent/20 text-accent border-accent/30",
    outline: "bg-transparent text-muted-foreground border-border",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 rounded border font-medium uppercase tracking-wider",
        variants[variant],
        sizes[size],
        pulse && "animate-pulse",
        className
      )}
    >
      {children}
    </span>
  );
}
