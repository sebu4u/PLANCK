export const USER_TYPES = ["elev", "parinte", "profesor"] as const

export type UserType = (typeof USER_TYPES)[number]

export const USER_TYPE_LABELS: Record<UserType, string> = {
  elev: "Elev",
  parinte: "Părinte",
  profesor: "Profesor",
}

const userTypeSet = new Set<string>(USER_TYPES)

export function isUserType(value: unknown): value is UserType {
  return typeof value === "string" && userTypeSet.has(value)
}

export function normalizeUserType(value: unknown): UserType {
  return isUserType(value) ? value : "elev"
}
