import { strict as assert } from 'assert'
import { inspect } from 'util'

function collectPerms (length, constraint = null) {
  let perms = []
  if (!constraint) {
    perms = new Array(2**length).fill(0).map((_, i) => Number(i).toString(2).padStart(length, '0'))
  }
  return perms.map(str => str.replaceAll('0', '.').replaceAll('1', '#'))
}

/* Some hints at limiting permutations:
 *  - valid perms have (totalBroken - knownBroken) '#'s
 *  - valid perms have at least (groups.length - knownBroken) groups separated by '.'
 *  - need to accomodate '?#?' strings
 *  - known groups like '?###' have to match groups >= 3
 */
function limitPerms(config) {
  return true
}

/* Given an array of spring condition statements:
 *   [{ groups, condition, unknown }, ...]
 * attempts combinations of '.' and '#' for each idx of unknown,
 * replacing the elements in condition and testing for a match
 * with the damaged groups.
 */
function* walkPermutations(data, config) {
  const { showIntermediate, constraint } = config
  const perms = []
  for (const { groups, condition, unknown } of data) {
    const arrangements = []
    const test = [...condition]
    const perms = collectPerms(unknown.length, constraint)
    for (const perm of perms) {
      unknown.forEach((tIdx, pIdx) => test[tIdx] = perm[pIdx])
      // console.log('condition:', condition.join(''), 'test:', test.join(''))
      const compare = (test.join('').match(/(#+)/g) || []).map(str => str.length).join(',')
      if (compare === groups) arrangements.push(test.join(''))
    }
    if (showIntermediate) yield { groups, condition: condition.join(''), arrangements }
    perms.push({ condition, arrangements: arrangements.length })
    // break
  }
  yield perms
}

/* Given an array of input: ['???.### 1,1,3', ...],
 * yields an array of spring condition statements:
 *   [{ groups, condition, unknown }, ...]
 * where:
 *  - groups: '1,1,3'
 *  - condition: ['?', '?', '?', '.', '#', '#', '#']
 *  - unknown: [0, 1, 2]
 */
function interpret(input) {
  const statements = []
  for (const line of input) {
    const [condStr, groups] = line.split(' ')
    const condition = condStr.split('')
    const unknown = condition.reduce((arr, char, idx) => (char === '?') ? arr.concat(idx) : arr, [])
    const totalBroken = groups.split(',').reduce((acc, num) => acc + parseInt(num), 0)
    const knownBroken = condition.filter(char => char === '#').length
    statements.push({ groups, condition, unknown, totalBroken, knownBroken })
  }
  console.log('most ?:', Math.max(...statements.map(el => el.unknown.length)))
  console.log('most possibleBroken:', Math.max(...statements.map(el => el.totalBroken - el.knownBroken)))
  return statements
}

/* Given an array of input: ['???.### 1,1,3', ...],
 * duplicates the condition statement <copies> times, e.g.
 *   ['???.###????.### 1,1,3,1,1,3', ...]
 */
function modify(input, { copies }) {
  return input.map(line => {
    const [condStr, groups] = line.split(' ')
    const newCond = new Array(copies).fill(condStr).join('?')
    const newGroups = new Array(copies).fill(groups).join(',')
    return [newCond, newGroups].join(' ')
  })
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = (config.part === 1) ? interpret(input) : interpret(modify(input, { copies: 5 }))
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of walkPermutations(data, config)) yield inspect(output), result = output
    const sumPerms = result.reduce((acc, perm) => acc + perm.arrangements, 0)
    yield inspect({ sumPerms })
  } else {
    // Find answer for part 2
    config.constraint = limitPerms(config)
    for (const output of walkPermutations(data, config)) yield inspect(output), result = output
  }
}
