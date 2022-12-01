#!/usr/bin/env node
import { strict as assert } from 'assert'
import fs from 'fs/promises'
import path from 'path'
import devNull from 'dev-null'
import meow from 'meow'
import pino from 'pino'

const cli = meow(
  `
    Usage
      $ npx aoc-2022 -t lines -t integer --day dec01 -i input.txt

    Runs a piece of advent-of-code programming.

    Options            Default
      --day            <current_date>           Runs the code in the directory matching prefix
      --part           1                        Picks the path for the program (1 or 2)
      --input -i       example.txt              Relative filepath to be used as input
      --transform      lines                    Transforms the input into data for the program (see below)
      --verbose -v                              When present, write out intermediate result files
      --debug                                   More verbose output

    Transforms
      Input always comes in as a single string, including newline characters.
      To convert into data appropriate to the program, apply transforms in the correct order.
      If the order is unknown, just try the program w/o any options and check for errors.
      Usually, the program will be able to tell if the input data matches what is expected.
      The following transforms are available:
        raw            Perform no transforms at all
        lines          Split the text lines into an array of strings
        arrays         Split the text lines into an array of arrays, chunking by empty lines
        integer        Parse each line (or array of lines) as an integer (or array of integers)
`,
  {
    flags: {
      day: {
        type: 'string',
        default: ''
      },
      part: {
        type: 'number',
        default: 1
      },
      input: {
        type: 'string',
        alias: 'i',
        default: 'example.txt'
      },
      verbose: {
        type: 'boolean',
        alias: 'v',
        default: false
      },
      transform: {
        type: 'string',
        alias: 't',
        isMultiple: true,
        default: ['lines']
      },
      debug: {
        type: 'boolean',
        default: false
      }
    },
    importMeta: import.meta
  }
)

const now = new Date()
const logger = pino({ level: 'trace' },
  pino.multistream([
    { level: 'trace', stream: cli.flags.debug ? process.stdout : devNull() },
    { level: 'warn', stream: process.stderr }
  ])
)
logger.debug('Using debug mode')

const config = {
  execute: {
    prefix: cli.flags.day || `dec${now.getDate().toString().padStart(2, '0')}`,
    input: cli.flags.input,
    output: (result) => `answer-${result}.txt`
  },
  transform: cli.flags.transform,
  program: {
    part: cli.flags.part,
    showIntermediate: cli.flags.debug || cli.flags.verbose
  }
}

// Finds the directory with the given prefix, or errors if duplicates are found
export async function findDirWithPrefix(prefix) {
  const __dirname = new URL('.', import.meta.url).pathname
  const entries = await fs.readdir(__dirname)
  const rootPaths = []
  for (const entry of entries) {
    if (entry.startsWith(prefix)) {
      const rootPath = path.join(__dirname, entry)
      const stat = await fs.stat(rootPath)
      if (stat.isDirectory()) rootPaths.push(rootPath)
    }
  }
  assert(rootPaths.length === 1, `Unable to find a single directory with prefix ${prefix}`)
  return rootPaths[0]
}

// Transforms the input via the params in the given transformString
export function transformInput(input, transforms) {
  let result = input || ''
  for (const transform of transforms) {
    // convert to array of arrays when input is separated by newline
    if (transform === 'arrays') {
      const trimmed = result.split('\n').map(el => el.trim())
      const emptyIdx = trimmed.reduce((acc, el, idx) => Boolean(el) ? acc : acc.concat([idx]), [])
      result = []
      for (let i = 0; i < emptyIdx.length; i++) {
        result.push(trimmed.slice(emptyIdx[i - 1], emptyIdx[i]).filter(Boolean))
      }
    }
    // convert to array, removing empty lines
    if (transform === 'lines') result = result.split('\n').map(el => el.trim()).filter(Boolean)
    // convert to integers
    if (transform === 'integer' || transform === 'integers') {
      result = result.map(el => Array.isArray(el) ? el.map(self => parseInt(self)) : parseInt(el))
    }
    // leave as raw data
    if (transform === 'raw') result = result
  }
  return result
}

/**
 * Advent-of-Code runner
 *  - loads the specified program
 *  - loads the input, transforming to an array
 *  - loads any external configuration file
 *  - saves all results to files
 *  - echoes the final result to stdout
 */
async function main(config, logger) {
  const { execute, transform, program: programConfig } = config
  logger.debug({ config }, 'using config')

  const rootPath = await findDirWithPrefix(execute.prefix)
  logger.debug({ rootPath }, `found directory with prefix ${execute.prefix}`)
  const program = await import(path.join(rootPath, 'index.js'))
  const input = await fs.readFile(path.join(rootPath, execute.input), 'utf8')
  logger.debug({ input, transform }, 'transforming input')
  const data = transformInput(input, transform)
  logger.debug({ data, programConfig }, 'executing program')

  let i = 0
  let result = ''
  for await (const output of program.default(data, programConfig)) {
    result = output
    const outputPath = path.join(rootPath, execute.output(i++))
    logger.debug({ outputPath, output }, 'writing output')
    await fs.writeFile(outputPath, output.toString())
  }

  console.log(result)
}

main(config, logger)
  .then(result => logger.error({ result }, 'Finished MAIN'))
  .catch(err => {
    if (err.response && err.response.body) {
      logger.error(err.response.body)
    } else {
      logger.error(err)
    }
    process.exit(1)
  })
