#!/usr/bin/env node
import chalk from 'chalk'
import Commander from 'commander'
import path from 'path'
import prompts from 'prompts'
import checkForUpdate from 'update-check'

import { createApp } from './create-app'
import { validateNpmName } from './helpers/validate-pkg'
import packageJson from './package.json'
import { shouldUseYarn } from './helpers/should-use-yarn'
import { listExamples } from './helpers/examples'

let projectPath: string = ''

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectPath = name
  })
  .option('--use-npm')
  .option(
    '-e, --example [name]|[github-url]',
    `

  An example to bootstrap the app with. You can use an example name
  from the official Next.js repo or a GitHub URL. The URL can use
  any branch and/or subdirectory
`
  )
  .option(
    '--example-path <path-to-example>',
    `

  In a rare case, your GitHub URL might contain a branch name with
  a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar).
  In this case, you must specify the path to the example separately:
  --example-path foo/bar
`
  )
  .allowUnknownOption()
  .parse(process.argv)

async function run() {
  if (typeof projectPath === 'string') {
    projectPath = projectPath.trim()
  }

  if (!projectPath) {
    const res = await prompts({
      type: 'text',
      name: 'path',
      message: 'What is your project named?',
      initial: 'my-app',
      validate: name => {
        const validation = validateNpmName(path.basename(path.resolve(name)))
        if (validation.valid) {
          return true
        }
        return 'Invalid project name: ' + validation.problems![0]
      },
    })

    if (typeof res.path === 'string') {
      projectPath = res.path.trim()
    }
  }

  if (!projectPath) {
    console.log()
    console.log('Please specify the project directory:')
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
    )
    console.log()
    console.log('For example:')
    console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-next-app')}`)
    console.log()
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    )
    process.exit(1)
  }

  const resolvedProjectPath = path.resolve(projectPath)
  const projectName = path.basename(resolvedProjectPath)

  const { valid, problems } = validateNpmName(projectName)
  if (!valid) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    )

    problems!.forEach(p => console.error(`    ${chalk.red.bold('*')} ${p}`))
    process.exit(1)
  }

  // --example flag included, but no example path provided, i.e.:
  // $ create-next-app --example
  if (program.example && typeof program.example !== 'string') {
    const wantsRes = await prompts({
      type: 'confirm',
      name: 'wantsExample',
      message:
        'You forgot to select an example, would you like to pick one now?',
      initial: false,
    })

    if (wantsRes.wantsExample) {
      const examplesJSON = await listExamples()
      const choices = examplesJSON.map((example: any) => ({
        title: example.name,
        value: example.name,
      }))
      // The search function built into `prompts` isn’t very helpful:
      // someone searching for `styled-components` would get no results since
      // the example is called `with-styled-components`, and `prompts` searches
      // the beginnings of titles.
      const nameRes = await prompts({
        type: 'autocomplete',
        name: 'exampleName',
        message: 'Pick an example',
        choices,
        suggest: (input: any, choices: any) =>
          choices.filter((choice: any) => choice.title.includes(input)),
      })

      if (!nameRes.exampleName) {
        console.error(
          'Could not locate an example with that name. Creating project from blank starter instead.'
        )
      }

      program.example = nameRes.exampleName

      // If the user says 'no' to choosing from examples, they are warned that the default
      // template is being used.
    } else {
      console.warn(chalk.yellow('Creating project from blank starter instead.'))
    }
  }

  await createApp({
    appPath: resolvedProjectPath,
    useNpm: !!program.useNpm,
    example:
      (typeof program.example === 'string' && program.example.trim()) ||
      undefined,
    examplePath: program.examplePath,
  })
}

const update = checkForUpdate(packageJson).catch(() => null)

async function notifyUpdate() {
  try {
    const res = await update
    if (res?.latest) {
      const isYarn = shouldUseYarn()

      console.log()
      console.log(
        chalk.yellow.bold('A new version of `create-next-app` is available!')
      )
      console.log(
        'You can update by running: ' +
          chalk.cyan(
            isYarn
              ? 'yarn global add create-next-app'
              : 'npm i -g create-next-app'
          )
      )
      console.log()
    }
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async reason => {
    console.log()
    console.log('Aborting installation.')
    if (reason.command) {
      console.log(`  ${chalk.cyan(reason.command)} has failed.`)
    } else {
      console.log(chalk.red('Unexpected error. Please report it as a bug:'))
      console.log(reason)
    }
    console.log()

    await notifyUpdate()

    process.exit(1)
  })
