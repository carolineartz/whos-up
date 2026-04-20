import { useState } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  initialList1?: string[]
  initialList2?: string[]
  onStart: (list1: string[], list2: string[]) => void
  onCancel?: () => void
}

function parseNames(raw: string): string[] {
  return raw
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean)
}

export function Setup({ initialList1 = [], initialList2 = [], onStart, onCancel }: Props) {
  const [raw1, setRaw1] = useState(initialList1.join("\n"))
  const [raw2, setRaw2] = useState(initialList2.join("\n"))

  const list1 = parseNames(raw1)
  const list2 = parseNames(raw2)
  const canStart = list1.length > 0 && list2.length > 0

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">Who's Up?</h1>
        <p className="text-sm text-muted-foreground">One name per line.</p>
      </header>

      <div className="flex flex-1 flex-col gap-5">
        <RosterInput label="List 1" value={raw1} onChange={setRaw1} count={list1.length} />
        <RosterInput label="List 2" value={raw2} onChange={setRaw2} count={list2.length} />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          className="h-14 w-full text-base"
          disabled={!canStart}
          onClick={() => onStart(list1, list2)}
        >
          Start rotation
        </Button>
        {onCancel && (
          <Button variant="ghost" className="h-10 w-full" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </main>
  )
}

function RosterInput({
  label,
  value,
  onChange,
  count,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  count: number
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="One name per line"
        className="min-h-36 w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-base shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        spellCheck={false}
        autoCapitalize="words"
      />
    </label>
  )
}
