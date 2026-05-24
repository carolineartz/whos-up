import { useCallback, useEffect, useState } from "react"
import type { ListId } from "@/lib/rotation"

const STORAGE_KEY = "whos-up:roster"

export type Roster = { list1: string[]; list2: string[] }

function load(): Roster {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { list1: [], list2: [] }
    const parsed = JSON.parse(raw) as Partial<Roster>
    return {
      list1: Array.isArray(parsed.list1) ? parsed.list1 : [],
      list2: Array.isArray(parsed.list2) ? parsed.list2 : [],
    }
  } catch {
    return { list1: [], list2: [] }
  }
}

// Case-insensitive union, preserving the first-seen casing and original order.
function mergeUnique(existing: string[], incoming: string[]): string[] {
  const seen = new Map(existing.map((n) => [n.toLowerCase(), n]))
  for (const n of incoming) {
    const key = n.toLowerCase()
    if (!seen.has(key)) seen.set(key, n)
  }
  return [...seen.values()]
}

// The remembered pool of known players, used to suggest names during setup. Persists
// independently of the rotation, so clearing a week's lineup never forgets people.
export function useRoster() {
  const [roster, setRoster] = useState<Roster>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roster))
  }, [roster])

  const remember = useCallback((list1: string[], list2: string[]) => {
    setRoster((r) => ({
      list1: mergeUnique(r.list1, list1),
      list2: mergeUnique(r.list2, list2),
    }))
  }, [])

  const forget = useCallback((list: ListId, name: string) => {
    const key = name.toLowerCase()
    setRoster((r) =>
      list === 1
        ? { ...r, list1: r.list1.filter((n) => n.toLowerCase() !== key) }
        : { ...r, list2: r.list2.filter((n) => n.toLowerCase() !== key) },
    )
  }, [])

  return { roster, remember, forget }
}
