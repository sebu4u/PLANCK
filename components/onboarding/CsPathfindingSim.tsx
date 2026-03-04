"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import confetti from "canvas-confetti"

const ROWS = 12
const COLS = 20
const START = { r: 0, c: 0 }
const END = { r: ROWS - 1, c: COLS - 1 }
const DIRS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
]

type CellState = "empty" | "wall" | "start" | "end" | "visited" | "path"

function createEmptyGrid(): CellState[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (r === START.r && c === START.c) return "start"
      if (r === END.r && c === END.c) return "end"
      return "empty"
    }),
  )
}

function generateRandomWalls(): CellState[][] {
  const grid = createEmptyGrid()
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== "empty") continue
      if (Math.random() < 0.28) grid[r][c] = "wall"
    }
  }
  return grid
}

const CELL_CLS: Record<CellState, string> = {
  empty: "bg-white hover:bg-[#f3f3f3]",
  wall: "bg-[#292929]",
  start: "bg-[#292929]",
  end: "bg-[#ffffff] ring-2 ring-inset ring-[#292929]",
  visited: "bg-[#e4e4e4]",
  path: "bg-[#8043f0]",
}

export function CsPathfindingSim() {
  const [grid, setGrid] = useState<CellState[][]>(createEmptyGrid)
  const [isRunning, setIsRunning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<"wall" | "empty">("wall")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearVis = useCallback(() => {
    setGrid((prev) =>
      prev.map((row) =>
        row.map((c) => (c === "visited" || c === "path" ? "empty" : c)),
      ),
    )
  }, [])

  const interact = useCallback(
    (r: number, c: number, mode?: "wall" | "empty") => {
      if (isRunning) return
      if (r === START.r && c === START.c) return
      if (r === END.r && c === END.c) return
      setGrid((prev) => {
        const next = prev.map((row) => [...row])
        const cur = next[r][c]
        if (cur === "visited" || cur === "path") {
          next[r][c] = "empty"
          return next
        }
        const m = mode ?? (cur === "wall" ? "empty" : "wall")
        next[r][c] = m
        return next
      })
    },
    [isRunning],
  )

  const onDown = useCallback(
    (r: number, c: number) => {
      if (isRunning) return
      if (r === START.r && c === START.c) return
      if (r === END.r && c === END.c) return
      const mode = grid[r][c] === "wall" ? "empty" : "wall"
      setDragMode(mode)
      setIsDragging(true)
      interact(r, c, mode)
    },
    [isRunning, grid, interact],
  )

  const onEnter = useCallback(
    (r: number, c: number) => {
      if (!isDragging || isRunning) return
      interact(r, c, dragMode)
    },
    [isDragging, isRunning, dragMode, interact],
  )

  useEffect(() => {
    const up = () => setIsDragging(false)
    window.addEventListener("mouseup", up)
    window.addEventListener("touchend", up)
    return () => {
      window.removeEventListener("mouseup", up)
      window.removeEventListener("touchend", up)
    }
  }, [])

  const runBFS = useCallback(() => {
    clearVis()
    setIsRunning(true)

    const walls = new Set<string>()
    grid.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell === "wall") walls.add(`${r},${c}`)
      }),
    )

    const visited = new Set<string>()
    const parent = new Map<string, string>()
    const queue: [number, number][] = [[START.r, START.c]]
    visited.add(`${START.r},${START.c}`)

    const frontiers: [number, number][][] = []
    let found = false

    while (queue.length > 0 && !found) {
      const frontier: [number, number][] = []
      const size = queue.length
      for (let i = 0; i < size; i++) {
        const [cr, cc] = queue.shift()!
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr
          const nc = cc + dc
          const key = `${nr},${nc}`
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
          if (visited.has(key) || walls.has(key)) continue
          visited.add(key)
          parent.set(key, `${cr},${cc}`)
          frontier.push([nr, nc])
          queue.push([nr, nc])
          if (nr === END.r && nc === END.c) {
            found = true
            break
          }
        }
        if (found) break
      }
      if (frontier.length > 0) frontiers.push(frontier)
    }

    const pathCells: [number, number][] = []
    if (found) {
      let key = `${END.r},${END.c}`
      while (key && key !== `${START.r},${START.c}`) {
        const [pr, pc] = key.split(",").map(Number)
        pathCells.unshift([pr, pc])
        key = parent.get(key) ?? ""
      }
    }

    let step = 0
    let pathIndex = 0
    intervalRef.current = setInterval(() => {
      if (step < frontiers.length) {
        const layer = frontiers[step] ?? []
        setGrid((prev) => {
          const next = prev.map((row) => [...row])
          for (const [r, c] of layer) {
            if (next[r][c] === "empty") next[r][c] = "visited"
          }
          return next
        })
        step++
      } else if (pathIndex < pathCells.length) {
        const [r, c] = pathCells[pathIndex]
        setGrid((prev) => {
          const next = prev.map((row) => [...row])
          if (next[r][c] !== "start" && next[r][c] !== "end")
            next[r][c] = "path"
          return next
        })
        pathIndex++
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsRunning(false)
        if (pathCells.length > 0) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.55 },
            colors: ["#8043f0", "#292929", "#a67ff5"],
          })
        }
      }
    }, 40)
  }, [grid, clearVis])

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setGrid(createEmptyGrid())
  }, [])

  const handleRandom = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setGrid(generateRandomWalls())
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || isRunning) return
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const key = el?.getAttribute("data-cell")
      if (!key) return
      const [r, c] = key.split(",").map(Number)
      interact(r, c, dragMode)
    },
    [isDragging, isRunning, dragMode, interact],
  )

  return (
    <div>
      <div
        className="grid select-none overflow-hidden rounded-lg border border-[#ebeaf3] bg-[#ebeaf3]"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: 1,
          touchAction: "none",
        }}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
      >
        {grid.flatMap((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              data-cell={`${r},${c}`}
              className={`aspect-square transition-colors duration-75 ${CELL_CLS[cell]}`}
              onMouseDown={() => onDown(r, c)}
              onMouseEnter={() => onEnter(r, c)}
              onTouchStart={() => onDown(r, c)}
            />
          )),
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={runBFS}
          disabled={isRunning}
          className="rounded-full bg-[#292929] px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#111111] disabled:opacity-40"
        >
          Rulează
        </button>
        <button
          type="button"
          onClick={handleRandom}
          disabled={isRunning}
          className="rounded-full border border-[#e0dce8] px-4 py-1.5 text-[11px] font-semibold text-[#292929] transition-colors hover:bg-[#f5f3fa] disabled:opacity-40"
        >
          Blocaje random
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isRunning}
          className="rounded-full border border-[#e0dce8] px-4 py-1.5 text-[11px] font-semibold text-[#292929] transition-colors hover:bg-[#f5f3fa] disabled:opacity-40"
        >
          Reset
        </button>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-[#999]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#292929]" />{" "}
            Start
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#292929] bg-[#ffffff]" />{" "}
            Finish
          </span>
        </div>
      </div>
    </div>
  )
}
