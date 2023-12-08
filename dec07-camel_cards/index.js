import { strict as assert } from 'assert'
import { inspect } from 'util'

const cards = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const allTypes = ['five-of-a-kind', 'four-of-a-kind', 'full-house', 'three-of-a-kind', 'two-pair', 'one-pair', 'high-card']
const byCard = (a, b) => cards.indexOf(a) - cards.indexOf(b)
const byHand = (a, b) => a.split('').reduce((res, char, idx) => res || byCard(char, b[idx]), 0)
const byType = (a, b) => allTypes.indexOf(a) - allTypes.indexOf(b)
// for hand objects only; reverse sort to easily give ranks
const byStrength = (a, b) => byType(b.type, a.type) || byHand(b.hand, a.hand)
const analyzeType = (frequencies) => {
  if (frequencies.includes(5)) return allTypes[0]
  if (frequencies.includes(4)) return allTypes[1]
  if (frequencies.includes(3)) return (frequencies.includes(2)) ? allTypes[2] : allTypes[3]
  const pairs = frequencies.filter(el => el === 2)
  return (pairs.length === 2) ? allTypes[4] : (pairs.length === 1) ? allTypes[5] : allTypes[6]
}
const useJoker = () => cards.splice(3, 1) && cards.push('J')
/* depending on number of J (joker), a new hand may result.  NOTE:
 *  - J may have originally counted in the hand
 *  - can't have more J than original type
 *  - eliminate impossible counts of J
 *  - 0 J ==> same hand
 */
const modifyType = {
  'five-of-a-kind': ['five-of-a-kind', '_', '_', '_', '_', 'five-of-a-kind'], // 0 or 5
  'four-of-a-kind': ['four-of-a-kind', 'five-of-a-kind', '_', '_', 'five-of-a-kind'], // 0, 1, or 4
  'full-house': ['full-house', '_', 'five-of-a-kind', 'five-of-a-kind'], // 0, 2, or 3
  'three-of-a-kind': ['three-of-a-kind', 'four-of-a-kind', '_', 'four-of-a-kind'], // 0, 1, or 3
  'two-pair': ['two-pair', 'full-house', 'four-of-a-kind'], // 0, 1, or 2
  'one-pair': ['one-pair', 'three-of-a-kind', 'three-of-a-kind'], // 0, 1, or 2
  'high-card': ['high-card', 'one-pair'], // 0 or 1
}

/* Given an array of input: ['', ...]
 */
function* rankHands(hands, config) {
  const { showIntermediate, withJokers } = config
  if (withJokers) {
    useJoker()
    hands.forEach(el => {
      const numJokers = el.hand.split('').filter(card => card === 'J').length
      el.type = modifyType[el.type][numJokers]
    })
    if (showIntermediate) yield { cards, types: hands.map(el => `${el.hand} --> ${el.type}`) }
  }
  hands.sort(byStrength).unshift({ hand: 'fake', bid: 0, type: 'high-card' })
  yield hands.map((el, rank) => ({ ...el, rank }))
}

/* Given an array of input: ['', ...]
 */
function interpret(input) {
  const hands = []
  for (const line of input) {
    const { hand, bid } = /^(?<hand>[2-9AKQJT]+)\s+(?<bid>\d+)$/.exec(line).groups
    const values = hand.split('')
    const frequencies = cards.map(el => values.filter(val => val === el).length)
    const type = analyzeType(frequencies)
    hands.push({ hand, bid: parseInt(bid), type })
  }
  return hands
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
  if (config.part === 2) config.withJokers = true
  for (const output of rankHands(data, config)) yield inspect(output), result = output
  const winnings = result.reduce((acc, hand) => acc + hand.bid * hand.rank, 0)
  yield inspect({ winnings })
}
