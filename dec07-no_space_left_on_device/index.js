import { strict as assert } from 'assert'
import { inspect } from 'util'

// Given data = { pwd, dirs, files }, yields { dirSizes }, total sizes of each dir
function* findDirSizes(data, config) {
  const { showIntermediate } = config
  const dirSizes = {}
  for (const dirPath of data.dirs) {
    const matchingFiles = data.files.filter(file => file[0].startsWith(dirPath))
    if (showIntermediate) yield { dirPath, matchingFiles }
    const totalSize = matchingFiles.reduce((acc, file) => acc + file[1], 0)
    dirSizes[dirPath] = totalSize
  }
  yield dirSizes
}

/* Given terminal commands and output, yield:
 * {
 *   pwd: 'a/b/e',
 *   dirs: ['/', '/a/', '/a/b/', '/a/b/e/'],
 *   files: { '/b.txt': 123, '/a/b/d.lst': 456, '/a/b/e/h.ext': 789 }
 * }
 * NOTE: files use full pathnames
 */
function parseTerminal(input) {
  let pwd = '' // top-level (/)
  const dirs = { '/': true }
  const files = {}
  const subdirRegex = /^\$ cd ([^/.]+)/
  const fileRegex = /^(?<size>\d+) (?<filename>.+)$/

  // no need to match '$ ls' or 'dir <name>'
  for (const line of input) {
    const subdir = line.match(subdirRegex)
    const fileExists = line.match(fileRegex)
    if (line === '$ cd /') {
      pwd = ''
    }
    if (line === '$ cd ..') {             // '/a/b/e' => '/a/b'
      pwd = pwd.slice(0, pwd.lastIndexOf('/'))
    }
    if (subdir) {                       // '/a/b' => '/a/b/e'
      pwd = `${pwd}/${subdir[1]}`
      dirs[pwd] = true
    }
    if (fileExists) {
      files[`${pwd}/${fileExists.groups.filename}`] = parseInt(fileExists.groups.size)
    }
  }
  // ['', '/a', '/a/b/e'] => ['/', '/a/', '/a/b/e/']
  const dirPaths = Object.keys(dirs).map(dir => dir.endsWith('/') ? dir : `${dir}/`)
  return { pwd, dirs: dirPaths, files: Object.entries(files) }
}

export default function* pickPart(input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  Object.assign(config, {
    smallSizeThreshold: 100000,
    maxUsedSpace: 70000000 - 30000000
  })
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  const data = parseTerminal(input)
  if (config.showIntermediate) yield inspect(data)
  let result
  for (const output of findDirSizes(data, config)) {
    yield inspect(output)
    result = output
  }
  if (part === 1) {
    // Find sum of sizes of directories with totalSize < smallSizeThresholds
    const smallDirs = Object.entries(result).filter(el => el[1] < config.smallSizeThreshold)
    yield smallDirs.reduce((acc, entry) => acc + entry[1], 0)
  } else {
    // Find the smallest directory, which if deleted, brings used space < maxUsedSpace
    const sizeToDelete = result['/'] - config.maxUsedSpace
    const deletableDirs = Object.entries(result).filter(el => el[1] > sizeToDelete)
    deletableDirs.sort((el1, el2) => el1[1] - el2[1])
    yield inspect({ totalUsedSpace: result['/'], sizeToDelete, deletableDirs })
    yield deletableDirs[0]
  }
}
