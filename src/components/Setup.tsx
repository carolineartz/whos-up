import { useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  knownList1?: string[]
  knownList2?: string[]
  onStart: (list1: string[], list2: string[]) => void
}

export function Setup({ knownList1 = [], knownList2 = [], onStart }: Props) {
  const [added1, setAdded1] = useState<string[]>([])
  const [added2, setAdded2] = useState<string[]>([])
  const canStart = added1.length > 0 && added2.length > 0

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">Who's Up?</h1>
        <p className="text-sm text-muted-foreground">Add who's playing today.</p>
      </header>

      <div className="flex flex-1 flex-col gap-6">
        <NamePicker
          label="List 1"
          accent="decoration-list-1"
          known={knownList1}
          added={added1}
          onChange={setAdded1}
        />
        <NamePicker
          label="List 2"
          accent="decoration-list-2"
          known={knownList2}
          added={added2}
          onChange={setAdded2}
        />
      </div>

      <Button
        className="h-14 w-full text-base"
        disabled={!canStart}
        onClick={() => onStart(added1, added2)}
      >
        Start rotation
      </Button>
    </main>
  )
}

function NamePicker({
  label,
  accent,
  known,
  added,
  onChange,
}: {
  label: string
  accent: string
  known: string[]
  added: string[]
  onChange: (names: string[]) => void
}) {
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimer = useRef<number | null>(null)

  const addedLower = new Set(added.map((n) => n.toLowerCase()))
  const q = input.trim().toLowerCase()
  const suggestions = known
    .filter((n) => !addedLower.has(n.toLowerCase()))
    .filter((n) => q === "" || n.toLowerCase().includes(q))
    .slice(0, 8)

  const add = (name: string) => {
    const t = name.trim()
    setInput("")
    if (!t || addedLower.has(t.toLowerCase())) return
    onChange([...added, t])
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span
          className={cn(
            "text-sm font-bold underline decoration-[3px] underline-offset-4",
            accent,
          )}
        >
          {label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{added.length}</span>
      </div>

      {added.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {added.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pr-1 pl-3 text-sm"
            >
              {n}
              <button
                type="button"
                onClick={() => onChange(added.filter((x) => x !== n))}
                aria-label={`Remove ${n}`}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 120)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add(input)
            }
          }}
          placeholder="Type a name…"
          autoCapitalize="words"
          autoComplete="off"
          enterKeyHint="done"
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-lg">
            {suggestions.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (blurTimer.current) window.clearTimeout(blurTimer.current)
                    add(n)
                  }}
                  className="block w-full px-3 py-2 text-left text-base hover:bg-muted"
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
