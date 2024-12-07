import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null
inspect.defaultOptions.breakLength = 200

const coord = ({ col, row }) => `${col},${row}`
const coordDir = ({ col, row, dir }) => `${col},${row},${dir}`
const mv = {
  up: ({ col, row }) => ({ col, row: row - 1, dir: 'up' }),
  rt: ({ col, row }) => ({ col: col + 1, row, dir: 'rt' }),
  dn: ({ col, row }) => ({ col, row: row + 1, dir: 'dn' }),
  lt: ({ col, row }) => ({ col: col - 1, row, dir: 'lt' }),
}
const dirs = ['up', 'rt', 'dn', 'lt', 'up'] // add extra for 90-degree turn

const outOfBounds = ([minCol, minRow, maxCol, maxRow]) => ({ col, row }) => {
  return col < minCol || col > maxCol || row < minRow || row > maxRow
}
const walk = (lab, boundingBox) => ({ col, row, dir }) => {
  let pos = mv[dir]({ col, row, dir })
  if (outOfBounds(boundingBox)(pos)) return 'out'
  if (!lab.includes(coord(pos))) {
    const turnIdx = dirs.indexOf(dir) + 1
    pos = {col, row, dir: dirs[turnIdx]} // Just turn, don't move yet
  }
  return pos
}

/*  Given a lab with boundingBox and a start position,
 *  yields the distinct positions visited by the guard.
 */
function* guardPath({ lab, boundingBox, start }, config) {
  const { showIntermediate } = config
  const path = []
  const walkTheLab = walk(lab, boundingBox)
  let pos = start
  while (pos !== 'out') {
    // if (showIntermediate) console.log({ msg: 'Walking the lab', pos })
    path.push(pos)
    pos = walkTheLab(pos)
  }
  yield { path }
}

/*  Given a lab with boundingBox, a start position, and the predicted path,
 *  yields the list of positions on the path which, if replaced by a single obstacle,
 *  would cause the guard to loop.
 *  Method: For each path point, check if a loop can be formed by placing an obstacle there.
 */
function* findLoops({ lab, boundingBox, path }, config) {
  const { showIntermediate } = config
  const loopObstacles = []
  // Insight: need to track attempted obstacles since path may revisit same point in a different direction
  const visited = new Set([coord(path[0])])
  path.forEach((obstacle, idx) => {
    if (visited.has(coord(obstacle))) return // Skip any position already tried
    visited.add(coord(obstacle))
    if (showIntermediate) console.log({ msg: `Checking obstacle ${idx}`, o: obstacle })
    // Construct a lab with an extra obstacle at path[idx]; start at path[idx-1] and walk until 'out' or looped
    const labIdx = lab.indexOf(coord(obstacle))
    const walkTheLab = walk(lab.toSpliced(labIdx, 1), boundingBox)
    let pos = path[idx-1]
    const possibleLoop = new Set()
    while (pos !== 'out') {
      possibleLoop.add(coordDir(pos))
      pos = walkTheLab(pos)
      if (possibleLoop.has(coordDir(pos))) break
    }
    if (pos === 'out') return // No loop formed
    if (showIntermediate) console.log({ msg: `Loop at ${idx}`, size: possibleLoop.size, o: obstacle })
    loopObstacles.push({ ...obstacle, idx, size: possibleLoop.size, loopPos: coordDir(pos) })
  })
  yield { loopObstacles }
}

/* TODO: Remove this eventually, it doesn't take into account forming loops from other directions */
// Given an obstacle and bounding box, provide a filter function to find looping points
const inline = ({ col: blockCol, row: blockRow, boundingBox: [minCol, minRow, maxCol, maxRow] }) => ({
  up: ({ col, row, dir }) => row > blockRow && row < maxRow && col === blockCol && dir === 'lt',
  rt: ({ col, row, dir }) => col < blockCol && col > minCol && row === blockRow && dir === 'up',
  dn: ({ col, row, dir }) => row < blockRow && row > minRow && col === blockCol && dir === 'rt',
  lt: ({ col, row, dir }) => col > blockCol && col < maxCol && row === blockRow && dir === 'dn',
})
/*  Given an ordered list of obstacles,
 *  yields an array of possible new obstacles causing the guard to loop.
 */
function* loopOptions({ path, obstacles, boundingBox }, config) {
  const { showIntermediate } = config
  const possible = []
  obstacles.forEach((obstacle, idx) => {
    const { dir, step } = obstacle
    // Find all visited points in line with obstacle -- each are possible loops
    const visitedInline = path.slice(step).filter(inline({ ...obstacle, boundingBox })[dir])
    if (showIntermediate) console.log({ obstacle, visitedInline })
    possible.push(...visitedInline)
  })
  yield possible
}

/*  Given an array of input: ['....#.....', '.........#', ...],
 *  yields:
 *    - lab -- an array of unobcoorducted coords: ['0,0', '0,1', '0,2', '0,3', '0,5', ...]
 *    - start -- the guard's starting position: { col, row, dir }
 */
function interpret(input) {
  const lab = []
  let start
  let row = 0
  for (const line of input) {
    line.split('').forEach((cell, col) => {
      if (cell !== '#') lab.push(coord({ col, row }))
      if (cell === '^') start = { col, row, dir: 'up'}
    })
    row++
  }
  const boundingBox = `${lab[0]},${lab.slice(-1)[0]}`.split(',').map(Number)
  console.log({ boundingBox })
  return { lab, boundingBox, start }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of coordings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  for (const output of guardPath(data, config)) yield inspect(output), result = output
  if (config.part === 1) {
    // Find answer for part 1
    const visited = new Set(result.path.map(coord))
    yield `Distinct positions visited: ${visited.size}`
  } else {
    // Find answer for part 2
    for (const output of findLoops({ ...data, ...result }, config)) yield inspect(output), result = output
    const distinctObstacles = new Set(result.loopObstacles.map(coord))
    yield `Possible new obstacles: ${distinctObstacles.size}`
  }
}
