import { strict as assert } from 'assert'
import { inspect } from 'util'

/*  Given an array of { a, b, c } objects, where `a` and `b` are numbers and `c` is a boolean toggle,
 *  yields the sum of multiplying all the pairs of numbers.
 */
function* multiplyPairs(matches, config) {
  const { showIntermediate, ignoreToggles = true } = config
  const result = matches.reduce((acc, { a, b, c = true }) => {
    if (showIntermediate) console.log({ ignoreToggles, a, b, c })
    return (ignoreToggles || c) ? acc + a * b : acc
  }, 0)
  yield result
}

/*  Given an array of input: ['<some_text>mul(123,4)<more_text>', ...],
 *  identifies and parses all the `mul(a,b)` expressions and returns matching results.
 *  Also keeps track of `do()` and `don't()` instructions to enable/disable the `mul` operations.
 */
function interpret(input) {
  const instructionRegex = /mul\((?<a>\d{1,3}),(?<b>\d{1,3})\)|(?<enable>do\(\))|(?<disable>don't\(\))/g
  const matches = []
  let match, c = true
  for (const line of input) {
    while( (match = instructionRegex.exec(line)) !== null) {
      const { a, b, enable, disable } = match.groups
      if (enable) c = true
      if (disable) c = false
      if (a && b) matches.push({ a: Number.parseInt(a), b: Number.parseInt(b), c })
    }
  }
  return matches
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { depth: null, maxArrayLength: null })
  if (config.part === 2) {
    // Find answer for part 2
    config.ignoreToggles = false
  }
  for (const output of multiplyPairs(data, config)) yield inspect(output), result = output
}