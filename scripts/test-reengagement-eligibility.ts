#!/usr/bin/env npx tsx
/**
 * Local smoke tests for re-engagement eligibility logic.
 * Run: npx tsx scripts/test-reengagement-eligibility.ts
 */

import {
  daysInactiveSince,
  getEligibleTier,
  shouldSendReengagementEmail,
  TIER4_RECURRENCE_DAYS,
} from "../lib/reengagement/eligibility"
import type { ReengagementSendRecord } from "../lib/reengagement/types"

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++
    console.log(`  OK: ${label}`)
  } else {
    failed++
    console.error(`  FAIL: ${label}`)
  }
}

function isoDaysAgo(days: number, from = new Date()): string {
  const d = new Date(from)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

console.log("Tier eligibility thresholds")
assert(getEligibleTier(3) === null, "3 days → no tier")
assert(getEligibleTier(4) === 1, "4 days → tier 1")
assert(getEligibleTier(8) === 1, "8 days → tier 1")
assert(getEligibleTier(9) === 2, "9 days → tier 2")
assert(getEligibleTier(17) === 2, "17 days → tier 2")
assert(getEligibleTier(18) === 3, "18 days → tier 3")
assert(getEligibleTier(29) === 3, "29 days → tier 3")
assert(getEligibleTier(30) === 4, "30 days → tier 4")
assert(getEligibleTier(35) === 4, "35 days → tier 4")

console.log("\nTier 1 sent only once")
const tier1Sent: ReengagementSendRecord[] = [
  { tier: 1, sent_at: isoDaysAgo(1), status: "sent" },
]
assert(
  shouldSendReengagementEmail(5, tier1Sent).send === false,
  "tier 1 already sent → skip"
)
assert(
  shouldSendReengagementEmail(5, []).send === true,
  "tier 1 never sent → send"
)

console.log("\nTier 4 recurrence")
const now = new Date("2026-06-21T12:00:00.000Z")
const tier4First: ReengagementSendRecord[] = [
  { tier: 4, sent_at: "2026-05-07T12:00:00.000Z", status: "sent" },
]
// 35 days inactive, last tier4 send 45 days ago → send
assert(
  shouldSendReengagementEmail(35, tier4First, now).send === true,
  "tier 4: 45 days since last send → send again"
)
const tier4Recent: ReengagementSendRecord[] = [
  { tier: 4, sent_at: "2026-06-10T12:00:00.000Z", status: "sent" },
]
assert(
  shouldSendReengagementEmail(35, tier4Recent, now).send === false,
  "tier 4: 11 days since last send → skip (cooldown)"
)

console.log("\nHighest tier wins (skip lower tiers)")
assert(
  shouldSendReengagementEmail(35, []).tier === 4,
  "35 days inactive → tier 4 not tier 1"
)

console.log("\nDays inactive calculation")
const lastActivity = new Date("2026-06-17T23:00:00.000Z")
const refNow = new Date("2026-06-21T10:00:00.000Z")
const inactive = daysInactiveSince(lastActivity, refNow)
assert(inactive >= 3 && inactive <= 4, `days inactive ~4 (got ${inactive})`)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)

console.log(`Tier 4 recurrence constant: ${TIER4_RECURRENCE_DAYS} days`)
