import { strict as assert } from 'assert'

/** Given lines of valves and tunnels, e.g.:
 *  Valve AA has flow rate=0; tunnels lead to valves DD, II, BB
 *  Valve BB has flow rate=13; tunnels lead to valves CC, AA
 *  return a network of valves with distances:
 *  [{ id: 'AA', rate: 0, neighbors: ['DD', 'II', 'BB'], distances: { 'AA': 0, 'BB': 1, ... } }, ...]
 */
export function parseValves(lines) {
  const valveRegex = /^Valve (?<valve>[A-Z]{2}) has flow rate=(?<rate>\d+); tunnels? leads? to valves? (?<neighbors>.+)$/
  // Calculate valves
  const valves = {}
  for (const line of lines) {
    const match = line.match(valveRegex)
    assert(Boolean(match), `No match found for line ${line}`)
    const valve = match.groups.valve
    const rate = parseInt(match.groups.rate)
    const neighbors = match.groups.neighbors.split(', ')
    valves[valve] = { rate, neighbors }
  }
  // Calculate vertices
  const vertices = Object.keys(valves)
  // Calculate distances
  const distances = floydWarshallDistance(valves)
  for (const [valve, dist] of Object.entries(distances)) {
    valves[valve].distances = dist
  }
  return Object.entries(valves).map(([id, data]) => ({ id, ...data }))
}

// Calculates the shortest distance between each pair of valves, w/o path
// cf. https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm
export function floydWarshallDistance(valves) {
  const vertices = Object.keys(valves)
  const dist = new Array(vertices.length).fill(0).map(el => new Array(vertices.length).fill(0).map(el => Infinity))
  for (const [valve, { neighbors }] of Object.entries(valves)) {
    const v = vertices.indexOf(valve)
    dist[v][v] = 0
    for (const neighbor of neighbors) {
      const u = vertices.indexOf(neighbor)
      dist[v][u] = 1
    }
  }
  vertices.forEach((_, k) => {
    vertices.forEach((_, i) => {
      vertices.forEach((_, j) => {
        const tmpDist = dist[i][k] + dist[k][j]
        if (dist[i][j] > tmpDist) {
          dist[i][j] = tmpDist
        }
      })
    })
  })
  // Convert distances to hashmaps w/ valve names
  const distances = {}
  vertices.forEach((valve, i) => {
    distances[valve] = vertices.reduce((obj, el, j) => Object.assign(obj, { [el]: dist[i][j] + 1 }), {}) // Add 1 to turn on
  })
  return distances
}