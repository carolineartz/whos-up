import { useEffect, useMemo, useRef, useState } from "react"
import { Undo2, Redo2, Plus, X, UserMinus, CircleCheck } from "lucide-react"
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { upNext, type ListId, type RotationState } from "@/lib/rotation"

const UPCOMING_PREVIEW_COUNT = 60
const REVEAL_WIDTH = 76

type Props = {
  state: RotationState
  canUndo: boolean
  canRedo: boolean
  onKicked: (list: ListId, index: number) => void
  onReorder: (list: ListId, newRoundOrder: string[], makeUp: boolean) => void
  onAdd: (list: ListId, name: string) => void
  onRemove: (list: ListId, index: number) => void
  onSwap: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

type Slot = { name: string; list: ListId; sourceIndex: number; firstTurn: boolean }

export function Game({
  state,
  canUndo,
  canRedo,
  onKicked,
  onReorder,
  onAdd,
  onRemove,
  onSwap,
  onUndo,
  onRedo,
  onClear,
}: Props) {
  const preview = useMemo<Slot[]>(() => {
    const entries = upNext(state, UPCOMING_PREVIEW_COUNT)
    const seen = new Set<string>()
    return entries.map((e) => {
      const source = e.list === 1 ? state.list1 : state.list2
      const firstTurn = !seen.has(e.name)
      seen.add(e.name)
      return { name: e.name, list: e.list, sourceIndex: source.indexOf(e.name), firstTurn }
    })
  }, [state])

  // Only the current round (each name's first appearance) is draggable.
  const sortableIds = useMemo(
    () => preview.filter((s) => s.firstTurn).map((s) => s.name),
    [preview],
  )

  // Which row has its Remove swiped open (by preview index, unique per row).
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [adding, setAdding] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const current = preview.filter((s) => s.firstTurn)
    const from = current.findIndex((s) => s.name === active.id)
    const to = current.findIndex((s) => s.name === over.id)
    if (from < 0 || to < 0) return
    const moved = arrayMove(current, from, to)
    const list = current[from].list
    // Reorder only the dragged person's list, derived from the new flat order.
    const newRoundOrder = moved.filter((s) => s.list === list).map((s) => s.name)
    // Dropping at the very top makes this person Up (and flips the kicking group).
    onReorder(list, newRoundOrder, to === 0)
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolledFromTop, setScrolledFromTop] = useState(false)
  const handleScroll = () => {
    const el = scrollRef.current
    if (el) setScrolledFromTop(el.scrollTop > 4)
    setOpenIndex(null)
  }
  const mask = scrolledFromTop
    ? "linear-gradient(to bottom, transparent 0%, black 24px, black 100%)"
    : undefined

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-md flex-col px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmClear(true)}
          className="text-muted-foreground"
        >
          Clear
        </Button>
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Who's Up?
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <Redo2 />
          </Button>
        </div>
      </header>

      {preview.length === 0 ? (
        <div className="mt-12 flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-lg font-medium">Rotation is empty</p>
          <p className="text-sm text-muted-foreground">Both lists need at least one name.</p>
          <Button variant="outline" className="mt-2" onClick={onClear}>
            Start a new roster
          </Button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "mt-3 min-h-0 flex-1 overscroll-contain",
            adding || confirmClear ? "overflow-hidden" : "overflow-y-auto",
          )}
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => setOpenIndex(null)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-1 pb-24">
                {preview.map((slot, i) => {
                  const common = {
                    slot,
                    label: i === 0 ? "Kicking" : i === 1 ? "On deck" : null,
                    tone: (i === 0 ? "kick" : i === 1 ? "deck" : undefined) as
                      | "kick"
                      | "deck"
                      | undefined,
                    blink: i === 2 || i === 3,
                    open: openIndex === i,
                    onOpen: () => setOpenIndex(i),
                    onClose: () => setOpenIndex((c) => (c === i ? null : c)),
                    onKicked: () => {
                      setOpenIndex(null)
                      onKicked(slot.list, slot.sourceIndex)
                    },
                    onRemove: () => {
                      setOpenIndex(null)
                      onRemove(slot.list, slot.sourceIndex)
                    },
                  }
                  return slot.firstTurn ? (
                    <SortableRow key={`${slot.list}-${slot.name}`} {...common} />
                  ) : (
                    <Row key={`later-${slot.list}-${slot.name}-${i}`} {...common} />
                  )
                })}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {preview.length > 0 && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label="Add a player"
          className="absolute right-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </button>
      )}

      {confirmClear && (
        <Backdrop onClick={() => setConfirmClear(false)}>
          <DialogCard>
            <h2 className="text-lg font-medium">Clear the lists?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This wipes the current rotation and starts a fresh roster. It can't be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setConfirmClear(false)
                  onClear()
                }}
              >
                Clear
              </Button>
            </div>
          </DialogCard>
        </Backdrop>
      )}

      {adding && (
        <AddDialog
          onCancel={() => setAdding(false)}
          onAdd={(list, name) => {
            onAdd(list, name)
            setAdding(false)
          }}
        />
      )}
    </main>
  )
}

function Backdrop({
  children,
  onClick,
  align = "end",
}: {
  children: React.ReactNode
  onClick: () => void
  align?: "end" | "top"
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-black/30 p-4",
        align === "top"
          ? "items-start pt-[12vh]"
          : "items-end pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center",
      )}
    >
      {children}
    </div>
  )
}

function DialogCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl"
    >
      {children}
    </div>
  )
}

function AddDialog({
  onCancel,
  onAdd,
}: {
  onCancel: () => void
  onAdd: (list: ListId, name: string) => void
}) {
  const [name, setName] = useState("")
  const trimmed = name.trim()
  return (
    <Backdrop onClick={onCancel} align="top">
      <DialogCard>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <h2 className="text-lg font-medium">Add a player</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          autoCapitalize="words"
          className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
          Add to
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {([1, 2] as ListId[]).map((n) => (
            <button
              key={n}
              type="button"
              disabled={!trimmed}
              onClick={() => onAdd(n, trimmed)}
              className={cn(
                "rounded-lg border border-border/50 py-3 text-center text-lg font-bold text-foreground underline decoration-[3px] underline-offset-[6px] transition-opacity active:opacity-70 disabled:opacity-40",
                n === 1 ? "decoration-list-1" : "decoration-list-2",
              )}
            >
              List {n}
            </button>
          ))}
        </div>
      </DialogCard>
    </Backdrop>
  )
}

// Horizontal swipe-to-reveal. touch-action: pan-y lets vertical scroll pass through to the
// list while we own horizontal movement; the drag handle (data-no-swipe) is excluded.
function useSwipeReveal(open: boolean, onOpen: () => void, onClose: () => void) {
  const [offset, setOffset] = useState(open ? -REVEAL_WIDTH : 0)
  const [dragging, setDragging] = useState(false)
  const data = useRef<{ x: number; base: number; active: boolean; cur: number } | null>(null)

  useEffect(() => {
    if (!data.current) setOffset(open ? -REVEAL_WIDTH : 0)
  }, [open])

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-swipe]")) return
    const base = open ? -REVEAL_WIDTH : 0
    data.current = { x: e.clientX, base, active: false, cur: base }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = data.current
    if (!d) return
    const delta = e.clientX - d.x
    if (!d.active) {
      if (Math.abs(delta) < 6) return
      d.active = true
      setDragging(true)
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // pointer capture is best-effort
      }
    }
    const next = Math.max(-REVEAL_WIDTH, Math.min(0, d.base + delta))
    d.cur = next
    setOffset(next)
  }
  const onPointerEnd = () => {
    const d = data.current
    data.current = null
    setDragging(false)
    if (!d || !d.active) return
    const shouldOpen = d.cur < -REVEAL_WIDTH / 2
    setOffset(shouldOpen ? -REVEAL_WIDTH : 0)
    if (shouldOpen) onOpen()
    else onClose()
  }

  return {
    offset,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  }
}

type RowProps = {
  slot: Slot
  label: string | null
  tone: "kick" | "deck" | undefined
  blink: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  onKicked: () => void
  onRemove: () => void
}

function SortableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.slot.name })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <Row
      {...props}
      dragRef={setNodeRef}
      dragStyle={style}
      dragHandle={{ ...attributes, ...listeners }}
      isDragging={isDragging}
    />
  )
}

function Row({
  slot,
  label,
  tone,
  blink,
  open,
  onOpen,
  onClose,
  onKicked,
  onRemove,
  dragRef,
  dragStyle,
  dragHandle,
  isDragging,
}: RowProps & {
  dragRef?: (node: HTMLElement | null) => void
  dragStyle?: React.CSSProperties
  dragHandle?: React.HTMLAttributes<HTMLElement>
  isDragging?: boolean
}) {
  const dim = !slot.firstTurn
  const draggable = !!dragHandle
  const { offset, dragging, handlers } = useSwipeReveal(open, onOpen, onClose)

  const underline =
    slot.list === 1
      ? dim
        ? "decoration-list-1/50"
        : "decoration-list-1"
      : dim
        ? "decoration-list-2/50"
        : "decoration-list-2"

  return (
    <li ref={dragRef} style={dragStyle} className={cn("list-none", isDragging && "relative z-10")}>
      <div className="relative overflow-hidden rounded-lg">
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive"
          style={{ width: REVEAL_WIDTH }}
        >
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${slot.name}`}
            className="flex h-full w-full items-center justify-center text-destructive-foreground"
          >
            <UserMinus className="size-5" />
          </button>
        </div>

        {/* Opaque content layer (hides the Remove panel until swiped) */}
        <div
          {...handlers}
          style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
          className={cn(
            "relative bg-background",
            !dragging && "transition-transform duration-200",
            isDragging && "shadow-lg",
          )}
        >
          <div
            className={cn(
              "relative",
              tone === "deck" && "animate-[blink-deck_1s_ease_infinite]",
            )}
          >
            {tone && (
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-tint-kick" />
            )}
            <div className="relative flex items-center gap-1 py-2 pr-1 pl-3">
          <div
            className={cn("min-w-0 flex-1", draggable && "touch-none cursor-grab active:cursor-grabbing")}
            {...(draggable ? dragHandle : {})}
          >
            {label && (
              <p className="text-[10px] font-medium tracking-widest text-primary uppercase">
                {label}
              </p>
            )}
            <p
              className={cn(
                "inline-block max-w-full truncate align-bottom leading-tight underline decoration-[3px] underline-offset-[6px]",
                underline,
                label ? "text-xl font-medium" : "text-lg",
                dim ? "text-muted-foreground/50" : "text-foreground",
                blink &&
                  (slot.list === 1
                    ? "animate-[underline-blink-1_1s_ease_infinite]"
                    : "animate-[underline-blink-2_1s_ease_infinite]"),
              )}
            >
              {slot.name}
            </p>
          </div>

          <Button
            data-no-swipe
            variant="ghost"
            size="icon"
            onClick={onKicked}
            aria-label={`${slot.name} kicked`}
            className="shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <CircleCheck className="size-7" />
          </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
