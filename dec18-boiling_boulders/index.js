import { strict as assert } from 'assert'
import { inspect } from 'util'

const fromCoord = (line) => /^(-?\d+),(-?\d+),(-?\d+)$/.exec(line).slice(1,4).map(x => parseInt(x))
const toCoord = ([x, y, z]) => `${x},${y},${z}`
const neighborsOf = ([x, y, z]) => [
  [x-1, y, z], [x+1, y, z], [x, y-1, z], [x, y+1, z], [x, y, z-1], [x, y, z+1]
]

/* Given a scan of a single lava droplet: ['2,2,2', ...] counts all "surfaces".
 * For each element of lava droplet:
 * - checks 6 neighboring grid coords for presence of lava/air
 * - if air, adds coord to surface array
 * - if lava, continue
 */
function* findSurfaces(droplet, config) {
  const { showIntermediate } = config
  const surfaces = []
  for (const point of droplet) {
    for (const neighbor of neighborsOf(fromCoord(point)).map(toCoord)) {
      if (droplet.includes(neighbor)) continue
      surfaces.push(neighbor)
    }
  }
  yield { numSurfaces: surfaces.length }
}


/* Given a scan of a single lava droplet: ['2,2,2', ...] counts all outward-facing "surfaces":
 * Starting with air queue ['-1,-1,-1'], inspects each element:
 * - checks (up to 6) neighboring grid coords for presence of lava/air
 * - if neighbor is out of bounds, continue
 * - if air, pushes coord to air queue
 * - if lava, pushes coord to surface array
 */
function* findExternalSurfaces(droplet, config) {
  const { showIntermediate, gridSize } = config
  const airQueue = ['-1,-1,-1']
  const air = [...airQueue]
  const surfaces = []
  while(airQueue.length > 0) {
    const point = airQueue.shift()
    for (const [x, y, z] of neighborsOf(fromCoord(point))) {
      // continue if out of bounds
      if (x < -1 || y < -1 || z < -1) continue
      if (x > gridSize || y > gridSize || z > gridSize) continue
      const neighbor = toCoord([x, y, z])
      if (air.includes(neighbor)) continue
      if (droplet.includes(neighbor)) {
        surfaces.push(neighbor)
        continue
      } else {
        airQueue.push(neighbor)
        air.push(neighbor)
      }
    }
  }
  yield { numSurfaces: surfaces.length }
}

/* Given an arrray of input: ['2,2,2', ...]
 */
function interpret(input) { return input }

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')
  config.gridSize = 25

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of findSurfaces(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    for (const output of findExternalSurfaces(data, config)) yield inspect(output), result = output
  }
}
