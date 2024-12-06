import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null

/* given a set of rules, returns the list if it is ordered, otherwise null */
const checkOrdering = rules => pageList => {
  return pageList.reduce((acc, page, idx) => {
    if (!acc) return acc
    const { before = [], after = [] } = rules[page] || {}
    if (before.some(p => pageList.slice(0, idx).includes(p))) return false
    if (after.some(p => pageList.slice(idx + 1).includes(p))) return false
    // console.log({ idx, page, before, after, pageList })
    return true
  }, true)
}

/*  Given rules and array of page-lists,
 *  yields the page-lists which are correctly ordered,
 *  then yields the middle page for each list.
 */
function* binPageLists({ rules, pages }, config) {
  const { showIntermediate } = config
  const check = checkOrdering(rules)
  const ordered = [], unordered = []
  pages.forEach(pageList => {
    const isOrdered = check(pageList)
    const latest = (isOrdered) ? ordered.push(pageList) : unordered.push(pageList)
    if (showIntermediate) console.log({ isOrdered, pageList })
  })
  yield { ordered, unordered }
}

const sortPages = (rules) => (a, b) => (rules[a].before.includes(b) ? -1 : 1)
/*  Given rules and an array of unordered page-lists,
 *  re-orders the lists and yields them.
 */
function* orderLists({ rules, unordered }, config) {
  const sorter = sortPages(rules)
  const reordered = []
  unordered.forEach(pageList => {
    const ordered = pageList.slice().sort(sorter)
    reordered.push(ordered)
  })
  yield { reordered }
}

/* Update a rule with a new entry */
function updateRule(rules, key, { before = [], after = [] }) {
  const { before: oldBefore = [], after: oldAfter = [] } = rules[key] || {}
  rules[key] = {
    before: [...oldBefore, ...before],
    after: [...oldAfter, ...after],
  }
}

/*  Given an array of input: ['47|53', '75,47,61,53,29', ...],
 *  yields a map of rules and a list of pages
 */
function interpret(input) {
  const rules = {}
  const pages = []
  const ruleRegex = /^(?<first>\d+)\|(?<second>\d+)$/
  for (const line of input) {
    const ruleMatch = line.match(ruleRegex)
    if (ruleMatch) {
      // console.log({ msg: 'Found a rule!', line })
      let { first, second } = ruleMatch.groups
      first = Number.parseInt(first, 10)
      second = Number.parseInt(second, 10)
      updateRule(rules, first, { before: [second] })
      updateRule(rules, second, { after: [first] })
      continue
    }
    // If not a rule, then it's a page
    // console.log({ msg: 'Found a page!', line })
    pages.push(line.split(',').map(el => Number.parseInt(el, 0)))
  }
  return { rules, pages }
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
  for (const output of binPageLists(data, config)) yield inspect(output), result = output
  const sumMiddle = (pages) => pages.reduce((acc, pageList) => acc + pageList[Math.floor(pageList.length / 2)], 0)
  if (config.part === 1) {
    // Find answer for part 1
    yield `Sum of already-ordered middle pages: ${sumMiddle(result.ordered)}`
  } else {
    // Find answer for part 2
    for (const output of orderLists({ ...data, ...result }, config)) yield inspect(output), result = output
    yield `Sum of newly-ordered middle pages: ${sumMiddle(result.reordered)}`
  }
}
