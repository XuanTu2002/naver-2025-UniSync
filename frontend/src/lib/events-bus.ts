export const EVENTS_CHANGED = 'events:changed'

export function emitEventsChanged() {
  window.dispatchEvent(new CustomEvent(EVENTS_CHANGED))
}

export function onEventsChanged(handler: () => void) {
  window.addEventListener(EVENTS_CHANGED, handler)
  return () => window.removeEventListener(EVENTS_CHANGED, handler)
}

