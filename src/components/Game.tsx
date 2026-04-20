import { useMemo, useRef, useState } from "react"
import { Undo2, UserMinus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { canAdvance, upNext, type ListId, type RotationState } from "@/lib/rotation"

const UPCOMING_PREVIEW_COUNT = 60

type Props = {
  state: RotationState
  canUndo: boolean
  onKick: () => void
  onRemove: (list: ListId, index: number) => void
  onUndo: () => void
  onEdit: () => void
}

type Slot = { name: string; list: ListId; sourceIndex: number }

export function Game({ state, canUndo, onKick, onRemove, onUndo, onEdit }: Props) {
  const preview = useMemo<Slot[]>(() => {
    const entries = upNext(state, UPCOMING_PREVIEW_COUNT)
    return entries.map((e) => {
      const source = e.list === 1 ? state.list1 : state.list2
      return { name: e.name, list: e.list, sourceIndex: source.indexOf(e.name) }
    })
  }, [state])

  const up = preview[0]
  const onDeck = preview[1]
  const rest = preview.slice(2)
  const kickable = canAdvance(state)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolledFromTop, setScrolledFromTop] = useState(false)
  const handleUpcomingScroll = () => {
    const el = scrollRef.current
    if (el) setScrolledFromTop(el.scrollTop > 4)
  }
  const upcomingMask = scrolledFromTop
    ? "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)"
    : "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)"

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          <Undo2 />
        </Button>
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Who's Up?
        </span>
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit rosters">
          <Pencil />
        </Button>
      </header>

      {up ? (
        <>
          <section className="mt-8">
            <Label>Up</Label>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h2 className="text-6xl leading-[1.05] font-medium tracking-tight break-words">
                {up.name}
              </h2>
              <RemoveButton onClick={() => onRemove(up.list, up.sourceIndex)} size="default" />
            </div>
          </section>

          {onDeck && (
            <section className="mt-8">
              <Label>On deck</Label>
              <div className="mt-1 flex items-center justify-between gap-3">
                <h3 className="animate-[soft-pulse_2s_ease-in-out_infinite] text-3xl font-medium break-words">
                  {onDeck.name}
                </h3>
                <RemoveButton
                  onClick={() => onRemove(onDeck.list, onDeck.sourceIndex)}
                  size="small"
                />
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="mt-30 flex min-h-0 flex-1 flex-col">
              <Label>Upcoming</Label>
              <div
                ref={scrollRef}
                onScroll={handleUpcomingScroll}
                className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
                style={{ maskImage: upcomingMask, WebkitMaskImage: upcomingMask }}
              >
                <ul className="flex flex-col">
                  {rest.map((slot, i) => (
                    <li
                      key={`${slot.list}-${slot.name}-${i}`}
                      className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 last:border-none"
                    >
                      <span className="truncate text-lg">{slot.name}</span>
                      <RemoveButton
                        onClick={() => onRemove(slot.list, slot.sourceIndex)}
                        size="tiny"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="mt-12 flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-lg font-medium">Rotation is empty</p>
          <p className="text-sm text-muted-foreground">
            Both lists need at least one name.
          </p>
          <Button variant="outline" className="mt-2" onClick={onEdit}>
            Edit rosters
          </Button>
        </div>
      )}

      <div className="mt-6 pt-3">
        <Button
          className="h-16 w-full text-lg font-medium"
          onClick={onKick}
          disabled={!kickable}
        >
          Kicked
        </Button>
      </div>
    </main>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function RemoveButton({
  onClick,
  size,
}: {
  onClick: () => void
  size: "default" | "small" | "tiny"
}) {
  const sizeClass =
    size === "default" ? "icon-lg" : size === "small" ? "icon" : "icon-sm"
  return (
    <Button
      variant="ghost"
      size={sizeClass}
      onClick={onClick}
      aria-label="Mark injured (remove)"
      className="text-muted-foreground hover:text-destructive"
    >
      <UserMinus />
    </Button>
  )
}
