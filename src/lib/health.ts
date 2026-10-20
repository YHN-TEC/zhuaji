import type { CareEvent, DB, Pet, Reminder } from '../types'
import { addDays, daysBetween, todayISO } from './format'

export function petEvents(db: DB | null, petId?: string) {
  if (!db || !petId) return []
  return db.events.filter((e) => e.petId === petId).sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function weightSeries(events: CareEvent[]) {
  return events
    .filter((e) => e.type === 'weight' && typeof e.weight === 'number')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((e) => ({ date: e.date, weight: e.weight as number }))
}

export function latestWeight(events: CareEvent[]) {
  const s = weightSeries(events)
  return s.length ? s[s.length - 1] : undefined
}

export function weightChange(events: CareEvent[], days = 30) {
  const s = weightSeries(events)
  if (s.length < 2) return undefined
  const last = s[s.length - 1]
  const target = addDays(last.date, -days)
  const base = [...s].reverse().find((p) => p.date <= target) ?? s[0]
  return Number((last.weight - base.weight).toFixed(1))
}

export function nextReminder(db: DB | null, petId?: string, kind?: Reminder['kind']) {
  if (!db || !petId) return undefined
  return db.reminders
    .filter((r) => r.petId === petId && !r.done && (kind ? r.kind === kind : true))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0]
}

export function dueToday(db: DB | null, petId?: string) {
  if (!db || !petId) return []
  return db.reminders
    .filter((r) => r.petId === petId && !r.done && daysBetween(todayISO(), r.dueDate) <= 7)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
}

export function lastOfType(events: CareEvent[], type: CareEvent['type']) {
  return events.find((e) => e.type === type)
}

export function vaccineProgress(events: CareEvent[], pet: Pet | null) {
  const vaccines = events.filter((e) => e.type === 'vaccine')
  const core = pet?.species === 'dog' ? 2 : 2
  return { done: Math.min(vaccines.length, core), total: core, last: vaccines[0] }
}

export function petAgeMonths(pet: Pet | null) {
  if (!pet?.date) return 0
  return Math.max(0, Math.floor(daysBetween(pet.date, todayISO()) / 30.44))
}
