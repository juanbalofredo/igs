import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/20",
        className
      )}
      {...props}
    />
  );
}
