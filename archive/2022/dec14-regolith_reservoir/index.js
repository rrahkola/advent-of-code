import { strict as assert } from 'assert'
import { inspect } from 'util'
import { default as parseCave, plotCave, plotCaveGrid } from './cave.js'

function dropSand(x, y, grid) {
  assert(grid.length >= x, `grid is too small for x=${x}`)
  const nextIdx = grid[x].findIndex((el, idx) => Boolean(el) && idx >= y)
  if (nextIdx == y) return undefined // blocked the source??
  if (grid[x][nextIdx] === 'v') return undefined // hit the abyss
  if (!grid[x-1][nextIdx]) return dropSand(x-1, nextIdx, grid)
  if (!grid[x+1][nextIdx]) return dropSand(x+1, nextIdx, grid)
  return { x, y: nextIdx - 1 }
}

function* fillChamber(data, config) {
  const { xDrop = 500, showIntermediate } = config
  const { grid, xMin } = data
  yield inspect({ xMin, xDrop, drop: xDrop - xMin, scale: grid.length })
  let granule = dropSand(xDrop - xMin, 0, grid)
  // Continue until sand begins entering abyss
  while (granule) {
    grid[granule.x][granule.y] = 'o'
    granule = dropSand(xDrop - xMin, 0, grid)
  }
  if (showIntermediate) yield plotCaveGrid(grid).join('\n')
  const sandStacks = grid.map(col => col.filter(el => el === 'o'))
  yield inspect({ totalSand: sandStacks.flat().length })
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  if (config.part === 1) {
    // Find number of granules until abyss is hit
  } else {
    // Find number of granules until source is blocked
    config.abyssChar = '#'
  }
  const data = parseCave(input, config)
  if (config.showIntermediate) yield plotCaveGrid(data.grid).join('\n')
  for (const output of fillChamber(data, config)) yield output, result = output
}
