import { Setup } from "@/components/Setup"
import { Game } from "@/components/Game"
import { useRotation } from "@/hooks/useRotation"

function App() {
  const { state, canUndo, canRedo, start, kicked, reorder, add, remove, undo, redo, reset } =
    useRotation()

  if (!state) {
    return <Setup onStart={start} />
  }

  return (
    <Game
      state={state}
      canUndo={canUndo}
      canRedo={canRedo}
      onKicked={kicked}
      onReorder={reorder}
      onAdd={add}
      onRemove={remove}
      onUndo={undo}
      onRedo={redo}
      onClear={reset}
    />
  )
}

export default App
