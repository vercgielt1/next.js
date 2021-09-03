import path from 'path'
import fs from 'fs-extra'
import { spawn } from 'child_process'
import { NextInstance } from './base'

export class NextDevInstance extends NextInstance {
  public get buildId() {
    return 'development'
  }

  public async readFile(filename: string) {
    return fs.readFile(path.join(this.testDir, filename), 'utf8')
  }
  public async patchFile(filename: string, content: string) {
    const outputPath = path.join(this.testDir, filename)
    await fs.ensureDir(path.dirname(outputPath))
    return fs.writeFile(outputPath, content)
  }
  public async renameFile(filename: string, newFilename: string) {
    return fs.rename(
      path.join(this.testDir, filename),
      path.join(this.testDir, newFilename)
    )
  }
  public async deleteFile(filename: string) {
    return fs.remove(path.join(this.testDir, filename))
  }

  public async setup() {
    await super.createTestDir()
  }

  public async start() {
    if (this.childProcess) {
      throw new Error('next already started')
    }
    // we don't use yarn next here as yarn detaches itself from the
    // child process making it harder to kill all processes
    this.childProcess = spawn('node', ['node_modules/.bin/next'], {
      cwd: this.testDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: {
        ...process.env,
        NODE_ENV: '',
        __NEXT_TEST_MODE: '1',
        __NEXT_RAND_PORT: '1',
        __NEXT_TEST_WITH_DEVTOOL: '1',
      },
    })

    this.childProcess.stdout.on('data', (chunk) => {
      const msg = chunk.toString()
      process.stdout.write(chunk)
      this.emit('stdout', [msg])
    })
    this.childProcess.stderr.on('data', (chunk) => {
      const msg = chunk.toString()
      process.stderr.write(chunk)
      this.emit('stderr', [msg])
    })

    await new Promise<void>((resolve) => {
      const readyCb = (msg) => {
        if (msg.includes('started server on') && msg.includes('url:')) {
          this._url = msg.split('url: ').pop().trim()
          this._parsedUrl = new URL(this._url)
          this.off('stdout', readyCb)
          resolve()
        }
      }
      this.on('stdout', readyCb)
    })
  }
}
