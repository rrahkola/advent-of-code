import { strict as assert } from 'assert'
import { inspect } from 'util'

/** Given { headPositions: [{x:0, y:0}, {x: 1, y:0}, ...] },
 *  Return { headPositions, tailPosiitions }, where tailPositions
 *  is an equal-length array of rope tail positions.
 */
function * trackTail (data, config) {
  const { showIntermediate } = config
  const { headPositions } = data
  const tailPositions = []
  let x = 0, y = 0
  for (const { x: headX, y: headY } of headPositions) {
    // Only move tail if head becomes 2 units away in any direction
    if (Math.abs(headX - x) > 1) {
      x = (headX + x) / 2
      if (headY !== y) y = headY    // tracks diagonal movement
    }
    if (Math.abs(headY - y) > 1) {
      y = (headY + y) / 2
      if (headX !== x) x = headX    // tracks diagonal movement
    }
    tailPositions.push({ x, y })
  }
  yield { headPositions, tailPositions }
}

// Given input: ['R 4', 'D 3', ...]
// Track rope head movement via directions, starting at (0,0)
// Return { headPositions: [{x:0, y:0}, {x:1, y:0}, {x:2, y:0}, ...]}
function interpret (input) {
  let x = 0, y = 0
  const data = { motions: input, headPositions: [{ x, y }] }
  const move = {   // use auto-increments
    'R': () => ({ x: ++x, y }),
    'L': () => ({ x: --x, y }),
    'U': () => ({ x, y: ++y }),
    'D': () => ({ x, y: --y })
  }
  for (const line of input) {
    let [direction, quantity] = line.split(/\s+/)
    quantity = parseInt(quantity)
    const positions = Array(quantity).fill(0).map(() => move[direction]())
    data.headPositions.push(...positions)
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
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  let result
  if (part === 1) {
    // Find the number of unique positions for the rope's tail
    for (const output of trackTail(data, config)) {
      result = output
      yield inspect(result)
    }
    const serialPositions = result.tailPositions.map(el => `x:${el.x},y:${el.y}`)
    if (config.showIntermediate) yield inspect(serialPositions)
    const uniquePositions = [...new Set(serialPositions)]
    yield inspect({ uniquePositions: uniquePositions.length })
  } else {
    // Find answer for part 2
    for (const result of trackTail(data, config)) yield inspect(result)
  }
}
