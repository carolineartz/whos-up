export type ListId = 1 | 2

export type RotationState = {
  list1: string[]
  list2: string[]
  idx1: number
  idx2: number
  nextList: ListId
}

export function init(list1: string[], list2: string[]): RotationState {
  return { list1, list2, idx1: 0, idx2: 0, nextList: 1 }
}

export function upNext(state: RotationState, count: number): Array<{ name: string; list: ListId }> {
  const out: Array<{ name: string; list: ListId }> = []
  let { idx1, idx2, nextList } = state
  const { list1, list2 } = state

  for (let i = 0; i < count; i++) {
    if (nextList === 1 && list1.length > 0) {
      out.push({ name: list1[idx1], list: 1 })
      idx1 = (idx1 + 1) % list1.length
      nextList = 2
    } else if (nextList === 2 && list2.length > 0) {
      out.push({ name: list2[idx2], list: 2 })
      idx2 = (idx2 + 1) % list2.length
      nextList = 1
    } else {
      break
    }
  }
  return out
}

export function advance(state: RotationState): RotationState {
  if (state.nextList === 1) {
    if (state.list1.length === 0) return state
    return { ...state, idx1: (state.idx1 + 1) % state.list1.length, nextList: 2 }
  }
  if (state.list2.length === 0) return state
  return { ...state, idx2: (state.idx2 + 1) % state.list2.length, nextList: 1 }
}

export function removeAt(state: RotationState, list: ListId, index: number): RotationState {
  const source = list === 1 ? state.list1 : state.list2
  if (index < 0 || index >= source.length) return state
  const next = source.filter((_, i) => i !== index)
  const currentIdx = list === 1 ? state.idx1 : state.idx2
  let newIdx = index < currentIdx ? currentIdx - 1 : currentIdx
  newIdx = next.length > 0 ? newIdx % next.length : 0
  return list === 1
    ? { ...state, list1: next, idx1: newIdx }
    : { ...state, list2: next, idx2: newIdx }
}

export function canAdvance(state: RotationState): boolean {
  return state.nextList === 1 ? state.list1.length > 0 : state.list2.length > 0
}

// Build a list's names in current round order (starting at its pointer).
function roundOrder(source: string[], idx: number): string[] {
  return Array.from({ length: source.length }, (_, i) => source[(idx + i) % source.length])
}

// Write a round-ordered array back into array space, pointer unchanged.
function fromRoundOrder(rounds: string[], idx: number): string[] {
  const out = new Array<string>(rounds.length)
  for (let i = 0; i < rounds.length; i++) out[(idx + i) % rounds.length] = rounds[i]
  return out
}

// The person at `index` in `list` kicked this turn. Move them to the front of their
// list's current round, advance that list's pointer past them, and set nextList to the
// other list so alternation stays sensible — whether they were the expected kicker or
// someone going out of order.
export function markKicked(state: RotationState, list: ListId, index: number): RotationState {
  const source = list === 1 ? state.list1 : state.list2
  const idx = list === 1 ? state.idx1 : state.idx2
  const n = source.length
  if (n === 0 || index < 0 || index >= n) return state

  const k = (((index - idx) % n) + n) % n
  let newSource = source
  if (k !== 0) {
    const rounds = roundOrder(source, idx)
    const [kicker] = rounds.splice(k, 1)
    rounds.unshift(kicker)
    newSource = fromRoundOrder(rounds, idx)
  }

  const newIdx = (idx + 1) % n
  const other: ListId = list === 1 ? 2 : 1
  return list === 1
    ? { ...state, list1: newSource, idx1: newIdx, nextList: other }
    : { ...state, list2: newSource, idx2: newIdx, nextList: other }
}

// Replace a list's round order wholesale (used by drag-and-drop reordering). `newRoundOrder`
// is the list's names in their new current-round order; the pointer stays put, so the first
// name becomes the current front.
export function reorderList(
  state: RotationState,
  list: ListId,
  newRoundOrder: string[],
): RotationState {
  const source = list === 1 ? state.list1 : state.list2
  if (newRoundOrder.length !== source.length) return state
  const idx = list === 1 ? state.idx1 : state.idx2
  const newSource = fromRoundOrder(newRoundOrder, idx)
  return list === 1
    ? { ...state, list1: newSource }
    : { ...state, list2: newSource }
}

// Add a (late-arriving) person to the bottom of a list's current round — they come up last
// among their group this time around. The pointer is unchanged.
export function addToList(state: RotationState, list: ListId, name: string): RotationState {
  const trimmed = name.trim()
  if (!trimmed) return state
  const source = list === 1 ? state.list1 : state.list2
  const idx = list === 1 ? state.idx1 : state.idx2
  const round = roundOrder(source, idx)
  round.push(trimmed)
  const newSource = fromRoundOrder(round, idx)
  return list === 1
    ? { ...state, list1: newSource }
    : { ...state, list2: newSource }
}

// Reorder a person within their own list's round order without recording a kick.
// dir: -1 = earlier (up), +1 = later (down). No-op at the round's bounds.
export function moveInList(
  state: RotationState,
  list: ListId,
  index: number,
  dir: -1 | 1,
): RotationState {
  const source = list === 1 ? state.list1 : state.list2
  const idx = list === 1 ? state.idx1 : state.idx2
  const n = source.length
  if (n < 2 || index < 0 || index >= n) return state

  const k = (((index - idx) % n) + n) % n
  const j = k + dir
  if (j < 0 || j >= n) return state

  const rounds = roundOrder(source, idx)
  ;[rounds[k], rounds[j]] = [rounds[j], rounds[k]]
  const newSource = fromRoundOrder(rounds, idx)
  return list === 1 ? { ...state, list1: newSource } : { ...state, list2: newSource }
}
