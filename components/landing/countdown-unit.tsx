export function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(124,92,252,0.15)] ring-1 ring-[#EBE8FF] sm:h-16 sm:w-16">
        <span className="text-2xl font-black tabular-nums text-[#7C5CFC] sm:text-3xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:text-xs">
        {label}
      </span>
    </div>
  )
}
