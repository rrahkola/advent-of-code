import { strict as assert } from 'assert'
import { inspect } from 'util'
import { parseValves } from './tunnels.js'

const PRINT_RATE = 50000
const sumRates = open => Object.values(open).reduce((acc, el) => acc + el, 0)

/** Given a network of valves and tunnels, e.g.:
 *  [{ id: 'AA', rate: 0, neighbors: ['BB', 'DD', 'II'], distances: { AA: 0, BB: 1, CC: 2, DD: 1, ... } }, ...]
 *  finds the total flows during the time remaining for various paths
 */
function* searchPaths(data, config) {
  const { showIntermediate, startTime } = config
  const start = data.find(el => el.id === 'AA')
  const openSet = [{ ...start, timeRemaining: startTime, open: {}, closed: data.map(el => el.id) }]
  const paths = []
  while (openSet.length > 0) {
    openSet.sort((a, b) => sumRates(b.open) - sumRates(a.open))
    const { timeRemaining, open, closed, distances } = openSet.shift()
    let finishPath = true
    for (const nextId of closed) {
      const nextValve = data.find(el => el.id === nextId)
      const nextTime = timeRemaining - distances[nextId]
      if (nextValve.rate === 0 || nextTime <= 0) continue
      finishPath = false
      const nextClosed = closed.filter(id => id !== nextId)
      const nextOpen = { ...open, [nextId]: nextValve.rate * nextTime }
      const next = { ...nextValve, timeRemaining: nextTime, open: nextOpen, closed: nextClosed, totalFlow: sumRates(nextOpen) }
      openSet.push(next)
    }
    if (finishPath) paths.push({ open, closed, timeRemaining, totalFlow: sumRates(open) })
  }
  yield { totalPaths: paths.length }
  yield paths
}

function filterPaths(paths, ref) {
  const open = Object.keys(ref)
  const filteredPaths = paths.filter(path => !open.some(id => id in path.open))
  return filteredPaths
}

// Given a set of paths with totalFlow, return combined paths for 2 actors
function* findDisjointPaths(paths, config) {
  const { showIntermediate } = config
  const combinedPaths = []
  const totalPaths = paths.length
  let threshold = paths[0].totalFlow
  let print = 0
  let idx = 0
  for (const path of paths.slice(0, config.cutoff)) {
    const disjointPaths = filterPaths(paths, path.open)
    if (showIntermediate && (++idx % 1000 === 0)) console.log(inspect({ idx, totalPaths, numDisjoint: disjointPaths.length, initialFlow: path.totalFlow, open: path.open }))
    for (const altPath of disjointPaths) {
      const totalFlow = path.totalFlow + altPath.totalFlow
      if (++print % PRINT_RATE === 0) console.log(`${print}: threshold: ${threshold}, combinedPaths: ${combinedPaths.length}, path: ${inspect(path.open)}`)
      if (totalFlow <= threshold) continue // filter out less optimal paths
      threshold = Math.max(totalFlow, threshold)
      const open = { ...path.open, ...altPath.open }
      combinedPaths.push({ open, totalFlow, me: path, elephant: altPath })
    }
  }
  console.log(`totalCombined: ${combinedPaths.length}`)
  yield combinedPaths
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = parseValves(input)
  if (config.showIntermediate) yield inspect(data, { depth: null })
  if (config.part === 1) {
    // Find max relief for 30 minutes of valve-travelling+opening
    config.startTime = 30
    for (const output of searchPaths(data, config)) yield inspect(output), result = output
    const bestPath = result.sort((a, b) => sumRates(b.open) - sumRates(a.open))[0]
    yield bestPath
  } else {
    // Find max relief for 26 minutes of two-character valve-travelling+opening
    config.startTime = 26
    config.cutoff = 10
    for (const output of searchPaths(data, config)) yield inspect(output), result = output
    const bestPath = result.sort((a, b) => sumRates(b.open) - sumRates(a.open))[0]
    for (const output of findDisjointPaths(result, config)) yield inspect(output), result = output
    const bestPair = result.sort((a, b) => sumRates(b.open) - sumRates(a.open))[0]
    yield bestPair
  }
}
