import { strict as assert } from 'assert'
import { inspect } from 'util'
import setupGrid from '../utils/gridUtilities.js'
import sum from 'lodash/sum.js'

function * part1 (data, config) {
  const { showIntermediate } = config
  const { grid, flat, perimeterRisk } = data
  yield 'Howdy'
}

function findPath () {
}

function minimumPerimeterRisk (grid) {
  const width = grid[0].length - 1
  const breadth = grid.length - 1
  const firstRow = grid[0].map(col => col.val)
  const firstCol = grid.map(row => row[0].val)
  const lastCol = grid.map(row => row[width].val)
  const lastRow = grid[breadth].map(col => col.val)
  const route1 = sum(firstRow.slice(1)) + sum(lastCol.slice(1))
  const route2 = sum(firstCol.slice(1)) + sum(lastRow.slice(1))
  return Math.min(route1, route2)
}

function interpret (input) {
  const { grid, flat } = setupGrid(input)
  const perimeterRisk = minimumPerimeterRisk(grid)
  return { grid, flat, perimeterRisk }
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
    for (const result of part1(data, config)) yield result
  } else {
    for (const result of part1(data, config)) yield result
  }
}
