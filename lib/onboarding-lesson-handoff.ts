type HandoffListener = (active: boolean) => void

const listeners = new Set<HandoffListener>()
let active = false

function emit() {
  for (const listener of listeners) listener(active)
}

export function isOnboardingLessonHandoffActive() {
  return active
}

export function startOnboardingLessonHandoff() {
  if (active) return
  active = true
  emit()
}

export function endOnboardingLessonHandoff() {
  if (!active) return
  active = false
  emit()
}

export function subscribeOnboardingLessonHandoff(listener: HandoffListener) {
  listeners.add(listener)
  listener(active)
  return () => {
    listeners.delete(listener)
  }
}
