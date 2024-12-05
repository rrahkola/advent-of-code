import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null

const word = 'XMAS'
// 3x3=9-char arrays for X-MAS
const masKs = ['M.S.A.M.S', 'M.M.A.S.S', 'S.S.A.M.M', 'S.M.A.S.M']

const mv = {
  'lu': ({ row, col }) => ({ row: row - 1, col: col - 1 }),
  'up': ({ row, col }) => ({ row: row - 1, col }),
  'ru': ({ row, col }) => ({ row: row - 1, col: col + 1 }),
  'lt': ({ row, col }) => ({ row, col: col - 1 }),
  'rt': ({ row, col }) => ({ row, col: col + 1 }),
  'ld': ({ row, col }) => ({ row: row + 1, col: col - 1 }),
  'dn': ({ row, col }) => ({ row: row + 1, col }),
  'rd': ({ row, col }) => ({ row: row + 1, col: col + 1 }),
}
const dirs = Object.keys(mv)

/* checks for word in search puzzle */
const checkWord = (search) => ({ row, col, dir }) => {
  let pos = { row, col }
  for (let i = 1; i < word.length; i++) {
    pos = mv[dir](pos)
    const char = search[pos.row]?.[pos.col]
    // console.log({ msg: 'mv', pos, dir, i, char, expected: word[i] })
    if (char !== word[i]) return []
  }
  return { row, col, dir, word: word }
}

/* constructs a string of characters around 'A', compares with acceptable masks */
const checkMask = (search) => ({ row, col, dir }) => {
  // Expect to be called for all dirs, only return for 'up'
  if (dir !== 'up') return []
  // Cannot match portions of X-MAS
  if (row < 1 || col < 1 || row > search.length - 2 || col > search[0].length - 2) return []
  const chars = [
    `${search[row - 1][col - 1]}.${search[row - 1][col + 1]}`,
    `.${search[row][col]}.`,
    `${search[row + 1][col - 1]}.${search[row + 1][col + 1]}`,
  ].join('')
  if (!masKs.includes(chars)) return []
  return { row, col, dir, word: chars }
}


/*  Given search and start,
 *  yields a list of 'XMAS' words found in the search puzzle, as [{ row, col, dir, word }, ...]
 */
function* wordSearch({ start }, config) {
  const { showIntermediate, check } = config
  const result = start.flatMap(pos => dirs.flatMap(dir => {
    if (showIntermediate) console.log({ msg: 'initial_pos', pos, dir})
    return check({ ...pos, dir })
  }))
  yield result
}

/** find all indices of a character in a word, returns a position: { row, col, char } */
const allIndexes = (row) => (char, line) => {
  const result = []
  let col = 0
  while( col !== -1) {
    col = line.indexOf(char, col)
    if (col === -1) break
    result.push({ row, col, char })
    col++
  }
  return result
}

/*  Given an array of input: ['MMMSXXMASM', ...],
 *  yields:
 *    - search -- an array of arrays representing the word search puzzle
 *    - startX  -- a list of { row, col, char } locating 'X' as starting points
 *    - startA  -- a list of { row, col, char } locating 'A' as starting points
 */
function interpret(input) {
  const search = []
  const startX = []
  const startA = []
  let row = 0
  for (const line of input) {
    let col = 0
    search.push(line.split(''))
    startX.push(...allIndexes(row)('X', line))
    startA.push(...allIndexes(row)('A', line))
    row++
  }
  return { search, startX, startA }
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
  if (config.part === 1) {
    // Find answer for part 1
    config.check = checkWord(data.search)
    for (const output of wordSearch({ start: data.startX }, config)) yield inspect(output), result = output
    yield `Found ${result.length} instances of XMAS`
  } else {
    // Find answer for part 2
    config.check = checkMask(data.search)
    for (const output of wordSearch({ start: data.startA }, config)) yield inspect(output), result = output
    yield `Found ${result.length} instances of X-MAS`
  }
}
