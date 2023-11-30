import { strict as assert } from 'assert'
import { inspect } from 'util'

// Given arrays of two ranges, check for one range subsuming the other
function * findSubsumed (data, config) {
  const { showIntermediate } = config
  const subsumedPairs = data.filter(pair => {
    const isASubsumed = (pair.minB <= pair.minA) && (pair.maxB >= pair.maxA)
    const isBSubsumed = (pair.minA <= pair.minB) && (pair.maxA >= pair.maxB)
    return isASubsumed || isBSubsumed
  })
  if (showIntermediate) yield { subsumedPairs }
  yield { totalSubsumed: subsumedPairs.length }
}

// Given arrays of two ranges, check for any overlapping ranges
function * findOverlapping (data, config) {
  const { showIntermediate } = config
  const overlappingPairs = data.filter(pair => {
    const isMinAOverlapped = (pair.minB <= pair.minA) && (pair.maxB >= pair.minA)
    const isMinBOverlapped = (pair.minA <= pair.minB) && (pair.maxA >= pair.minB)
    return isMinAOverlapped || isMinBOverlapped
  })
  if (showIntermediate) yield { overlappingPairs }
  yield { totalOverlapped: overlappingPairs.length }
}

function parseLine (line) {
  const lineRegex = /^(?<minA>\d+)-(?<maxA>\d+),(?<minB>\d+)-(?<maxB>\d+)$/
  const matching = line.match(lineRegex)
  assert(Boolean(matching), 'Input does not match {minA}-{maxA},{minB}-{maxB} format!')
  const data = {}
  for (const group in matching.groups) {
    data[group] = parseInt(matching.groups[group])
  }
  return data
}

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  const data = input.map(parseLine)
  if (config.showIntermediate) yield inspect(data)
  if (part === 1) {
    // Find the number of pairs where one range overlaps completely
    for (const result of findSubsumed(data, config)) yield inspect(result)
  } else {
    // Find answer for part 2
    for (const result of findOverlapping(data, config)) yield inspect(result)
  }
}
