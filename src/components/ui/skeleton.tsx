import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton. Can be a Tailwind class like "w-full" or a custom value. */
  className?: string;
}

/**
 * Skeleton loader component for displaying loading placeholders.
 * Use instead of spinners for a more polished loading experience.
 * 
 * @example
 * <Skeleton className="h-4 w-[250px]" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/10",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for text lines with realistic line heights.
 */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-4/5" : "w-full" // Last line is shorter
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for cards with image, title, and description.
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4", className)}>
      {/* Image placeholder */}
      <Skeleton className="h-32 w-full rounded-xl" />
      {/* Title */}
      <Skeleton className="h-6 w-2/3" />
      {/* Description */}
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Skeleton for avatar circles.
 */
function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />;
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar };
