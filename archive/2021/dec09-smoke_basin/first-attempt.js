import { strict as assert } from 'assert'
import { inspect } from 'util'

class Location {
  constructor (input) {
    this.pos = input.pos
    this.value = input.value
    this.context = input.context
  }

  isLocalMinimum () {
    const { pos, value, context } = this
    return value < Math.min(...context)
  }
}

function * part1 (datum, config, summary) {
  const { showIntermediate } = config
  // if (showIntermediate) yield inspect(datum)
  if (datum.isLocalMinimum()) summary.push(datum)
}

function processSummary (summary) {
  const sumRiskLevel = summary.reduce((acc, loc) => acc + loc.value + 1, 0)
  return `Sum of Risk Levels: ${sumRiskLevel}`
}

// [1?, 2?, 3?, 4?, 6?, 7?, 8?, 9?]
function eightboxContext (floor, rowIdx, colIdx) {
  const breadth = floor.length
  const width = floor[0].length
  const context = []
  const contextShape = {
    breadth: [Math.max(0, rowIdx - 1), Math.min(breadth, rowIdx + 2)],
    width: [Math.max(0, colIdx - 1), Math.min(width, colIdx + 2)]
  }
  if (0 <= rowIdx - 1) context.push(...floor[rowIdx - 1].slice(...contextShape.width))
  if (0 <= colIdx - 1) context.push(floor[rowIdx][colIdx - 1])
  if (width >= colIdx + 2) context.push(floor[rowIdx][colIdx + 1])
  if (breadth >= rowIdx + 2) context.push(...floor[rowIdx + 1].slice(...contextShape.width))
  return context
}

// [2?, 4?, 6?, 8?]
function fourboxContext (floor, rowIdx, colIdx) {
  const breadth = floor.length
  const width = floor[0].length
  const contextRow = [Math.max(0, colIdx - 1), Math.min(width, colIdx + 2)]
  const context = []
  if (0 <= rowIdx - 1) context.push(floor[rowIdx - 1][colIdx])
  if (0 <= colIdx - 1) context.push(floor[rowIdx][colIdx - 1])
  if (width >= colIdx + 2) context.push(floor[rowIdx][colIdx + 1])
  if (breadth >= rowIdx + 2) context.push(floor[rowIdx + 1][colIdx])
  return context
}

function * interpret (input, config) {
  const heightmap = input.map(line =>
    line
      .trim()
      .split('')
      .map(el => parseInt(el))
  )
  for (const [rowKey, row] of Object.entries(heightmap)) {
    const rowIdx = parseInt(rowKey)
    for (const [colKey, col] of Object.entries(row)) {
      const colIdx = parseInt(colKey)
      const pos = { row: rowIdx, col: colIdx }
      const value = col
      const context = config.getContext(heightmap, rowIdx, colIdx)
      yield new Location({ pos, value, context })
    }
  }
}

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert(config.part <= 2, 'Valid parts are 1 or 2')
  const summary = []
  if (config.part === 2) {
    config.getContext = eightboxContext
    for (const datum of interpret(input, config)) {
      for (const result of part1(datum, config, summary)) yield result
    }
  } else {
    config.getContext = fourboxContext
    for (const datum of interpret(input, config)) {
      for (const result of part1(datum, config, summary)) yield result
    }
  }
  if (config.showIntermediate) yield inspect(summary)
  yield processSummary(summary)
}
