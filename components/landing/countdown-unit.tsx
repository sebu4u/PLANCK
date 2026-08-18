export function CountdownUnit({
  value,
  label,
  size = "md",
}: {
  value: number
  label: string
  size?: "sm" | "md"
}) {
  const compact = size === "sm"

  return (
    <div className="flex flex-col items-center">
      <div
        className={
          compact
            ? "flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-[0_2px_8px_rgba(124,92,252,0.12)] ring-1 ring-[#EBE8FF] sm:h-10 sm:w-10"
            : "flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(124,92,252,0.15)] ring-1 ring-[#EBE8FF] sm:h-16 sm:w-16"
        }
      >
        <span
          className={
            compact
              ? "text-sm font-black tabular-nums text-[#7C5CFC] sm:text-base"
              : "text-2xl font-black tabular-nums text-[#7C5CFC] sm:text-3xl"
          }
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        className={
          compact
            ? "mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-400"
            : "mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:text-xs"
        }
      >
        {label}
      </span>
    </div>
  )
}
