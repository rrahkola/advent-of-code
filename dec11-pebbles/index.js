import { strict as assert } from 'assert'
import { inspect } from 'util'
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
  return ['' + (Number.parseInt(stone) * 2024)]
}

const batchMutations = (batchCount) => (original) => {
  let stoneFreqs = { [original]: 1 }
  for (let i=1; i <= batchCount; i++) {
    stoneFreqs = Object.entries(stoneFreqs).reduce((acc, [stone, freq]) => {
      for (const newStone of mutateStone(stone)) {
        acc[newStone] = (acc[newStone] || 0) + freq
      }
      return acc
    }, {})
    // console.log({ msg: `Mutate ${i}`, stoneFreqs})
  }
  return stoneFreqs
}

/*  Given a collection of stones,
 *  applies transformation rules to the set of stones
 *  for a consecutive number of "blinks" (steps).
 */
function* blinkBatch({ stones: originalStones = [] }, config) {
  const { showIntermediate, blinkCount, batchCount = 5 } = config
  let change = memoize(batchMutations(batchCount))
  let stoneFreqs = originalStones.reduce((acc, stone) => ({ ...acc, [stone]: 1 }), {})
  let blink = 0
  while (blink < blinkCount) {
    // Every batchCount blinks, track the frequency count of each stone label
    const newFreqs = {}
    for (const [stone, freq] of Object.entries(stoneFreqs)) {
      Object.entries(change(stone)).forEach(([mutation, mutateFreq]) => {
        newFreqs[mutation] = (newFreqs[mutation] || 0) + mutateFreq * freq
      })
    }
    stoneFreqs = newFreqs
    blink += batchCount
    if (showIntermediate) console.log({ msg: `Blink ${blink}`, stoneFreqs })
  }
  const count = Object.values(stoneFreqs).reduce((acc, freq) => acc + freq, 0)
  yield { stoneFreqs, count }
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
  config.blinkCount = (config.part === 1) ? 25 : 75
  for (const output of blinkBatch(data, config)) yield inspect(output), result = output
  yield `After ${config.blinkCount} blinks, there are ${result.count} stones. And ${Object.keys(result.stoneFreqs).length} unique labels.`
}
