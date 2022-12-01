import { strict as assert } from 'assert'
import { inspect } from 'util'
import range from 'lodash/range.js'
import uniq from 'lodash/uniq.js'
import sum from 'lodash/sum.js'

function * polymerScore (data, config) {
  const { showIntermediate } = config
  let { template, mapping } = data
  let frequencies = {}
  for (const step of range(config.steps)) {
    template = insertion({ template, mapping })
    frequencies = frequencyCount(data.chars, template)
    if (showIntermediate) {
      const result = {
        step: step + 1,
        template: template.match(/.{1,50}/g),
        frequencies
      }
      yield inspect(result)
    }
  }
  const score = diffMaxMin(frequencies)
  yield `Polymer Score: ${score}`
}

function insertion (data) {
  const { template, mapping } = data
  const insert = pair => mapping[pair][0]
  const result = template
    .slice(0, -1)
    .split('')
    .map((char, idx) => `${char}${template[idx + 1]}`)
    .map(insert)
    .concat(template.slice(-1))
    .join('')
  return result
}

function frequencyCount (chars, template) {
  const occurrences = char => template.match(new RegExp(char, 'g')).length
  const frequencies = Object.fromEntries(
    chars.map(char => [char, occurrences(char)])
  )
  return frequencies
}

function diffMaxMin (frequencies) {
  return (
    Math.max(...Object.values(frequencies)) -
    Math.min(...Object.values(frequencies))
  )
}

function * quickPolymerScore (data, config) {
  const { showIntermediate } = config
  const { pairs, ends, chars, mapping } = data
  let pairFrequencies = pairCount(pairs, ends)
  let frequencies = {}
  for (const step of range(config.steps + 1)) {
    frequencies = countCharsFromPairs(chars, pairFrequencies)
    if (showIntermediate) yield inspect({ step, pairFrequencies, frequencies })
    pairFrequencies = insertPairs(pairFrequencies, mapping)
  }
  const score = diffMaxMin(frequencies)
  yield `Polymer Score: ${score}`
}

function pairCount (pairs, ends = []) {
  const count = Object.fromEntries(ends.map(end => [end, 1]))
  for (const pair of uniq(pairs)) {
    count[pair] = pairs.filter(el => el === pair).length
  }
  return count
}

function countCharsFromPairs (chars, pairFrequencies) {
  const charCounts = {}
  const pairs = Object.keys(pairFrequencies)
  for (const char of chars) {
    const matches = pairs
      .filter(pair => pair.includes(char))
      .concat([`${char}${char}`])
    charCounts[char] =
      sum(matches.map(match => pairFrequencies[match] || 0)) / 2
  }
  return charCounts
}

// given a set of pair frequencies, applies mapping to yield a new set of pair frequencies
function insertPairs (pairFrequencies, mapping) {
  const result = {}
  for (const [pair, count] of Object.entries(pairFrequencies)) {
    const [first, second] = mapping[pair] || [pair]
    result[first] = result[first] ? result[first] + count : count
    if (second) result[second] = result[second] ? result[second] + count : count
  }
  return result
}

function interpret (input) {
  const [template, ruleStr] = input.split('\n\n')
  const chars = uniq(input.match(/[A-Z]/g))
  const ends = [template[0], ...template.slice(-1)]
  const pairs = template
    .slice(0, -1)
    .split('')
    .map((char, idx) => `${char}${template[idx + 1]}`)
  const rules = ruleStr
    .split('\n')
    .filter(el => Boolean(el))
    .map(rule => {
      const [pair, insertion] = rule.trim().split(' -> ')
      return { pair, insertion }
    })
  const mapping = Object.fromEntries(
    rules.map(({ pair, insertion }) => [
      pair,
      [`${pair[0]}${insertion}`, `${insertion}${pair[1]}`]
    ])
  )
  return { template, pairs, ends, rules, mapping, chars }
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
    config.steps = 40
    for (const result of quickPolymerScore(data, config)) yield result
  } else {
    config.steps = 10
    for (const result of polymerScore(data, config)) yield result
  }
}
