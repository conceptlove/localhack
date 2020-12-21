# Testing Page

A set of functions for defining tests next to the code they are testing. See the
`test` function.

```mjs
import { strict, AssertionError } from "assert"
import chalk from "chalk"

export const dot = chalk.green("✓")

export const log = x => process.stdout.write(x)
export const eq = (actual, expected, message) => {
  strict.deepEqual(actual, expected, message)
  log(dot)
}

export const throws = (err, fn) => {
  try {
    fn()
  } catch (e) {
    if (!(e instanceof err)) throw e
    log(dot)
  }

  strict.fail(`Expected to throw ${err.name}`)
}
```

```mjs
if (process.env.NODE_ENV === "test") log("\nRunning tests...\n\n")

let previousFilename = ""
```

The function you're most likely here for. Example usage:
`test(someFunction, ({ eq }) => { eq(someFunction(), expectedOutput) })`

```mjs
export function test(subject, fn) {
  if (process.env.NODE_ENV !== "test") return
  const filename = callingFilename()

  if (filename !== previousFilename) {
    console.log("\n" + filename)
    previousFilename = filename
  }

  log(`  ${chalk.yellow(subject.name || subject)}: `)
  try {
    fn({ eq, throws })
    log("\n")
  } catch (err) {
    log(chalk.red("✗"))

    if (err instanceof AssertionError) {
      console.error(chalk.red("\n\nAssertion failed:\n=================\n"))
      console.error(err.message.replace(/(- expected)/, "\n$1"))
      console.error("\nBacktrace:")
      console.error(backtrace(err))
      console.error("")
    } else {
      console.error(chalk.red("\n\nError thrown:\n=============\n"))
      console.error(err)
      console.error("\n\n")
    }
  }
}
```

And we define some helpers for handling stack traces.

```mjs
export const backtrace = err =>
  err.stack
    .split("\n")
    .filter(line => /^\s*at ./.test(line))
    .join("\n")

/**
 * Parses details from the stacktrace of the given error.
 */
export function* stackDetails(err) {
  const matches = err.stack.matchAll(/ +at.*[( ](?:\w+:\/\/)?(.+):(\d+):(\d+)/g)

  for (const [match, path, line, col] of matches) {
    const name = path.replace(/^.*\/(build|src)\//, "")
    yield {
      name,
      path,
      line: Number(line),
      col: Number(col),
    }
  }
}

/**
 * Returns the first filename in the call stack that is not this one.
 */
export function callingFilename() {
  const err = new Error()
  let current
  for (const { name } of stackDetails(err)) {
    current ??= name
    if (name !== current) return name
  }
}
```