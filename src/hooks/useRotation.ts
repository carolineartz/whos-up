import { useCallback, useEffect, useState } from "react"
import { advance, init, removeAt, type ListId, type RotationState } from "@/lib/rotation"

const STORAGE_KEY = "whos-up:v1"

type Stored = {
  state: RotationState | null
  previous: RotationState | null
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { state: null, previous: null }
    const parsed = JSON.parse(raw) as Stored
    return {
      state: parsed.state ?? null,
      previous: parsed.previous ?? null,
    }
  } catch {
    return { state: null, previous: null }
  }
}

export function useRotation() {
  const [state, setState] = useState<RotationState | null>(() => load().state)
  const [previous, setPrevious] = useState<RotationState | null>(() => load().previous)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, previous }))
  }, [state, previous])

  const start = useCallback((list1: string[], list2: string[]) => {
    setPrevious(null)
    setState(init(list1, list2))
  }, [])

  const kick = useCallback(() => {
    setState((current) => {
      if (!current) return current
      setPrevious(current)
      return advance(current)
    })
  }, [])

  const remove = useCallback((list: ListId, index: number) => {
    setState((current) => {
      if (!current) return current
      setPrevious(current)
      return removeAt(current, list, index)
    })
  }, [])

  const undo = useCallback(() => {
    if (!previous) return
    setState(previous)
    setPrevious(null)
  }, [previous])

  const reset = useCallback(() => {
    setPrevious(null)
    setState(null)
  }, [])

  return {
    state,
    canUndo: previous !== null,
    start,
    kick,
    remove,
    undo,
    reset,
  }
}
