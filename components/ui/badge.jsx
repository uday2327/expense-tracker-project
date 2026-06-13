import { cn } from "@/lib/utils";

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm bg-muted px-2 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

