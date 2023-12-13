import { strict as assert } from 'assert'
import { inspect } from 'util'

// General memoizing function, with .cache property for inspection
function memoize(fn) {
  const cache = {}
  function memo(...args) {
    // const key = JSON.stringify(args) // more adaptable
    const key = args.join(' ') // better for this case
    if (cache[key] !== undefined) return cache[key]
    const result = fn(...args)
    cache[key] = result
    return result
  }
  memo.cache = cache
  return memo
}

/* Given an array of spring condition statements:
 *   [{ groups, condition, unknown }, ...]
 * attempts combinations of '.' and '#' for each idx of unknown,
 * replacing the elements in condition and testing for a match
 * with the damaged groups.
*/
function* walkPermutations(data, config) {
  const { showIntermediate } = config
  const results = []
  const collectPerms = length => new Array(2**length)
    .fill(0).map((_,i) => Number(i).toString(2).padStart(length, '0'))
    .map(str => str.replaceAll('0', '.').replaceAll('1', '#'))

  for (const { groups, condition, unknown } of data) {
    const arrangements = []
    const test = condition.split('')
    const groupStr = groups.join(',')
    const perms = collectPerms(unknown.length)
    for (const perm of perms) {
      unknown.forEach((tIdx, pIdx) => test[tIdx] = perm[pIdx])
      // console.log('condition:', condition.join(''), 'test:', test.join(''))
      const compare = (test.join('').match(/(#+)/g) || []).map(str => str.length).join(',')
      if (compare === groupStr) arrangements.push(test.join(''))
    }
    if (showIntermediate) yield { groups, condition, arrangements }
    results.push({ groups, condition, arrangements: arrangements.length })
    // break
  }
  yield results
}

/* General rules:
 *  - line needs to be at least as long as can fit the remaining groups, with 1 space '.' between
 *  - lines starting with '#' must fit the next group followed by '.'
 *  - lines starting with '.' can be ignored
 *  - lines starting with '?' should sum counts by replacing '?' with '.' and '#'
 *  - if groups run out and '#' exists in the line, return 0
 */
const countPerms = memoize((line, groups) => {
  if (line.length === 0) return (groups.length === 0) ? 1 : 0
  if (groups.length === 0) return (/#/.exec(line)) ? 0 : 1
  const minLengthNeeded = groups.reduce((acc, num) => acc + num, groups.length - 1)
  if (line.length < minLengthNeeded) return 0
  switch(line[0]) {
    case '.':
      return countPerms(line.slice(1), groups)
    case '#':
      const [next, ...remaining] = groups
      const substr = line.slice(0, next)
      return (/\./.exec(substr)) ? 0 : (/#/.exec(line[next])) ? 0 : countPerms(line.slice(next+1), remaining)
    case '?':
      const [first, second] = ['.', '#'].map(char => `${char}${line.slice(1)}`)
      return countPerms(first, groups) + countPerms(second, groups)
  }
})

/* Given an array of spring condition statements:
 *   [{ groups, condition, unknown }, ...]
 * uses recursion (w/ memoization) to identify counts of permutations.
 */
function* skipPermutations(data, config) {
  const { showIntermediate } = config
  const results = []
  for (const { condition, groups } of data) {
    const arrangements = countPerms(condition, groups)
    if (showIntermediate) yield { groups, condition, arrangements }
    results.push({ condition, groups, arrangements })
    // console.log(countPerms.cache)
    // break
  }
  yield results
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
    const [condition, groupStr] = line.split(' ')
    const groups = groupStr.split(',').map(num => parseInt(num))
    const unknown = []
    for (const match of condition.matchAll(/(\?)/g)) unknown.push(match.index)
    statements.push({ groups, condition, unknown })
  }
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
  // const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of walkPermutations(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    for (const output of skipPermutations(data, config)) yield inspect(output), result = output
  }
  const sumPerms = result.reduce((acc, perm) => acc + perm.arrangements, 0)
  yield inspect({ sumPerms })
}
