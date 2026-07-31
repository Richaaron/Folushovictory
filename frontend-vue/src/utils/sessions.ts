/**
 * Generates a list of academic session options (e.g. "2024/2025")
 * spanning from a base year to (currentYear + 2), always including
 * the current academic year and one future year.
 */
export function generateSessionOptions(): string[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  // Academic year starts around September; if we're before August, the current
  // academic session started in the previous calendar year.
  const sessionStartYear = now.getMonth() >= 7 ? currentYear : currentYear - 1

  const sessions: string[] = []
  // Generate from 4 years back to 2 years ahead
  for (let y = sessionStartYear - 4; y <= sessionStartYear + 2; y++) {
    sessions.push(`${y}/${y + 1}`)
  }
  return sessions
}

/**
 * Returns the current academic session string e.g. "2026/2027"
 */
export function getCurrentSession(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const sessionStartYear = now.getMonth() >= 7 ? currentYear : currentYear - 1
  return `${sessionStartYear}/${sessionStartYear + 1}`
}
