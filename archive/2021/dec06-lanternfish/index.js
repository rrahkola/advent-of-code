import { strict as assert } from 'assert'
import { inspect } from 'util'
import range from 'lodash/range.js'
import sum from 'lodash/sum.js'

function * lanternfishPopulation (data, config) {
  const { showIntermediate } = config
  for (let day = 1; day <= 80; day++) {
    data.day = day
    growLanternfish(data.ages)
    if (showIntermediate) yield inspect(data)
  }
  yield `Lanternfish population: ${sum(data.ages)}`
}

function * lanternfishLongevity (data, config) {
  const { showIntermediate } = config
  for (let day = 1; day <= 256; day++) {
    data.day = day
    growLanternfish(data.ages)
    if (showIntermediate) yield inspect(data)
  }
  yield `Lanternfish population: ${sum(data.ages)}`
}

function growLanternfish(ages) {
  assert(ages.length === 9, '0-8 days must all be represented')
  const hatching = ages.shift()
  ages.push(hatching)
  ages[6] = ages[6] + hatching
}

function interpret (input) {
  const initial = input[0].split(/\s*,\s*/)
  const ages = range(0,9,0)
  initial.forEach(age => ages[age] = ages[age] + 1)
  return { initial, day: 0, ages }
}

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) &&
      input.length > 0 &&
      (typeof input[0] === 'string' || input[0] instanceof String),
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert(part <= 2, 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (part === 2) {
    for (const result of lanternfishLongevity(data, config)) yield result
  } else {
    for (const result of lanternfishPopulation(data, config)) yield result
  }
}
