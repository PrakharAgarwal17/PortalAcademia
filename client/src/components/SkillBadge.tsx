import { getSkillIcon } from "@/lib/skillIcons";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillBadgeProps {
  skill: string;
  onRemove?: () => void;
  size?: "xs" | "sm" | "md";
  className?: string;
  showColor?: boolean;
}

export default function SkillBadge({
  skill,
  onRemove,
  size = "sm",
  className,
  showColor = true,
}: SkillBadgeProps) {
  const iconData = getSkillIcon(skill);

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-2",
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium border border-border bg-muted/80 text-foreground transition-all select-none shadow-2xs hover:border-foreground/30",
        sizeClasses[size],
        className
      )}
    >
      {iconData ? (
        <svg
          role="img"
          viewBox="0 0 24 24"
          className={cn(iconSizes[size], "shrink-0")}
          style={{ fill: showColor ? `#${iconData.hex}` : "currentColor" }}
          aria-hidden="true"
        >
          <path d={iconData.path} />
        </svg>
      ) : (
        <Sparkles className={cn(iconSizes[size], "text-muted-foreground shrink-0")} />
      )}
      <span className="truncate max-w-[170px]">{skill}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xs p-0.5 -mr-0.5 cursor-pointer"
          title={`Remove ${skill}`}
          aria-label={`Remove ${skill}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
