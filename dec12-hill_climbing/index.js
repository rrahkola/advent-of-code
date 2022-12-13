import { strict as assert } from 'assert'
import { inspect } from 'util'

function toNode (char, x, y) {
  if (char === 'S') return { elevation: 0, x, y, start: true }
  if (char === 'E') return { elevation: 25, x, y, end: true }
  return { elevation: 'abcdefghijklmnopqrstuvwxyz'.indexOf(char), x, y }
}

/* Implements an a* search algorithm on an array of connected nodes.
 * cf. https://en.wikipedia.org/wiki/A*_search_algorithm
 *
 */
function* searchNodes(nodes, config) {
  const { showIntermediate, openSet, onlyStart } = config
  let current
  while (openSet.length > 0) {
    openSet.sort((a, b) => a.toStart + a.toEnd - b.toStart - b.toEnd)
    current = openSet.shift()
    if (current.end && onlyStart) break
    for (const neighbor of current.next) {
      const toStart = current.toStart + 1
      if (toStart < neighbor.toStart) {
        neighbor.previous = [...current.previous, current]
        neighbor.toStart = toStart
        neighbor.fScore = neighbor.toStart + neighbor.toEnd
        if (!openSet.includes(neighbor)) openSet.push(neighbor)
      }
    }
    if (showIntermediate) yield openSet.map(el => ({
      x: el.x,
      y: el.y,
      neighbors: el.neighbors,
      fScore: el.toStart + el.toEnd
    }))
  }
  yield nodes.filter(el => el.end)[0]
}

/* Given a grid of elevations:
 *  S a b d f
 *  c b E e b
 *  d d o n m
 *  f e i i l
 *  g h i j k
 * Returns list of nodes: [{ elevation, x, y, toStart, toEnd, fScore, next, previous }]
 * where toStart, toEnd, fScore, next, and previous are used in A* search algorithm;
 * toStart is the current minimum distance (modified) from the start
 * toEnd is the distance (deltaX + deltaY + 3 * deltaElevation) to the end (E)
 * fScore is quantity (toStart + toEnd), used for ranking nodes
 * next is the list of allowable neighboring nodes
 * previous is the path of nodes from start to (current - 1)
 * and options is the allowable neighboring nodes
 */
function plot(input) {
  const terrain = []
  let y = 0
  for (const line of input) {
    const elevations = line.split('')
    terrain.push(...elevations.map((el, x) => toNode(el, x, y)))
    y++
  }
  const end = terrain.filter(el => el.end)[0]
  const start = terrain.filter(el => el.start)[0]
  // Gather toEnd, options for each node
  for (const node of terrain) {
    // g(n) -- how much terrain from start, defaults +Infinity
    node.toStart = (node === start) ? 0 : Infinity
    // h(n) -- estimate of how much terrain is left to go, taking elevation into account
    node.toEnd = Math.abs(end.x - node.x) + Math.abs(end.y - node.y) + 3 * (end.elevation - node.elevation)
    node.next = terrain.filter(el => {
      if (el.x !== node.x && el.y !== node.y) return false // must be same column/row
      if (Math.abs(el.x - node.x) > 1 || Math.abs(el.y - node.y) > 1) return false  // must be neighbors
      if (el.elevation - node.elevation > 1) return false // must be at most one higher
      if (el === node) return false
      return true
    })
    node.previous = []
    node.neighbors = node.next.length
  }
  return terrain
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const nodes = plot(input)
  if (config.showIntermediate) yield inspect(nodes, { depth: 3 })
  if (config.part === 1) {
    // Find shortest path from start to end
    config.openSet = nodes.filter(el => el.start)
    config.onlyStart = true
  } else {
    // Find shortest path from elevation 0 to end
    config.openSet = nodes.filter(el => el.elevation === 0)
    config.openSet.forEach(el => el.toStart = 0)
  }
  for (const output of searchNodes(nodes, config)) yield inspect(output), result = output
  yield result.toStart
}
