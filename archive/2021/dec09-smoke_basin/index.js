import { strict as assert } from 'assert'
import { inspect } from 'util'
import sum from 'lodash/sum.js'
import sortBy from 'lodash/sortBy.js'

function * sumLowPoints (data, config) {
  const { showIntermediate } = config
  if (showIntermediate) yield inspect(data.riskmap)
  yield `Sum of risk levels: ${sum(data.riskmap.flatMap(el => el))}`
}

function * findLargestBasins (data, config) {
  const { showIntermediate } = config
  const { floor, lowPoints } = data
  const lowPointKeys = lowPoints.map(el => `${el.colIdx},${el.rowIdx}`)
  let basinmap = []
  for (const result of markBasins(floor, lowPointKeys)) {
    if (showIntermediate) yield result
    if (result.basinmap) basinmap = result.basinmap
  }
  const basinSizes = lowPointKeys.map(key =>
    basinmap.flatMap(row => row.filter(col => col === key)).length
  )
  if (showIntermediate) yield inspect({ basinSizes })
  const largestBasins = sortBy(basinSizes)
    .slice(-3)
    .reduce((acc, el) => acc * el, 1)
  yield `Product of largest basins: ${largestBasins}`
}

function markLowPoints (floor) {
  const breadth = floor.length
  const width = floor[0].length
  const lowPoints = []
  const riskmap = new Array(breadth).fill(0).map(() => new Array(width).fill(0))
  for (const [rowKey, row] of Object.entries(floor)) {
    const rowIdx = parseInt(rowKey)
    for (const [colKey, col] of Object.entries(row)) {
      const colIdx = parseInt(colKey)
      const context = getContext(floor, rowIdx, colIdx)
      const isLowest = col < Math.min(...context.map(el => el.val))
      if (isLowest) {
        riskmap[rowIdx][colIdx] = col + 1
        lowPoints.push({ rowIdx, colIdx })
      }
    }
  }
  return { riskmap, lowPoints }
}

// compares 5 with Math.min([2?, 4?, 6?, 8?])
function getContext (floor, rowIdx, colIdx) {
  const breadth = floor.length
  const width = floor[0].length
  const contextRow = [Math.max(0, colIdx - 1), Math.min(width, colIdx + 2)]
  const context = []
  if (0 <= rowIdx - 1) context.push(floorPoint(floor, rowIdx - 1, colIdx))
  if (0 <= colIdx - 1) context.push(floorPoint(floor, rowIdx, colIdx - 1))
  if (width >= colIdx + 2) context.push(floorPoint(floor, rowIdx, colIdx + 1))
  if (breadth >= rowIdx + 2) context.push(floorPoint(floor, rowIdx + 1, colIdx))
  return context
}

function floorPoint (floor, rowIdx, colIdx) {
  const val = floor[rowIdx][colIdx]
  return { rowIdx, colIdx, val }
}

function * markBasins (floor, lowPointKeys) {
  const breadth = floor.length
  const width = floor[0].length
  const basinmap = new Array(breadth)
    .fill(0)
    .map(() => new Array(width).fill(0))
  for (const [rowKey, row] of Object.entries(floor)) {
    const rowIdx = parseInt(rowKey)
    for (const [colKey, col] of Object.entries(row)) {
      const colIdx = parseInt(colKey)
      if (floor[rowIdx][colIdx] < 9 && basinmap[rowIdx][colIdx] === 0) {
        const basinPoints = walkBasin(floor, rowIdx, colIdx)
        const basinPointKeys = basinPoints.map(
          el => `${el.colIdx},${el.rowIdx}`
        )
        const lowPointKey = lowPointKeys.filter(key =>
          basinPointKeys.includes(key)
        )[0]
        for (const point of basinPoints)
          basinmap[point.rowIdx][point.colIdx] = lowPointKey
      }
      yield inspect({ basinmap, lowPointKeys })
    }
  }
  yield { basinmap }
}

function walkBasin (floor, rowIdx, colIdx) {
  const basinPoints = []
  const val = floor[rowIdx][colIdx]
  const context = getContext(floor, rowIdx, colIdx)
  basinPoints.push({ rowIdx, colIdx })
  for (const point of context) {
    // console.log({ rowIdx, colIdx, point }, 'found context')
    if (val < point.val) continue
    else if (val === point.val) basinPoints.push(point)
    else if (val > point.val) {
      const nextPoints = walkBasin(floor, point.rowIdx, point.colIdx)
      basinPoints.push(...nextPoints)
    }
  }
  // console.log(basinPoints, 'basinPoints')
  return basinPoints
}

function interpret (input) {
  const floor = input.map(line =>
    line
      .trim()
      .split('')
      .map(el => parseInt(el))
  )
  const { riskmap, lowPoints } = markLowPoints(floor)
  return { floor, riskmap, lowPoints }
}

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert(config.part <= 2, 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 2) {
    for (const result of findLargestBasins(data, config)) yield result
  } else {
    for (const result of sumLowPoints(data, config)) yield result
  }
}
