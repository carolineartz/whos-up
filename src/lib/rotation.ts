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
