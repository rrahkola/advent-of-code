import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Given array of strings and idx > symmetry line, return
 *   [back, forward, trimmed]
 * where:
 *  - back is mirror image previous to symmetry line
 *  - forward is after symmetry line
 *  - trimmed is the portion left outside after folding
 */
function foldAtIdx(arr, idx) {
  const folded = Math.min(idx, arr.length - idx)
  const [minIdx, maxIdx] = new Array(idx - folded, idx + folded)
  const back = arr.slice(minIdx, idx).reverse()
  const forward = arr.slice(idx, maxIdx)
  const trimmed = (minIdx === 0) ? arr.slice(maxIdx) : arr.slice(0, minIdx)
  return [back, forward, trimmed]
}

// Given a pair of arrays (simulating a fold), counts the number of non-symmetries
function countAsymmetric(forward, back) {
  return back.reduce((acc, line, row) => acc + line.split('').reduce((acc2, char, col) => acc2 + (char !== forward[row][col]), 0), 0)
}

/* Given an array of boards w/ symmetry: [{ rows, cols, width, height, origSym }, ...],
 * finds a "smudge" which, if flipped, adds additional symmetry line.
 * returns the updated symmetry line
 */
function* findSymmetries(data, config) {
  const { showIntermediate, maxAssymetries = 0 } = config
  const symmetry = []
  for (const { asRows, asCols, width, height } of data) {
    const rows = height
      .slice(1)
      .map(i => ({ row: i, diffs: countAsymmetric(...foldAtIdx(asRows, i)) }))
      .filter(el => el.diffs === maxAssymetries)
    const row = (rows.length === 0) ? 0 : rows[0].row
    const cols = width
      .slice(1)
      .map(i => ({ col: i, diffs: countAsymmetric(...foldAtIdx(asCols, i)) }))
      .filter(el => el.diffs === maxAssymetries)
    const col = (cols.length === 0) ? 0 : cols[0].col
    if (showIntermediate) yield { row, col }
    symmetry.push({ row, col })
  }
  yield symmetry

}

/* Given file contents separated by empty lines,
 * yield 'boards', arrays of strings arranged horizontally (& vertically):
 *    [{ rows, cols, width, height }, ...]
 */
function interpret(input) {
  const boards = input.split('\n\n').map(board => {
    const asRows = board.split('\n').map(el => el.trim()).filter(Boolean)
    const height = new Array(asRows.length).fill(0).map((_, idx) => idx)
    const width = new Array(asRows[0].length).fill(0).map((_, idx) => idx)
    const asCols = new Array(width.length).fill(0).map((_,i) => asRows.map(str => str[i]).join(''))
    return { asRows, asCols, height, width }
  })
  return boards
}

export default function* pickPart(input, config) {
  let result
  assert(
    typeof input === 'string' || input instanceof String,
    'Must provide input as raw, use options "-t raw"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 2) config.maxAssymetries = 1
  for (const output of findSymmetries(data, config)) yield inspect(output, { depth: 4 }), result = output
  const sumSymmetry = result.reduce((acc, sym) => acc + 100 * sym.row + sym.col, 0)
  yield inspect({ sumSymmetry })
}
