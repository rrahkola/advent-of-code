import { strict as assert } from 'assert'
import { inspect } from 'util'
import isEqual from 'lodash/isEqual.js'
import range from 'lodash/range.js'

const serializePos = ({ rowIdx, colIdx }) => `${colIdx},${rowIdx}`
class Octopus {
  constructor (energy, pos) {
    this.energy = energy
    this.pos = serializePos(pos)
    this.neighbors = []
    this.flashed = false
  }

  tickEnergy () {
    this.energy += 1
    if (this.flashed) return
    if (Boolean(this.energy > 9)) {
      this.flashed = true
      this.neighbors.forEach(neighbor => neighbor.tickEnergy())
    }
  }

  finishStep () {
    if (this.flashed) {
      this.energy = 0
      this.flashed = false
    }
  }

  addNeighbors (neighbors) {
    const { pos, neighbors: existing } = this
    const currentPos = [pos].concat(existing.map(el => el.pos))
    const newNeighbors = neighbors.filter(el => !currentPos.includes(el.pos))
    existing.push(...newNeighbors)
  }
}

function * countFlashes (data, config) {
  const { showIntermediate } = config
  let flashCount = 0
  for (const step of range(1, config.steps + 1)) {
    data.flat.forEach(octopus => octopus.tickEnergy())
    flashCount +=  data.flat.filter(octopus => octopus.flashed).length
    data.flat.forEach(octopus => octopus.finishStep())
    const energyGrid = genEnergyGrid(data.grid)
    if (showIntermediate && step % 10 === 0) yield inspect({ step, flashCount, energyGrid })
  }
  yield `Total flashes: ${flashCount}`
}

function * synchronizeFlashes (data, config) {
  const { showIntermediate } = config
  let step = 0
  let flashStep = 0
  while (flashStep < data.flat.length) {
    step += 1
    data.flat.forEach(octopus => octopus.tickEnergy())
    flashStep = data.flat.filter(octopus => octopus.flashed).length
    data.flat.forEach(octopus => octopus.finishStep())
  }
  const energyGrid = genEnergyGrid(data.grid)
  if (showIntermediate) yield inspect({ step, flashStep, energyGrid })
  yield `Synchronized flash: ${step}`
}

function genEnergyGrid (grid) {
  const eGrid = []
  for (const row of grid) {
    const energyRow = []
    for (const octopus of row) {
      energyRow.push(octopus.energy)
    }
    eGrid.push(energyRow.join(''))
  }
  return eGrid
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

function interpret (input) {
  const grid = input.map((line, rowIdx) =>
    line
      .trim()
      .split('')
      .map(el => parseInt(el))
      .map((energy, colIdx) => new Octopus(energy, { rowIdx, colIdx }))
  )
  addNeighbors(grid)
  return { grid, flat: grid.flatMap(el => el) }
}

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert(part <= 2, 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (part === 2) {
    for (const result of synchronizeFlashes(data, config)) yield result
  } else {
    config.steps = 100
    for (const result of countFlashes(data, config)) yield result
  }
}
