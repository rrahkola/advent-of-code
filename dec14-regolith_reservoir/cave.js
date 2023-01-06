

// Returns a set of integer coordinates for a horizontal/vertical path
function coordsRange(start, end) {
  const coords = []
  const vary = (start.x === end.x) ? 'y' : 'x'
  const path = [start, end].sort((a, b) => (a.y === b.y) ? (a.x - b.x) : (a.y - b.y))
  let { x, y } = path[0]
  while ((vary === 'x' && x <= path[1].x) || (vary === 'y' && y <= path[1].y)) {
    coords.push({ x, y })
    if (vary === 'y') y++
    else x++
  }
  return coords
}

function parseCoords(str) {
  const coords = (str.match(/^(?<x>\d+),(?<y>\d+)$/) || { groups: {} }).groups
  return { x: parseInt(coords.x), y: 0 - parseInt(coords.y) }
}

/* Given rock paths: ['503,4 -> 502,4 -> 502,9 -> 494,9', ...]
 * Return an array of stacks: [
 *   { x: 503, y: -4, depth: 1, count: 0, yMax: 0, abyss: true/false },
 *   { x: 503, y: -4, depth: 1, count: 0, yMax: 0, abyss: true/false },
 *   ...
 * ]
 * where:
 *   x, y    are rock coordinates (y is always <= 0) at the top of the structure
 *   depth   is the depth of the rock structure (base of stack)
 *   count   is the number of sand units on the stack
 *   yMax    is the max value of y which can receive a sand unit (due to blockage or top of system)
 *   source  whether the stack represents the source or not
 *   abyss   whether the stack represents the abyss or not
 */
export default function parseCave(input, config) {
  const { sourceX = 500, abyssChar = 'v' } = config
  // Initial: source of sand
  const stacks = [] // [{ x: sourceX, y: 0, yMax: 0, count: 0, source: true }]
  // 1st pass: { x, y, depth, count }
  for (const line of input) {
    const corners = line.split(' -> ')
    let path = []
    const segments = [null, ...corners].map((end, idx) => [corners[idx], end])
      .filter(el => el[0] && el[1]).map(([start, end]) => [parseCoords(start), parseCoords(end)])
    // generate [{ x: 498, y: -6 }, { x: 498, y: -7 }, ...], aggregate over x
    for (const segment of segments) path.push(...coordsRange(segment[0], segment[1]))
    stacks.push(...path.map(({ x, y }) => ({ x, y, depth: 1, count: 0, yMax: 0 })))
  }
  const xValues = new Set(stacks.map(el => el.x))
  const yValues = new Set(stacks.map(el => el.y))
  const abyssY = Math.min(...yValues) - 2
  const halfWidthX = 1 - abyssY
  const xMin = sourceX - halfWidthX
  const xMax = sourceX + halfWidthX
  // 2nd pass: Update { yMax } for overlapping stacks
  for (const x of xValues) {
    const overlaps = stacks.filter(stack => stack.x === x).sort((a, b) => a.y - b.y)
    if (overlaps.length > 1) {
      for (let i = 0; i < overlaps.length; i++) {
        const nextShelf = overlaps[i+1] || { y: 0, depth: 0 }
        overlaps[i].yMax = nextShelf.y - nextShelf.depth
      }
    }
  }
  // 3rd pass: Add stacks for the abyss, with { abyss: true }
  for (let x = xMin; x <= xMax; x++) {
    stacks.push({ x, y: abyssY, count: 0, yMax: 0, abyss: true })
  }
  // Alternate view; sparse arrays of constant x
  const grid = new Array(2 * halfWidthX + 1).fill(0).map(_ => new Array(1 - abyssY))
  for (const stack of stacks) {
    const x = stack.x - xMin
    const y = 0 - stack.y
    grid[x][y] = (stack.source) ? '+' : (stack.abyss) ? abyssChar : '#'
  }
  return { stacks, grid, xMin, xMax, abyssY }
}

/* Given an array of stacks, [{ x, y, depth, count }, ...]
 * Returns an array of arrays of coordinates: [{ x, y, char: '#' }, { x, y, char: 'o' }, ...]
 * Returned arrays are sorted by y, then x (suitable for plotting)
 * Legend: (#) rock, (o) sand, (.) air, (v) abyss
 */
export function plotCave(stacks) {
  const coords = []
  for (const stack of stacks) {
    const { x, y, depth, count } = stack
    // Source
    if (stack.source) {
      coords.push({ x, y, char: '+' })
      continue
    }
    // Abyss
    if (stack.abyss) {
      coords.push({ x, y, char: 'v' })
      continue
    }
    // Rocks
    coords.push(...[...Array(depth).keys()].map((el, idx) => ({ x, y: y - idx, char: '#' })))
    // Sand
    coords.push(...[...Array(count).keys()].map((el, idx) => ({ x, y: y + idx + 1, char: 'o' })))
  }
  const yValues = new Set(coords.map(el => el.y))
  const xValues = new Set(coords.map(el => el.x))
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const plot = []
  for (let y = yMax; y >= yMin; y--) {
    const row = []
    const existing = coords.filter(el => el.y === y).sort((a, b) => a.x - b.x)
    for (let x = xMin; x <= xMax; x++) row.push(existing.find(el => el.x === x) || { x, y, char: '.' })
    plot.push(row.map(el => el.char).join(''))
  }
  return plot
}

export function plotCaveGrid(grid) {
  const yMax = grid[0].length
  const plot = []
  for (let y = 0; y < yMax; y++) {
    plot.push(grid.map(col => col[y] || '.' ).join(''))
  }
  return plot
}