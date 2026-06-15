import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: "default" | "success" | "warning" | "danger" | "muted" }) {
  const variants = {
    default: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    danger: "bg-red-500/15 text-red-300 border-red-500/20",
    muted: "bg-white/5 text-zinc-400 border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
