import { strict as assert } from 'assert'
import { inspect } from 'util'

// given motion in the head, provide motion of the tail
function moveKnot(nextHead, origTail) {
  const { x: headX, y: headY } = nextHead
  let { x, y } = origTail
  // Only move tail if head becomes 2 units away in any direction
  if (Math.abs(headX - x) > 1 && Math.abs(headY - y) > 1) {
    // tracks pure diagonal movement
    x = (headX + x) / 2
    y = (headY + y) / 2
  }
  if (Math.abs(headX - x) > 1) {
    x = (headX + x) / 2
    if (headY !== y) y = headY    // tracks knight movement
  }
  if (Math.abs(headY - y) > 1) {
    y = (headY + y) / 2
    if (headX !== x) x = headX    // tracks knight movement
  }
  return { x, y }
}

/** Given positions: [{x:0, y:0}, {x: 1, y:0}, ...] and number of knots
 *  Return { 1: [...], 2: [...], ... }, where 1 matches the above positions,
 *  and each value is an equal-length array of rope knot positions.
 */
function * trackPositions (data, config) {
  const { showIntermediate, numKnots } = config
  const result = { 1: data }
  const knots = Array(numKnots + 1).fill(0).map((_, idx) => idx).slice(2)  // 2 .. numKnots
  if (showIntermediate) yield { knots }
  for (const knot of knots) {
    const positions = []
    let x = 0, y = 0
    let idx = 0
    for (const nextHead of result[knot - 1]) {
      const nextTail = moveKnot(nextHead, { x, y })
      x = nextTail.x
      y = nextTail.y
      positions.push({ x, y })
      assert(Math.abs(nextHead.x - x) <= 1, `Too much motion in X for knot ${knot}, idx ${idx}`)
      assert(Math.abs(nextHead.y - y) <= 1, `Too much motion in Y for knot ${knot}, idx ${idx}`)
      idx++
    }
    if (showIntermediate) yield positions
    result[knot] = positions

  }
  yield result
}

// Given input: ['R 4', 'D 3', ...]
// Track rope head movement via directions, starting at (0,0)
// Return { headPositions: [{x:0, y:0}, {x:1, y:0}, {x:2, y:0}, ...]}
function interpret (input) {
  let x = 0, y = 0
  const headPositions = [{ x, y }]
  const movement = []
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
    headPositions.push(...positions)
    movement.push([direction, quantity])
  }
  return { movement, headPositions }
}

export default function * pickPart (input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (part === 1) {
    config.numKnots = 2
  } else {
    config.numKnots = 10
  }
  // Find the number of unique positions for the rope's tail
  for (const output of trackPositions(data.headPositions, config)) yield inspect(output), result = output
  const serialPositions = result[config.numKnots].map(el => `x:${el.x},y:${el.y}`)
  if (config.showIntermediate) yield inspect(serialPositions)
  yield inspect({ uniquePositions: new Set(serialPositions).size })
}
