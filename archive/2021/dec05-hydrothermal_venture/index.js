import { strict as assert } from 'assert'
import range from 'lodash/range.js'
import rangeRight from 'lodash/rangeRight.js'
import zip from 'lodash/zip.js'
import { inspect } from 'util'

function * hvIntersections (data, config) {
  const { showIntermediate } = config
  const activeCoords = {}
  for (const result of horizontalCoords(activeCoords, data)) {
    if (showIntermediate) yield result
  }
  if (showIntermediate)
    for (const result of verticalCoords(activeCoords, data)) {
      if (showIntermediate) yield result
    }
  const vents = dangerousSpots(activeCoords)
  yield `Dangerous spots: ${vents.length}`
}

function * allIntersections (data, config) {
  const { showIntermediate } = config
  const activeCoords = {}
  for (const result of horizontalCoords(activeCoords, data)) {
    if (showIntermediate) yield result
  }
  for (const result of verticalCoords(activeCoords, data)) {
    if (showIntermediate) yield result
  }
  for (const result of posSlopeCoords(activeCoords, data)) {
    if (showIntermediate) yield result
  }
  for (const result of negSlopeCoords(activeCoords, data)) {
    if (showIntermediate) yield result
  }
  const vents = dangerousSpots(activeCoords)
  yield `Dangerous spots: ${vents.length}`
}

function * horizontalCoords (coords, data) {
  const horizontalLines = data.filter(coords => coords.y1 === coords.y2)
  yield inspect({ horizontalLines })
  // generate list of coordinates which are on horizontal lines
  horizontalLines.forEach(el => {
    const yConst = el.y1
    const xMin = Math.min(el.x1, el.x2)
    const xMax = Math.max(el.x1, el.x2)
    const intersections = range(xMin, xMax + 0.5).map(x => `${x},${yConst}`)
    intersections.forEach(point => (coords[point] = coords[point] + 1 || 1))
  })
  yield `After horizontal lines:\n${inspect(coords)}`
  return
}

function * verticalCoords (coords, data) {
  const verticalLines = data.filter(coords => coords.x1 === coords.x2)
  yield inspect({ verticalLines })
  // generate list of coordinates which are on vertical lines
  verticalLines.forEach(el => {
    const xConst = el.x1
    const yMin = Math.min(el.y1, el.y2)
    const yMax = Math.max(el.y1, el.y2)
    const intersections = range(yMin, yMax + 0.5).map(y => `${xConst},${y}`)
    intersections.forEach(point => (coords[point] = coords[point] + 1 || 1))
  })
  yield `After vertical lines:\n${inspect(coords)}`
}

function * posSlopeCoords (coords, data) {
  const posSlopeLines = data.filter(({ x1, x2, y1, y2 }) => {
    return (x1 < x2 && y1 < y2) || (x1 > x2 && y1 > y2)
  })
  yield inspect({ posSlopeLines })
  // generate list of coordinates which are on positive-slope lines
  posSlopeLines.forEach(({ x1, x2, y1, y2 }) => {
    const xVals = range(Math.min(x1, x2), Math.max(x1, x2) + .5)
    const yVals = range(Math.min(y1, y2), Math.max(y1, y2) + .5)
    const intersections = zip(xVals, yVals).map(([x, y]) => `${x},${y}`)
    intersections.forEach(point => (coords[point] = coords[point] + 1 || 1))
  })
  yield `After positive-slope lines:\n${inspect(coords)}`
}

function * negSlopeCoords (coords, data) {
  const negSlopeLines = data.filter(({ x1, x2, y1, y2 }) => {
    return (x1 < x2 && y1 > y2) || (x1 > x2 && y1 < y2)
  })
  yield inspect({ negSlopeLines })
  // generate list of coordinates which are on positive-slope lines
  negSlopeLines.forEach(({ x1, x2, y1, y2 }) => {
    const xVals = range(Math.min(x1, x2), Math.max(x1, x2) + .5)
    const yVals = rangeRight(Math.min(y1, y2), Math.max(y1, y2) + .5)
    const intersections = zip(xVals, yVals).map(([x, y]) => `${x},${y}`)
    intersections.forEach(point => (coords[point] = coords[point] + 1 || 1))
  })
  yield `After positive-slope lines:\n${inspect(coords)}`
}

function dangerousSpots (coords) {
  // count all values >= 2
  return Object.values(coords).filter(value => value > 1)
}

function interpret (input) {
  const coords = input
    .map(line => line.split(/\s+->\s+/))
    .map(([start, end]) => ({
      x1: parseInt(start.split(',')[0]),
      y1: parseInt(start.split(',')[1]),
      x2: parseInt(end.split(',')[0]),
      y2: parseInt(end.split(',')[1])
    }))
  return coords
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
    for (const result of allIntersections(data, config)) yield result
  } else {
    for (const result of hvIntersections(data, config)) yield result
  }
}
