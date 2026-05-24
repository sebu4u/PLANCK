import { playButtonClickSound } from "@/lib/platform-sounds"

/** Short UI click for primary CTAs (e.g. `.dashboard-start-glow` buttons/links). */
export function playDashboardStartButtonClickSound(): void {
  playButtonClickSound()
}
