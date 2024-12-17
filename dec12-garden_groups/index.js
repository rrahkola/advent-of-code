import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null

const coord = ({ col, row }) => `${col},${row}`
const mv = {
  'up': ({ col, row }) => coord({ col, row: row - 1 }),
  'rt': ({ col, row }) => coord({ col: col + 1, row }),
  'dn': ({ col, row }) => coord({ col, row: row + 1 }),
  'lt': ({ col, row }) => coord({ col: col - 1, row }),
}
const borders = { up: 'top', rt: 'right', dn: 'bottom', lt: 'left' }
const dirs = ['up', 'rt', 'dn', 'lt']

/* Returns the contiguous region of coordinates with a common plant type */
/* BFS example */
function fillRegion(garden, pos) {
  const { plant } = pos
  const region = [coord(pos)]
  const queue = [pos]
  let nextPos
  while(nextPos = queue.shift()) {
    const nextMoves = dirs.map(dir => mv[dir](nextPos))
      .filter(c => garden[c] && (garden[c].plant === plant) && !region.includes(c))
      region.push(...nextMoves)
      queue.push(...nextMoves.map(c => garden[c]))
  }
  return region.sort()
}


const addPos = (garden) => (c) => ({ ...garden[c], c })
/* Returns the list of 'coordinates' forming the region's border.  Convex corners are included twice. */
function findPerimeter(posRegion) {
  const perimeter = []
  const regionCoords = posRegion.map(({ c }) => c)
  const queue = [...posRegion]
  let nextPos
  while (nextPos = queue.shift()) {
    const border = dirs.map(dir => ({ ...nextPos, dir, out: mv[dir](nextPos) }))
      .filter(({ out }) => !regionCoords.includes(out))
    perimeter.push(...border)
  }
  // console.log({ regionCoords, perimeter })
  return perimeter
}
/*  Given a perimeter, [{ col, row, c, dir }, ...], checks for corners */
function findCorners(perimeter, garden) {
  /*  Two cases:  convex vs. concave corners
   *    B      B (diagonal)       B  ||  A (diagonal)
   *  =====||                   =====||
   *    A  ||  B (right)          A      A (right)
   */
  const walk = { // [0] check right (convex), [1] check right diagonal (concave)
    up: [mv['rt'], ({ col, row }) => `${col + 1},${row - 1}`],
    rt: [mv['dn'], ({ col, row }) => `${col + 1},${row + 1}`],
    dn: [mv['lt'], ({ col, row }) => `${col - 1},${row + 1}`],
    lt: [mv['up'], ({ col, row }) => `${col - 1},${row - 1}`],
  }
  const corners = perimeter.filter(({ dir, plant, ...pos }) => {
    const [right, diagonal] = walk[dir].map(m => garden[m(pos)])
    const result = (!right || right.plant !== plant) || (diagonal && diagonal.plant === plant)
    return Boolean(result)
  })
  return corners
}
/*  Given a garden and an array of regions,
 *  yields the total price for fencing the regions
 */
function* sizeRegions({ garden, regions }, config) {
  const { showIntermediate } = config
  const coordWithPos = addPos(garden)
  const sizes = []
  for (const { plant, coords } of regions) {
    const area = coords.length
    const perimeter = findPerimeter(coords.map(coordWithPos))
    const sides = findCorners(perimeter, garden)
    if (showIntermediate) console.log({ plant, area, perimeter, sides })
    sizes.push({ plant, area, perimeter, sides, coords})
  }
  yield { sizes }
}

/*  Given an array of input: ['RRRRIICCFF', 'RRRRIICCCF', ...],
 *  yields:
 *   - a garden map of coordinates and their plant type
 *   - an array of regions of coordinates with a common plant type
 */
function interpret(input) {
  const garden = {}
  // 1st pass -- generate garden
  let row = 0
  for (const line of input) {
    line.split('').forEach((plant, col) => garden[coord({ col, row })] = { col, row, plant })
    row++
  }
  // 2nd pass -- generate regions
  const visited = []
  const regions = []
  for (const [coord, pos] of Object.entries(garden)) {
    const { plant } = pos
    if (visited.includes(coord)) continue
    const coords = fillRegion(garden, pos)
    regions.push({ plant, coords })
    visited.push(...coords)
  }
  return { garden, regions }
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
  for (const output of sizeRegions(data, config)) yield inspect(output), result = output
  if (config.part === 1) {
    // Find answer for part 1
    yield `Total price: ${result.sizes.reduce((acc, { area, perimeter }) => acc + area * perimeter.length, 0)}`
  } else {
    // Find answer for part 2
    yield `Total price: ${result.sizes.reduce((acc, { area, sides }) => acc + area * sides.length, 0)}`
  }
}
