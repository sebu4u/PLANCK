"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AnonLimitLockedContent({
  children,
  active,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  if (!active) return <>{children}</>;

  return (
    <div className={cn("relative overflow-hidden rounded-xl min-h-[100px]", className)}>
      <div className="blur-[11px] select-none pointer-events-none opacity-[0.92]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-4 py-6 text-center backdrop-blur-[1px]">
        <p className="text-sm font-medium text-white max-w-[280px] leading-snug">
          Ai nevoie de un cont pentru a vedea răspunsul complet.
        </p>
        <Button asChild size="sm" className="bg-white text-black hover:bg-gray-100 font-medium">
          <Link href="/login">Creează cont sau autentifică-te</Link>
        </Button>
      </div>
    </div>
  );
}
