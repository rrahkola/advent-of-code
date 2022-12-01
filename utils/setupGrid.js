import range from 'lodash/range.js'

class GridPoint {
  constructor ({ colIdx, rowIdx, name, val }) {
    this.pos = { colIdx, rowIdx }
    this.name = name ? name : `${colIdx},${rowIdx}`
    this.val = val
    this.neighbors = []
  }

  addNeighbors (neighbors) {
    const { name, neighbors: existing } = this
    const existingNames = [name].concat(existing.map(el => el.name))
    const newNeighbors = neighbors.filter(
      el => !existingNames.includes(el.name)
    )
    existing.push(...newNeighbors)
  }
}

// edges are suitable for Array.slice(min, maxIdx), excluding maxIdx
function findEdges (grid, rowIdx, colIdx) {
  const breadth = grid.length
  const width = grid[0].length
  const top = Math.max(0, rowIdx - 1)
  const bottom = Math.min(breadth, rowIdx + 2)
  const left = Math.max(0, colIdx - 1)
  const right = Math.min(width, colIdx + 2)
  return { top, bottom, left, right }
}

function findNeighbors (grid, edges) {
  const { top, bottom, left, right } = edges
  const neighbors = []
  for (const rowIdx of range(top, bottom)) {
    for (const colIdx of range(left, right)) {
      neighbors.push(grid[rowIdx][colIdx])
    }
  }
  return neighbors
}

function addNeighbors (grid) {
  for (const [rowKey, row] of Object.entries(grid)) {
    const rowIdx = parseInt(rowKey)
    for (const [colKey, octopus] of Object.entries(row)) {
      const colIdx = parseInt(colKey)
      const edges = findEdges(grid, rowIdx, colIdx)
      octopus.addNeighbors(findNeighbors(grid, edges))
    }
  }
}

export default function setupGrid (input) {
  const grid = input.map((line, rowIdx) =>
    line
      .trim()
      .split('')
      .map(el => parseInt(el))
      .map((val, colIdx) => new GridPoint({ rowIdx, colIdx, val }))
  )
  addNeighbors(grid)
  return { grid, flat: grid.flatMap(el => el) }
}

setupGrid.GridPoint = GridPoint

export function findPath (node, end, )
