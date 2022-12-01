import isEqual from 'lodash/isEqual.js'

const normalizeDigitStr = digitStr =>
  digitStr
    .trim()
    .split('')
    .sort()
    .join('')

const translateDigitStr = mapping => digitStr =>
  digitStr
    .split('')
    .map(char => 'abcdefg'[mapping.indexOf(char)])
    .sort()
    .join('')

export default class SevenSegment {
  static allMappings = []

  constructor (input) {
    this.training = input.training
    this.readout = input.readout
    if (SevenSegment.allMappings.length === 0)
      permutation(SevenSegment.allMappings, 'abcdefg'.split(''), 7)
  }

  // NOTE: frequency count: { a: 8, b: 6, c: 8, d: 7, e: 4, f: 9, g: 7 }
  static properSegments = [
    'abcefg', // '0'
    'cf', // '1'
    'acdeg', // '2'
    'acdfg', // '3'
    'bcdf', // '4'
    'abdfg', // '5'
    'abdefg', // '6'
    'acf', // '7'
    'abcdefg', // '8'
    'abcdfg' // '9'
  ]

  static parseLine (line) {
    const [trainingStr, readoutStr] = line.split('|')
    const training = trainingStr
      .split(/\s+/)
      .filter((el = '') => Boolean(el.trim()))
      // .map(normalizeDigitStr)
      .sort((el1, el2) => el1.length - el2.length || el1.localeCompare(el2))
    const readout = readoutStr
      .split(/\s+/)
      .filter((el = '') => Boolean(el.trim()))
      // .map(normalizeDigitStr)
    return new SevenSegment({ training, readout })
  }

  train () {
    if (this.trained) return
    this.mapSegments = () => 'cf'
    // this.trainByBruteForce()
    this.trainByAnalytics()
    this.trained = true
  }

  trainByAnalytics () {
    const { training } = this
    const mapping = []
    const frequencies = Object.entries(
      'abcdefg'.split('').reduce(
        (obj, key) => ({
          ...obj,
          [key]: training
            .flatMap(str => str.split(''))
            .filter(char => char === key).length
        }),
        {}
      )
    )
    const notIn = (large, small) =>
      large.filter(char => small.indexOf(char) === -1)
    const four = training.find(str => str.length === 4).split('')
    const seven = training.find(str => str.length === 3).split('')
    const one = training.find(str => str.length === 2).split('')
    const bd = notIn(four, one) // ['b','d']
    mapping[0] = notIn(seven, one)[0] // 'a'
    mapping[1] = frequencies.find(([key, count]) => count === 6)[0] // 'b'
    mapping[2] = frequencies.find(
      ([key, count]) => count === 8 && key != mapping[0]
    )[0] // 'c'
    mapping[3] = frequencies.find(
      ([key, count]) => count === 7 && bd.includes(key)
    )[0] // 'd'
    mapping[4] = frequencies.find(([key, count]) => count === 4)[0] // 'e'
    mapping[5] = frequencies.find(([key, count]) => count === 9)[0] // 'f'
    mapping[6] = frequencies.find(
      ([key, count]) => count === 7 && key != mapping[3]
    )[0] // 'g'
    this.mapSegments = translateDigitStr(mapping.join(''))
  }

  trainByBruteForce () {
    const { training } = this
    const sortedProperSegments = [...SevenSegment.properSegments].sort()
    // brute force method-- it might be faster to attack directly
    for (const mapping of SevenSegment.allMappings) {
      const mapSegments = translateDigitStr(mapping)
      const converted = training.map(mapSegments).sort()
      if (isEqual(converted, sortedProperSegments)) {
        this.mapSegments = mapSegments
        break
      }
    }
  }

  convertReadout () {
    this.train()
    const display = []
    for (const digitStr of this.readout) {
      const translatedStr = this.mapSegments(digitStr)
      const digit = SevenSegment.properSegments.indexOf(translatedStr)
      // console.log({ digitStr, translatedStr, digit }, 'found digit')
      display.push(digit)
    }
    // console.log(`Reading display: ${display.join('')}`)
    return parseInt(display.join(''))
  }
}

// cf. https://stackoverflow.com/questions/66108781/finding-all-permutations-of-array-elements-as-concatenated-strings
export function permutation (result, arr, currentSize) {
  if (currentSize == 1) {
    // recursion base-case (end)
    result.push(arr.join(''))
    return result
  }

  for (let i = 0; i < currentSize; i++) {
    permutation(result, arr, currentSize - 1)
    if (currentSize % 2 == 1) {
      let temp = arr[0]
      arr[0] = arr[currentSize - 1]
      arr[currentSize - 1] = temp
    } else {
      let temp = arr[i]
      arr[i] = arr[currentSize - 1]
      arr[currentSize - 1] = temp
    }
  }
}
