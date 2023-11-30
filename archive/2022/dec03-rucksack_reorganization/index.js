import { strict as assert } from 'assert'
import { inspect } from 'util'

const prioritazation = '0abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Finds the common item in each group (of an array of groups) and translates to a priority; sums
function* sumPrioritization(data, config) {
  // Check the contents of the first group to find the unique matching item
  const { showIntermediate } = config
  const compareContents = data.map(contents => [contents[0].split(''), ...contents.slice(1)])
  if (showIntermediate) yield inspect({ compareContents })
  const matchingItems = compareContents.map(matcher => {
    const contentsOfFirst = matcher[0]
    const compareWith = matcher.slice(1)
    const commonItems = contentsOfFirst.filter(el =>
      compareWith.reduce((isCommon, group) => isCommon && group.includes(el), true)
    )
    assert(commonItems.length > 0, `Found no common items among groups`)
    return commonItems[0]
  })
  if (showIntermediate) yield inspect({ matchingItems })

  const priorities = matchingItems.map(item => prioritazation.indexOf(item))
  if (showIntermediate) yield inspect({ priorities })

  yield priorities.reduce((acc, el) => acc + el, 0)
}

// Split lines into halves, representing two containers
function intoContainers(input) {
  return input.map(rucksack => {
    const dividerIdx = rucksack.length / 2
    return [rucksack.slice(0, dividerIdx), rucksack.slice(dividerIdx)]
  })
}

// Group lines by three, representing elf groups
function intoGroups(input) {
  return input.map((line, idx) => (idx % 3 === 0) ? [line, input[idx + 1], input[idx + 2]] : null).filter(Boolean)
}

export default function* pickPart(input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  if (part === 1) {
    // Find common element for both containers in each rucksack; sum priority
    const data = intoContainers(input)
    if (config.showIntermediate) yield inspect(data)
    for (const result of sumPrioritization(data, config)) yield result
  } else {
    // Find common element among all three elves in a group; sum priority
    const data = intoGroups(input)
    if (config.showIntermediate) yield inspect(data)
    for (const result of sumPrioritization(data, config)) yield result
  }
}
