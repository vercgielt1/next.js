import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import treeKill from 'tree-kill'
import { NextConfig } from 'next'
import { FileRef } from '../e2e-utils'
import { ChildProcess } from 'child_process'
import { createNextInstall } from '../create-next-install'

type Event = 'stdout' | 'stderr' | 'error' | 'destroy'

export class NextInstance {
  protected files: {
    [filename: string]: string | FileRef
  }
  protected nextConfig?: NextConfig
  protected dependencies?: { [name: string]: string }
  protected events: { [eventName: string]: Set<any> }
  protected testDir: string
  protected isDestroyed: boolean
  protected childProcess: ChildProcess
  protected _url: string
  protected _parsedUrl: URL

  constructor({
    files,
    dependencies,
    nextConfig,
  }: {
    files: {
      [filename: string]: string | FileRef
    }
    dependencies?: {
      [name: string]: string
    }
    nextConfig?: NextConfig
  }) {
    this.files = files
    this.dependencies = dependencies
    this.nextConfig = nextConfig
    this.events = {}
    this.isDestroyed = false
  }

  protected async createTestDir() {
    if (this.isDestroyed) {
      throw new Error('next instance already destroyed')
    }
    console.log(`Creating test directory with isolated next...`)

    const tmpDir = process.env.NEXT_TEST_DIR || (await fs.realpath(os.tmpdir()))
    this.testDir = path.join(tmpDir, `next-test-${Date.now()}`)

    if (process.env.NEXT_TEST_STARTER && !this.dependencies) {
      await fs.copy(process.env.NEXT_TEST_STARTER, this.testDir)
    } else {
      this.testDir = await createNextInstall({
        react: 'latest',
        'react-dom': 'latest',
        ...this.dependencies,
      })
    }

    for (const filename of Object.keys(this.files)) {
      const item = this.files[filename]
      const outputfilename = path.join(this.testDir, filename)

      if (typeof item === 'string') {
        await fs.ensureDir(path.dirname(outputfilename))
        await fs.writeFile(outputfilename, item)
      } else {
        await fs.copy(item.fsPath, outputfilename)
      }
    }
    console.log(`Test directory created at ${this.testDir}`)
  }

  public async clean() {
    if (this.childProcess) {
      throw new Error(`stop() must be called before cleaning`)
    }

    const keptFiles = ['node_modules', 'package.json', 'yarn.lock']
    for (const file of await fs.readdir(this.testDir)) {
      if (!keptFiles.includes(file)) {
        await fs.remove(path.join(this.testDir, file))
      }
    }
  }

  public async setup(): Promise<void> {}
  public async start(): Promise<void> {}
  public async stop(): Promise<void> {
    if (this.childProcess) {
      let exitResolve
      const exitPromise = new Promise((resolve) => {
        exitResolve = resolve
      })
      this.childProcess.addListener('exit', () => {
        exitResolve()
      })
      await new Promise<void>((resolve) => {
        treeKill(this.childProcess.pid, 'SIGKILL', (err) => {
          if (err) {
            console.error('tree-kill', err)
          }
          resolve()
        })
      })
      this.childProcess.kill('SIGKILL')
      await exitPromise
      this.childProcess = undefined
      console.log(`Stopped next server`)
    }
  }

  public async destroy(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error(`next instance already destroyed`)
    }
    this.isDestroyed = true
    this.emit('destroy', [])
    await this.stop()
    await fs.remove(this.testDir)
  }

  public get url() {
    return this._url
  }

  public get appPort() {
    return this._parsedUrl.port
  }

  public get buildId(): string {
    return ''
  }

  public async readFile(filename: string): Promise<string> {
    throw new Error('readFile is only allowed in dev mode')
  }
  public async patchFile(filename: string, content: string): Promise<void> {
    throw new Error('patchFile is only allowed in dev mode')
  }
  public async renameFile(
    filename: string,
    newFilename: string
  ): Promise<void> {
    throw new Error('renameFile is only allowed in dev mode')
  }
  public async deleteFile(filename: string) {
    throw new Error('deleteFile is only allowed in dev mode')
  }

  public on(event: Event, cb: (...args: any[]) => any) {
    if (!this.events[event]) {
      this.events[event] = new Set()
    }
    this.events[event].add(cb)
  }

  public off(event: Event, cb: (...args: any[]) => any) {
    this.events[event]?.delete(cb)
  }

  protected emit(event: Event, args: any[]) {
    this.events[event]?.forEach((cb) => {
      cb(...args)
    })
  }
}
