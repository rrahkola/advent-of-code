import { strict as assert } from 'assert'
import { inspect } from 'util'
// import { memoize } from '../util/scratchpad.js'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null


// General memoizing function, with .cache property for inspection
export function memoize(fn) {
  const cache = {}
  function memo(...args) {
    const key = JSON.stringify(args) // more adaptable
    // const key = args.join(' ') // better for this case
    if (cache[key] !== undefined) return cache[key]
    const result = fn(...args)
    cache[key] = result
    return result
  }
  memo.cache = cache
  return memo
}

function mutateStone(stone) {
  if (stone === '0') return ['1']
  if (stone.length % 2 === 0) {
    const mid = stone.length / 2
    const first = stone.slice(0, mid)
    const second = stone.slice(mid).replace(/^0+/, '') || '0'
    return [first, second]
  }
  return ['' + Number.parseInt(stone) * 2024]
}

/*  Given a collection of stones,
 *  applies transformation rules to the set of stones
 *  for a consecutive number of "blinks" (steps).
 */
function* blink({ stones: originalStones = [] }, config) {
  const { showIntermediate, blinkCount } = config
  let stones = [...originalStones]
  let change = memoize(mutateStone)
  for (let blink = 1; blink <= blinkCount; blink++) {
    stones = stones.flatMap(change)
    if (showIntermediate) console.log({ msg: `Blink ${blink}`, stones })
  }
  yield stones
}

/*  Given an array of input: ['125 17'],
 *  yields an array of stones with engraved numbers (as strings)
 */
function interpret(input) {
  const stones = input.flatMap(line => line.split(' '))
  return { stones }
}

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
    config.blinkCount = 25
    for (const output of blink(data, config)) yield inspect(output), result = output
    yield `After ${config.blinkCount} blinks, there are ${result.length} stones.`
  } else {
    // Find answer for part 2
    for (const output of blink(data, config)) yield inspect(output), result = output
  }
}
