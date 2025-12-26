import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'busy' | 'offline';
  className?: string;
}

export function UserAvatar({ 
  name, 
  src, 
  size = "md", 
  status,
  className = "" 
}: UserAvatarProps) {
  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-14 h-14 text-lg",
  };

  const statusSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
    xl: "w-3 h-3",
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className={cn(
            "rounded-full object-cover border border-border",
            sizes[size]
          )} 
        />
      ) : (
        <div 
          className={cn(
            "rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary",
            sizes[size]
          )}
        >
          {getInitials(name)}
        </div>
      )}
      
      {status && (
        <span 
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background",
            statusSizes[size],
            status === 'online' && "status-online",
            status === 'busy' && "status-busy",
            status === 'offline' && "status-offline"
          )}
        />
      )}
    </div>
  );
}
