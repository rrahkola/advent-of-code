import { strict as assert } from 'assert'
import { inspect } from 'util'

const toBase5 = Object.entries({
  '1=': '03', '2=': '13', '3=': '23', '4=': '33',
  '1-': '04', '2-': '14', '3-': '24', '4-': '34',
  '10=': '043', '20=': '143', '30=': '243', '40=': '343',
  '10-': '044', '20-': '144', '30-': '244', '40-': '344',
  '100=': '0443', '200=': '1443', '300=': '2443', '400=': '3443',
  '100-': '0444', '200-': '1444', '300-': '2444', '400-': '3444',
  '1000=': '04443', '2000=': '14443', '3000=': '24443', '4000=': '34443',
  '1000-': '04444', '2000-': '14444', '3000-': '24444', '4000-': '34444',
  '10000=': '044443', '20000=': '144443', '30000=': '244443', '40000=': '344443',
  '10000-': '044444', '20000-': '144444', '30000-': '244444', '40000-': '344444',
  '100000=': '0444443', '200000=': '1444443', '300000=': '2444443', '400000=': '3444443',
  '100000-': '0444444', '200000-': '1444444', '300000-': '2444444', '400000-': '3444444',
})
const toSnafu = [...toBase5].reverse().map(([sn, b5]) => [b5.split('').reverse().join(''), sn.split('').reverse().join('')])
const snafuToBase5 = (str) => {
  while(/[=-]/.exec(str)) {
    for (const [key, value] of toBase5) str = str.replace(key, value)
  }
  return str
}
const base5ToSnafu = (str) => {
  str = ('0' + str).split('').reverse().join('')
  while(/[34]/.exec(str)) {
    for (const [key, value] of toSnafu) str = str.replace(key, value)
  }
  return str.split('').reverse().join('').replace(/^0?/, '')
}

/* Given an array of input: ['1=-0-2', ...]
 */
function* part1(data, config) {
  const { showIntermediate } = config
  yield 'Howdy'
}

/* Given an array of snafu numbers: ['1=-0-2', ...],
 * converts to both base-5 and base-10 numbers:
 *    [{ snafu: '1=-0-2', base5: '23442', base10: 1747 }, ...]
 */
function interpret(input) {
  return input.map(sn => ({ snafu: sn, base5: snafuToBase5(sn), base10: parseInt(snafuToBase5(sn), 5) }))
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
    const sum = data.reduce((acc, { base10 }) => acc + base10, 0)
    const base5 = Number(sum).toString(5)
    yield inspect({ sum, base5, snafu: base5ToSnafu(base5) })
  } else {
    // Find answer for part 2
    for (const output of part1(data, config)) yield inspect(output), result = output
  }
}
