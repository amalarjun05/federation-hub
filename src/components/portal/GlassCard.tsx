import { cn } from "@/lib/utils";
import { ReactNode, CSSProperties } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'bordered' | 'subtle' | 'dark';
  hover?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export function GlassCard({ 
  children, 
  className = "", 
  variant = "default",
  hover = false,
  onClick,
  style,
}: GlassCardProps) {
  const variants = {
    default: "glass",
    glass: "glass",
    gradient: "gradient-border glass",
    bordered: "glass-strong",
    subtle: "glass-subtle",
    dark: "glass-dark",
  };

  return (
    <div 
      className={cn(
        "rounded-2xl p-4 transition-all duration-300",
        variants[variant],
        hover && "card-hover cursor-pointer glow-hover",
        onClick && "cursor-pointer glow-hover",
        className
      )} 
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

export function GlassCardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-bold text-foreground flex items-center gap-2", className)}>
      {children}
    </h3>
  );
}

export function GlassCardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
