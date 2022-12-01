import { strict as assert } from 'assert'
import { inspect } from 'util'

// acc: [ [sum_0, sum_1], [_, _], ... ]
function sumDigits (acc, intArr) {
  intArr.forEach((pos, idx) => {
    acc[idx][pos] = acc[idx][pos] + 1
  })
  return acc
}

// [ [5, 7], [8, 4], [9, 3] ] => [ 1, 0, 0 ]
function mostPopularDigit (frequencies) {
  const result = []
  for (const pos of frequencies) {
    result.push((pos || []).lastIndexOf(Math.max(...pos)))
  }
  return result
}

// [ [5, 7], [8, 4], [9, 3] ] => [ 0, 1, 1 ]
function leastPopularDigit (frequencies) {
  const result = []
  for (const pos of frequencies) {
    result.push((pos || []).indexOf(Math.min(...pos)))
  }
  return result
}

const arr2Int = arr => parseInt(arr.join(''), 2)

/** Given an array of binary diagnostics
 * - gamma rate; most frequent bit in each place
 * - epsilon rate; least frequent bit in each place
 * - result: parseInt(gamma,2) * parseInt(epsilon,2)
 */
function * powerConsumption (data, config) {
  const { showIntermediate } = config
  const size = data[0].length
  const frequencies = data.reduce(sumDigits, [...Array(size)].map(el => [0, 0]))
  if (showIntermediate) yield inspect(frequencies)
  const power = {
    gammaArr: mostPopularDigit(frequencies),
    epsilonArr: leastPopularDigit(frequencies)
  }
  power.gamma = arr2Int(power.gammaArr)
  power.epsilon = arr2Int(power.epsilonArr)
  if (showIntermediate) yield inspect(power)
  yield `Power consumption: ${power.gamma * power.epsilon}`
}

const match = (pos, value) => arr => arr[pos] === value

function * oxygenRating(data, config) {
  const { pos = 0 } = config
  const size = data[0].length
  const frequencies = data.reduce(sumDigits, [...Array(size)].map(el => [0, 0]))
  yield inspect(frequencies)
  config.comparison = mostPopularDigit(frequencies)
  const matching = data.filter(match(pos, config.comparison[pos]))
  yield matching
  if (matching.length > 1) {
    for (const result of oxygenRating(matching, {...config, pos: pos + 1 })) yield result
  } else {
    yield matching[0]
  }
}

function * co2Scrubbing(data, config) {
  const { pos = 0 } = config
  const size = data[0].length
  const frequencies = data.reduce(sumDigits, [...Array(size)].map(el => [0, 0]))
  yield inspect(frequencies)
  config.comparison = leastPopularDigit(frequencies)
  const matching = data.filter(match(pos, config.comparison[pos]))
  yield matching
  if (matching.length > 1) {
    for (const result of co2Scrubbing(matching, {...config, pos: pos + 1 })) yield result
  } else {
    yield matching[0]
  }
}

/** Given an array of binary diagnostics
 * - find the closest entry matching the most popular bits (o2)
 * - find the closest entry matching the least popular bits (co2)
 * - result: parseInt(o2, 2) * parseInt(co2, 2)
 */
function * lifeSupport (data, config) {
  const { showIntermediate } = config
  const life = {}
  for (const result of oxygenRating(data, config)) {
    life.o2Arr = result
    if (showIntermediate) yield inspect(life)
  }
  life.o2 = arr2Int(life.o2Arr)
  for (const result of co2Scrubbing(data, config)) {
    life.co2Arr = result
    if (showIntermediate) yield inspect(life)
  }
  life.co2 = arr2Int(life.co2Arr)
  yield `Life Support: ${life.o2 * life.co2}`
}

// ['101101', ...] => [ [1, 0, 1, 1, 0, 1], ... ]
function interpret (input) {
  return input.map(el => el.split('').map(int => parseInt(int)))
}

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert(part <= 2, 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield data.join('\n')
  if (part === 2) {
    for (const result of lifeSupport(data, config)) yield result
  } else {
    for (const result of powerConsumption(data, config)) yield result
  }
}
