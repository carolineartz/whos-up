import { useCallback, useEffect, useState } from "react"
import {
  addToList,
  init,
  markKicked,
  removeAt,
  reorderList,
  swapUpAndDeck,
  type ListId,
  type RotationState,
} from "@/lib/rotation"

const STORAGE_KEY = "whos-up:v1"
const HISTORY_CAP = 50

type Stored = {
  state: RotationState | null
  past: RotationState[]
  future: RotationState[]
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { state: null, past: [], future: [] }
    const parsed = JSON.parse(raw) as Partial<Stored> & {
      previous?: RotationState | null
    }
    return {
      state: parsed.state ?? null,
      // Migrate the old single-step shape ({ state, previous }) into a one-entry past.
      past: Array.isArray(parsed.past)
        ? parsed.past
        : parsed.previous
          ? [parsed.previous]
          : [],
      future: Array.isArray(parsed.future) ? parsed.future : [],
    }
  } catch {
    return { state: null, past: [], future: [] }
  }
}

export function useRotation() {
  const initial = load()
  const [state, setState] = useState<RotationState | null>(initial.state)
  const [past, setPast] = useState<RotationState[]>(initial.past)
  const [future, setFuture] = useState<RotationState[]>(initial.future)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, past, future }))
  }, [state, past, future])

  // Apply a mutation, recording it on the undo stack (skipping no-ops).
  const apply = useCallback((fn: (s: RotationState) => RotationState) => {
    setState((current) => {
      if (!current) return current
      const next = fn(current)
      if (next === current) return current
      setPast((p) => [...p, current].slice(-HISTORY_CAP))
      setFuture([])
      return next
    })
  }, [])

  const start = useCallback((list1: string[], list2: string[]) => {
    setPast([])
    setFuture([])
    setState(init(list1, list2))
  }, [])

  const kicked = useCallback(
    (list: ListId, index: number) => apply((s) => markKicked(s, list, index)),
    [apply],
  )

  const reorder = useCallback(
    (list: ListId, newRoundOrder: string[], makeUp = false) =>
      apply((s) => reorderList(s, list, newRoundOrder, makeUp)),
    [apply],
  )

  const add = useCallback(
    (list: ListId, name: string) => apply((s) => addToList(s, list, name)),
    [apply],
  )

  const remove = useCallback(
    (list: ListId, index: number) => apply((s) => removeAt(s, list, index)),
    [apply],
  )

  const swap = useCallback(() => apply(swapUpAndDeck), [apply])

  const undo = useCallback(() => {
    if (past.length === 0 || !state) return
    setState(past[past.length - 1])
    setFuture((f) => [state, ...f])
    setPast((p) => p.slice(0, -1))
  }, [past, state])

  const redo = useCallback(() => {
    if (future.length === 0 || !state) return
    setState(future[0])
    setPast((p) => [...p, state].slice(-HISTORY_CAP))
    setFuture((f) => f.slice(1))
  }, [future, state])

  const reset = useCallback(() => {
    setPast([])
    setFuture([])
    setState(null)
  }, [])

  return {
    state,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    start,
    kicked,
    reorder,
    add,
    remove,
    swap,
    undo,
    redo,
    reset,
  }
}
