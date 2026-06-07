import { Setup } from "@/components/Setup"
import { Game } from "@/components/Game"
import { useRotation } from "@/hooks/useRotation"
import { useRoster } from "@/hooks/useRoster"
import type { ListId } from "@/lib/rotation"

function App() {
  const { state, canUndo, canRedo, start, kicked, reorder, add, remove, swap, undo, redo, reset } =
    useRotation()
  const { roster, remember } = useRoster()

  if (!state) {
    return (
      <Setup
        knownList1={roster.list1}
        knownList2={roster.list2}
        onStart={(list1, list2) => {
          remember(list1, list2)
          start(list1, list2)
        }}
      />
    )
  }

  return (
    <Game
      state={state}
      canUndo={canUndo}
      canRedo={canRedo}
      onKicked={kicked}
      onReorder={reorder}
      onAdd={(list: ListId, name: string) => {
        remember(list === 1 ? [name] : [], list === 2 ? [name] : [])
        add(list, name)
      }}
      onRemove={remove}
      onSwap={swap}
      onUndo={undo}
      onRedo={redo}
      onClear={reset}
    />
  )
}

export default App
