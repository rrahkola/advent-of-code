import { strict as assert } from 'assert'
import { inspect } from 'util'
const unique = (val, idx, arr) => arr.indexOf(val) === idx
const cmpByDim = (dims) => (a, b) => dims.reduce((acc, dim) => (acc || (Math.min(...a.map(el => el[dim])) - Math.min(...b.map(el => el[dim])))), 0)
// General memoizing function, with .cache property for inspection
function memoize(fn) {
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
// returns list of cells below the brick, or false if none
function checkBelow(brick, stack) {
  const below = brick.cells
    .map(({ id, idx, z }) => {
      const prev = stack[idx-1]
      return (z === 1)
        ? 'gnd'
        : (prev && prev.z === z-1 && prev.id !== id) ? prev.id : []
    })
    .flat()
    .filter(unique)
  return (below.length > 0) ? Object.assign(brick, { below }) : false
}

/*  Given an array of bricks [{ id: '000', cells: [{id, x, y, z}, ...], above: [], below: [] }, ...],
 *  lowers bricks so they are touching, then determines the bricks which would fall for each brick pulled.
 *  Yields the same array of bricks with 'chain' property added.
 */
function* checkJenga(bricks, config) {
  const { showIntermediate, checkBricks } = config
  // stack is an ordered array of cells, w/ .idx property for direct access
  const stack = bricks.map(brick => brick.cells)
    .flat()
    .sort((a,b) => ['x','y','z'].reduce((acc,dim) => acc || a[dim] - b[dim], 0))
    .map((cell, idx) => Object.assign(cell, { idx }))
  // pass #1 -- lower each brick in turn
  for (const brick of bricks) {
    while (!checkBelow(brick, stack)) brick.cells.forEach(cell => cell.z--)
  }
  // create the adjacency list
  const below = bricks.reduce((obj, brick) => Object.assign(obj, { [brick.id]: brick.below }), {})
  if (showIntermediate) yield { bricks, below }
  // pass #2 -- construct dependency chain
  for (const brick of bricks) {
    const isGrounded = memoize(id => {
      if (below[id].includes('gnd')) return true
      return (below[id].length === 1 && below[id][0] === brick.id) ? false : below[id].some(isGrounded)
    })
    const bricksAbove = (checkBricks === 'anyAbove')
      ? bricks.slice(bricks.indexOf(brick)+1)
      : bricks.filter(el => el.below.includes(brick.id))
    if (showIntermediate) console.log('id:', brick.id, ', bricksAbove:', bricksAbove.map(el => el.id))
    for (const el of bricksAbove) {
      const grounded = isGrounded(el.id)
      if (!grounded) brick.chain.push(el.id)
    }
    if (showIntermediate) yield { id: brick.id, chain: brick.chain }
  }
  yield bricks
}

/*  Given an array of input: ['1,0,1~1,2,1', ...],
 *  yields an array of bricks w/ x,y,z coords:
 *    [{ id: '000', cells: [{id, x, y, z}, ...], above: [], below: [] }, ...]
 */
function interpret(input) {
  const bricks = []
  for (const line of input) {
    const cells = []
    const ends = /^(?<x1>\d+),(?<y1>\d+),(?<z1>\d+)~(?<x2>\d+),(?<y2>\d+),(?<z2>\d+)$/.exec(line).groups
    ;['x1', 'x2', 'y1', 'y2', 'z1', 'z2'].map(key => ends[key] = parseInt(ends[key]))
    const xRange = Array.from({ length: Math.abs(ends.x1 - ends.x2) + 1 }, (_, idx) => Math.min(ends.x1, ends.x2) + idx)
    const yRange = Array.from({ length: Math.abs(ends.y1 - ends.y2) + 1 }, (_, idx) => Math.min(ends.y1, ends.y2) + idx)
    const zRange = Array.from({ length: Math.abs(ends.z1 - ends.z2) + 1 }, (_, idx) => Math.min(ends.z1, ends.z2) + idx)
    xRange.map(x => yRange.map(y => zRange.map(z => cells.push({ id: '', x, y, z }))))
    bricks.push(cells)
  }
  return bricks
    .sort(cmpByDim(['z', 'y', 'x']))
    .map((cells, idx) => {
      const id = Number(idx).toString(16).padStart(3, '0')
      cells.forEach(cell => cell.id = id)
      return { id, cells, chain: [] }
    })
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
  if (config.part === 1) {
    for (const output of checkJenga(data, config)) yield inspect(output, { depth: null, maxArrayLength: null }), result = output
    yield inspect({ canBeDisintegrated: data.filter(brick => brick.chain.length === 0).length })
  } else {
    config.checkBricks = 'anyAbove'
    for (const output of checkJenga(data, config)) yield inspect(output, { depth: null, maxArrayLength: null }), result = output
    yield inspect({ allChains: data.reduce((acc, brick) => acc + brick.chain.length, 0) })
  }

}
