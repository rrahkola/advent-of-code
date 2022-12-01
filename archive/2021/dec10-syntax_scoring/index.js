import { strict as assert } from 'assert'
import { inspect } from 'util'
import sortBy from 'lodash/sortBy.js'


const CLOSERS = {
  '(': ')',
  '{': '}',
  '[': ']',
  '<': '>'
}

const SYNTAX_SCORES = {
  ')': 3,
  ']': 57,
  '}': 1197,
  '>': 25137
}

const AUTOCOMPLETE_SCORES = {
  ')': 1,
  ']': 2,
  '}': 3,
  '>': 4
}


function * syntaxScore (data, config) {
  const { showIntermediate } = config
  const corrupted = []
  for (const line of data.transformed) {
    const match = line.match(/(\)|\]|\}|\>)/)
    if (match) corrupted.push(match)
  }
  if (showIntermediate) yield inspect(corrupted)
  const syntaxScore = corrupted
    .map(match => SYNTAX_SCORES[match[0]])
    .reduce((sum, el) => sum + el, 0)
  yield `Syntax Score: ${syntaxScore}`
}

function * autocompleteScore (data, config) {
  const { showIntermediate } = config
  const incomplete = []
  for (const line of data.transformed) {
    const match = line.match(/(\)|\]|\}|\>)/)
    if (!match) incomplete.push(line)
  }
  if (showIntermediate) yield inspect(incomplete)
  const autocompleteScores = incomplete
    .map(line => autocomplete(line))
    .map(autocompletion => score(autocompletion))
  if (showIntermediate) yield inspect(autocompleteScores)
  const medianIdx = Math.floor(autocompleteScores.length / 2)
  yield `Autocomplete Score: ${sortBy(autocompleteScores)[medianIdx]}`
}

function autocomplete (line) {
  return line
    .split('')
    .reverse()
    .map(char => CLOSERS[char])
}

function score (autocompletion) {
  return autocompletion.reduce((score, char) => score * 5 + AUTOCOMPLETE_SCORES[char], 0)
}

function removePairs (str = '') {
  const pairsRegex = /(\(\)|\[\]|\{\}|\<\>)/g
  let copy = str
  let next = copy.replace(pairsRegex, '')
  while (next && copy !== next) {
    copy = next
    next = copy.replace(pairsRegex, '')
    // console.log({ copy, next }, 'iterating')
  }
  return next
}

function interpret (input) {
  const original = input
  // const parsed = input.map(line => Chunk.parseString(line))
  const transformed = original.map(removePairs)
  return { original, transformed }
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
    for (const result of autocompleteScore(data, config)) yield result
  } else {
    for (const result of syntaxScore(data, config)) yield result
  }
}
