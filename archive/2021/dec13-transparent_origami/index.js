import { strict as assert } from 'assert'
import { inspect } from 'util'
import uniqBy from 'lodash/uniqBy.js'
import range from 'lodash/range.js'

function * visibleDots (data, config) {
  const { showIntermediate } = config
  let { width, breadth, coords, folds } = data
  let result = []
  let visible = coords.length
  for (const step in range(config.numFolds)) {
    result = transform(coords, width, breadth, folds[step])
    coords = uniq(result)
    width = Math.max(...coords.map(el => el.colIdx))
    breadth = Math.max(...coords.map(el => el.rowIdx))
    visible = coords.length
    if (showIntermediate) {
      yield inspect({ step, visible, width, breadth, coords })
    }
  }
  yield plotCoords(coords)
  yield `Number of visible dots: ${visible}`
}

function transform (coords, width, breadth, instruction) {
  if (instruction.command === 'fold along y') {
    return coords.map(foldAtRow(breadth, instruction.line))
  } else if (instruction.command === 'fold along x') {
    return coords.map(foldAtCol(width, instruction.line))
  } else return coords
}

const foldAtRow = (breadth, line) => prev => {
  const shift = Math.max(0, breadth - line * 2)
  const flip = Math.max(breadth, line * 2)
  const colIdx = prev.colIdx
  const rowIdx = prev.rowIdx < line ? prev.rowIdx + shift : flip - prev.rowIdx
  return { colIdx, rowIdx }
}

const foldAtCol = (width, line) => prev => {
  const shift = Math.max(0, width - line * 2)
  const flip = Math.max(width, line * 2)
  const colIdx = prev.colIdx < line ? prev.colIdx + shift : flip - prev.colIdx
  const rowIdx = prev.rowIdx
  return { colIdx, rowIdx }
}

const uniq = coords => uniqBy(coords, el => `${el.colIdx},${el.rowIdx}`)

function plotCoords (coords) {
  const width = Math.max(...coords.map(el => el.colIdx)) + 1
  const breadth = Math.max(...coords.map(el => el.rowIdx)) + 1
  const coordStr = coords.map(el => `${el.colIdx},${el.rowIdx}`)
  const grid = []
  for (const row of range(breadth)) {
    const gridRow = []
    for (const col of range(width)) {
      const val = `${col},${row}`
      gridRow[col] = coordStr.includes(val) ? '#' : '.'
    }
    grid.push(gridRow.join(''))
  }
  return `${grid.join('\n')}`
}

function interpret (input) {
  const [coordStr, instructions] = input.split('\n\n')
  const coords = coordStr.split('\n').map(line => {
    const [col, row] = line.trim().split(',')
    return { colIdx: parseInt(col), rowIdx: parseInt(row) }
  })
  const folds = instructions.split('\n').map(line => {
    const [command, val] = line.trim().split('=')
    if (val) return { command, line: parseInt(val) }
  })
  const width = Math.max(...coords.map(el => el.colIdx))
  const breadth = Math.max(...coords.map(el => el.rowIdx))
  return { coords, folds, width, breadth }
}

export default function * pickPart (input, config) {
  assert(
    typeof input === 'string' || input instanceof String,
    'Must provide data as a string, use options "-t raw"'
  )
  const { part } = config
  assert(part <= 2, 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (part === 2) {
    config.numFolds = data.folds.length
    for (const result of visibleDots(data, config)) yield result
  } else {
    config.numFolds = 1
    for (const result of visibleDots(data, config)) yield result
  }
}
