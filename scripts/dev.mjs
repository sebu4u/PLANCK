import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nextDir = join(root, '.next')
const devDir = join(nextDir, 'dev')
const DEV_PORTS = [3000, 3001]
const MAX_DEV_CACHE_MB = 400

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function listenPids(port) {
  try {
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return [...new Set(out.split(/\s+/).map(Number).filter(Boolean))]
  } catch {
    return []
  }
}

function killPid(pid, signal) {
  try {
    process.kill(pid, signal)
  } catch {
    // already gone
  }
}

async function freeDevPorts() {
  const pids = [...new Set(DEV_PORTS.flatMap((port) => listenPids(port)))]
  if (pids.length === 0) return

  console.log(
    `[dev] Stopping leftover process${pids.length > 1 ? 'es' : ''} on :3000/:3001 (pid ${pids.join(', ')})`,
  )
  for (const pid of pids) killPid(pid, 'SIGTERM')
  await sleep(500)

  const remaining = [...new Set(DEV_PORTS.flatMap((port) => listenPids(port)))]
  for (const pid of remaining) killPid(pid, 'SIGKILL')
  if (remaining.length > 0) await sleep(200)
}

function directorySizeBytes(dir) {
  if (!existsSync(dir)) return 0

  let total = 0
  const stack = [dir]
  while (stack.length > 0) {
    const current = stack.pop()
    let entries
    try {
      entries = readdirSync(current, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      try {
        total += statSync(full).size
      } catch {
        // ignore files that disappear mid-walk
      }
    }
  }
  return total
}

function pruneStaleDevOutput() {
  const lockPath = join(devDir, 'lock')
  if (existsSync(lockPath)) {
    rmSync(lockPath, { force: true })
  }

  const sizeMb = directorySizeBytes(devDir) / (1024 * 1024)
  if (sizeMb > MAX_DEV_CACHE_MB) {
    console.log(`[dev] Pruning oversized Turbopack cache (${Math.round(sizeMb)} MB)...`)
    rmSync(devDir, { recursive: true, force: true })
  }
}

function withHeapLimit(env) {
  if (/\b--max-old-space-size=/.test(env.NODE_OPTIONS || '')) return env

  let heapMb = 4096
  try {
    const bytes = Number(execFileSync('sysctl', ['-n', 'hw.memsize'], { encoding: 'utf8' }).trim())
    const ramGb = bytes / 1024 ** 3
    if (ramGb >= 24) heapMb = 8192
    else if (ramGb >= 16) heapMb = 4096
    else heapMb = 3072
  } catch {
    // keep the 4 GB default on non-macOS or if sysctl fails
  }

  return {
    ...env,
    NODE_OPTIONS: `${env.NODE_OPTIONS || ''} --max-old-space-size=${heapMb}`.trim(),
  }
}

await freeDevPorts()
pruneStaleDevOutput()

const child = spawn('pnpm', ['exec', 'next', 'dev', '--turbo', '-p', '3000'], {
  cwd: root,
  stdio: 'inherit',
  env: withHeapLimit(process.env),
})

const shutdown = (signal) => {
  if (child.pid) killPid(child.pid, signal)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
