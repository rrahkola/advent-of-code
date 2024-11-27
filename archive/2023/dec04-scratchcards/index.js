import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Given an indexed object of cards: { 1: { numWinning: [...], numYouhave: [...] }, ... },
 * yields the simplified score:
 *   0 matches = 0, 1 match = 1, 2 matches = 2, 3 matches = 4, etc.
 * for all cards
 */
function* simpleScore(cards) {
  const scores = []
  for (const { numWinning, numYouhave } of Object.values(cards)) {
    const yourWinning = numWinning.filter(num => numYouhave.includes(num))
    const score = (yourWinning.length > 0) ? 2**(yourWinning.length - 1) : 0
    scores.push(score)
  }
  yield scores
}

/* Given an indexed object of cards: { 1: { count: 1, numWinning: [...], numYouhave: [...] }, ... },
 * yields the same index with an updated count of cards.
 */
function* countCards(cards, config) {
  const { showIntermediate } = config
  const scores = []
  const cardValues = Object.values(cards)
  const makeCopies = (card, idx) => {
    const yourWinning = card.numWinning.filter(num => card.numYouhave.includes(num))
    if (showIntermediate) console.log({ count: card.count, yourWinning })
    cardValues.slice(idx+1, idx+1+yourWinning.length).forEach(next => next.count += card.count)
  }
  cardValues.forEach(makeCopies)
  yield cards
}

/* Given an array of input: ['', ...]
 */
function interpret(input) {
  const cards = {}
  for (const line of input) {
    const [card, winning, youhave] = line.split(/:|\|/)
    const { id } = /Card\s+(?<id>\d+)/.exec(card).groups
    const numWinning = winning.match(/\d+/g).map(num => parseInt(num))
    const numYouhave = youhave.match(/\d+/g).map(num => parseInt(num))
    cards[parseInt(id)] = { count: 1, numWinning, numYouhave }
  }
  return cards
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
    for (const output of simpleScore(data, config)) yield inspect(output), result = output
    const sumScores = result.reduce((acc, score) => acc + score, 0)
    yield inspect({ sumScores })
  } else {
    // Find answer for part 2
    for (const output of countCards(data, config)) yield inspect(output), result = output
    const sumCards = Object.values(result).reduce((acc, { count }) => acc + count, 0)
    yield inspect({ sumCards })
  }
}
