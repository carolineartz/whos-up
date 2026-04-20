import { useState } from "react"
import { Setup } from "@/components/Setup"
import { Game } from "@/components/Game"
import { useRotation } from "@/hooks/useRotation"

function App() {
  const { state, canUndo, start, kick, remove, undo } = useRotation()
  const [editing, setEditing] = useState(false)

  if (!state || editing) {
    return (
      <Setup
        initialList1={state?.list1 ?? []}
        initialList2={state?.list2 ?? []}
        onStart={(l1, l2) => {
          start(l1, l2)
          setEditing(false)
        }}
        onCancel={state ? () => setEditing(false) : undefined}
      />
    )
  }

  return (
    <Game
      state={state}
      canUndo={canUndo}
      onKick={kick}
      onRemove={remove}
      onUndo={undo}
      onEdit={() => setEditing(true)}
    />
  )
}

export default App
