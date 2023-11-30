import { strict as assert } from 'assert'
import { inspect } from 'util'

// For an ordered list of nodes, select out the ones which are visible from point 0
function selectVisible (nodes) {
  let visibleNodes = []
  let maxHeight = -1 // lower than 0
  for (const node of nodes) {
    if (node.value > maxHeight) {
      visibleNodes.push(node)
      maxHeight = node.value
    }
  }
  return visibleNodes
}

// Given { nodes: [{ row: 0, col: 0, value: a }, ...], height: h, width: w }
// filter out those trees which ARE NOT visible (i.e. same size or shorter than trees closer to edge)
function* filterVisibleTrees(data, config) {
  const { showIntermediate } = config
  const allVisibleNodes = []
  for (const colIdx of Array(data.width).keys()) {
    const visibleForward = selectVisible(data.nodes.filter(node => colIdx === node.col))
    const visibleReverse = selectVisible(data.nodes.filter(node => colIdx === node.col).reverse())
    if (showIntermediate) yield { colIdx, visibleForward, visibleReverse }
    allVisibleNodes.push(...visibleForward, ...visibleReverse)
  }
  for (const rowIdx of Array(data.height).keys()) {
    const visibleForward = selectVisible(data.nodes.filter(node => rowIdx === node.row))
    const visibleReverse = selectVisible(data.nodes.filter(node => rowIdx === node.row).reverse())
    if (showIntermediate) yield { rowIdx, visibleForward, visibleReverse }
    allVisibleNodes.push(...visibleForward, ...visibleReverse)
  }
  if (showIntermediate) yield { allVisibleNodes }
  yield data.nodes.filter(node => allVisibleNodes.includes(node))
}

// Given a node and an array, find the number of trees viewable from that node
function viewDistance(node, array) {
  // Remove nodes "behind you"
  const viewedNodes = array.slice(array.indexOf(node) + 1)
  const viewingDistance = viewedNodes.reduce((acc, el) => {
    if (acc.stop) return { stop: true, distance: acc.distance }
    if (el.value >= node.value) return { stop: true, distance: acc.distance + 1 }
    return { stop: false, distance: acc.distance + 1 }
  }, { stop: false, distance: 0 }).distance
  return viewingDistance
}

function* calculateScenicScores(data, config) {
  const { showIntermediate, heightThreshold } = config
  const scenicScores = []
  for (const node of data.nodes.filter(el => el.value >= heightThreshold)) {
    // Ignore nodes on the edges, scenicScore 0
    if (node.col === 0 || node.col === data.width - 1 || node.row === 0 || node.row === data.height - 1) continue
    const viewUp  = viewDistance(node, data.nodes.filter(el => node.col === el.col).reverse())
    const viewDown  = viewDistance(node, data.nodes.filter(el => node.col === el.col))
    const viewRight = viewDistance(node, data.nodes.filter(el => node.row === el.row))
    const viewLeft  = viewDistance(node, data.nodes.filter(el => node.row === el.row).reverse())
    const scenicScore = viewUp * viewDown * viewRight * viewLeft
    scenicScores.push({ scenicScore, viewUp, viewDown, viewRight, viewLeft, ...node })
  }
  yield scenicScores
}

/* Given a grid of integers:
 *   a a a a a
 *   a a a a a
 *   a a a a a
 *   a a a a a
 *   a a a a a
 * Yields a list of nodes: [{ row: 1, col: 1, value: a }, ...]
 */
function interpret(input) {
  const nodes = []
  let height, width
  let row = 0
  for (const line of input) {
    const trees = line.split('').map(el => parseInt(el)).map((el, idx) => ({ row, col: idx, value: el }))
    width = trees.length
    nodes.push(...trees)
    height = ++row
  }
  return { nodes, height, width }
}

export default function* pickPart(input, config) {
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
    // Find number of trees visible from outside the grid
    for (const output of filterVisibleTrees(data, config)) {
      result = output
      yield inspect(result)
    }
    yield inspect({ totalVisible: result.length })
  } else {
    // Find the tree with the best view
    config.heightThreshold = 5
    for (const output of calculateScenicScores(data, config)) {
      result = output
      yield inspect(result)
    }
    const bestView = result.sort((a, b) => b.scenicScore - a.scenicScore)[0]
    yield inspect({ bestView })
  }
}
