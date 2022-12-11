import { strict as assert } from 'assert'
import { inspect } from 'util'

function* part1(data, config) {
  const { showIntermediate } = config
  yield 'Howdy'
}

function interpret(input) { return input }

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of part1(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    for (const output of part1(data, config)) yield inspect(output), result = output
  }
}
