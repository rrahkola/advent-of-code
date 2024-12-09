import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null

/*  Given a list of files and available disk positions,
 *  yields an array of contiguous disk positions with according fileIDs.
 *  Method is to pop the last block and insert into the first space available.
 */
function* fillAllGaps({ files, available }, config) {
  const { showIntermediate } = config
  const diskSize = files.slice(-1).map(({ disk }) => disk.slice(-1)[0])[0] + 1
  const defragmented = Array(diskSize)
  let nextSpace = available.shift()
  for (const { id, size, disk } of files.reverse()) {
    if (showIntermediate) console.log({ msg: 'Before defragmentation', id, size, disk, nextSpace })
    while(available.length > 0 && disk[size - 1] > nextSpace) {
      disk.unshift(nextSpace)
      disk.pop()
      nextSpace = available.shift()
    }
    for (const idx of disk) defragmented[idx] = id
    if (showIntermediate) console.log({ msg: 'After defragmentation', id, size, disk, nextSpace })
  }
  yield defragmented
}

// Adjusts the list of spaces when cutting a file
const moveOut = (spaces) => ({ size, disk }) => {
  const gapBefore = spaces.find(({ disk: d }) => d.includes(disk[0] - 1))
  const gapAfter = spaces.find(({ disk: d }) => d.includes(disk[size - 1] + 1))
  if (gapBefore && gapAfter) {
    gapBefore.size += size + gapAfter.size
    gapBefore.disk.push(...disk, ...gapAfter.disk)
    spaces.splice(spaces.indexOf(gapAfter), 1)
  } else if (gapBefore) {
    gapBefore.size += size
    gapBefore.disk.push(...disk)
  } else if (gapAfter) {
    gapAfter.size += size
    gapAfter.disk.unshift(...disk)
  } else {
    spaces.push({ size, disk: [...disk] })
    spaces.sort((a, b) => a.disk[0] - b.disk[0])
  }
}
// Adjusts the list of spaces when pasting a file
const moveIn = (spaces) => ({ size, disk }) => {
  if (disk[0] < spaces[0].disk[0]) return null
  const gap = spaces.find(({ size: s }) => s >= size)
  if (!gap) return null
  gap.size -= size
  disk.splice(0, size)
  disk.unshift(...gap.disk.splice(0, size))
  if (gap.size === 0) spaces.splice(spaces.indexOf(gap), 1)
  return { size, disk }
}

/*  Given a list of files and contiguous spaces,
 *  yields an array of disk positions with according fileIDs.
 *  Method is to move the entire file into the first gap available.
 */
function* fillWithFiles({ files, spaces }, config) {
  const { showIntermediate } = config
  const diskSize = files.slice(-1).map(({ disk }) => disk.slice(-1)[0])[0] + 1
  const defragmented = Array(diskSize)
  const cutFile = moveOut(spaces)
  const pasteFile = moveIn(spaces)
  for (const file of files.reverse()) {
    if (showIntermediate) console.log({ msg: 'Before defragmentation', ...file })
    const gap = spaces.find(({ size }) => size >= file.size)
    if (gap && file.disk[0] > gap.disk[0]) {
      cutFile(file)
      pasteFile(file)
    }
    for (const idx of file.disk) defragmented[idx] = file.id
    if (showIntermediate) console.log({ msg: 'After defragmentation', ...file })
  }
  yield defragmented
}


/*  Given an array of input: ['12345', ...],
 *  yields:
 *    files -- an array of files with IDs and disk positions, e.g. [{ id: 0, size: 1, disk: [0]}, { id: 1, size: 3, disk: [3, 4, 5] }, ...]
 *    space -- an array of the available disk positions, e.g. [1, 2, 6, 7, 8, 9]
 */
function interpret(input) {
  const files = []
  const spaces = []
  const available = []
  let disk = 0
  let isFile = true
  let fileID = 0
  for (const blocks of input[0].split('').map(n => Number.parseInt(n, 0))) {
    if (isFile) {
      const newFile = { id: fileID++, size: blocks, disk: [] }
      Array(blocks).keys().forEach(n => newFile.disk.push(disk++))
      files.push(newFile)
    } else {
      const newSpace = { size: blocks, disk: []}
      Array(blocks).keys().forEach(n => newSpace.disk.push(disk++))
      spaces.push(newSpace)
      available.push(...newSpace.disk)
    }
    isFile = !isFile
  }
  return { files, spaces, available }
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
    for (const output of fillAllGaps(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    for (const output of fillWithFiles(data, config)) yield inspect(output), result = output
  }
  yield `Checksum: ${result.reduce((acc, id, idx) => acc + id * idx, 0)}`
}
