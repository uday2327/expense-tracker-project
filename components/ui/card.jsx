import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <section className={cn("rounded-lg border bg-white p-5 shadow-sm", className)} {...props} />;
}

