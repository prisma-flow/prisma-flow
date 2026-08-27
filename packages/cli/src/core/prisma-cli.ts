import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

interface PrismaCliOptions {
  env?: NodeJS.ProcessEnv
  timeout?: number
}

interface PrismaMigrateDiffOptions extends PrismaCliOptions {
  fromSchema: string
  legacyDestinationArgs: string[]
}

interface ExecFileOptions {
  cwd: string
  env?: NodeJS.ProcessEnv | undefined
  timeout?: number | undefined
}

interface ExecFileResult {
  stdout: string
  stderr: string
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolveLocalPrismaCli(cwd: string): Promise<string | null> {
  let current = path.resolve(cwd)

  while (true) {
    const candidate = path.join(current, 'node_modules', 'prisma', 'build', 'index.js')
    if (await fileExists(candidate)) return candidate

    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

async function resolveBundledNpxCli(): Promise<string | null> {
  const candidate = path.join(
    path.dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npx-cli.js',
  )
  return (await fileExists(candidate)) ? candidate : null
}

function killProcessTree(pid: number): void {
  if (process.platform === 'win32') {
    const child = execFile('taskkill.exe', ['/pid', String(pid), '/T', '/F'])
    child.on('error', () => {
      /* best effort timeout cleanup */
    })
    return
  }

  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    /* best effort timeout cleanup */
  }
}

function execFileWithTimeout(
  command: string,
  args: string[],
  options: ExecFileOptions,
): Promise<ExecFileResult> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null
    let timedOut = false
    const child = execFile(
      command,
      args,
      {
        cwd: options.cwd,
        env: options.env,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (timer) clearTimeout(timer)
        if (timedOut) {
          const timeoutError = new Error(
            `Prisma CLI timed out after ${options.timeout}ms: ${command} ${args.join(' ')}`,
          ) as Error & { code: string; stdout: string; stderr: string }
          timeoutError.code = 'ETIMEDOUT'
          timeoutError.stdout = stdout
          timeoutError.stderr = stderr
          reject(timeoutError)
          return
        }
        if (!error) return resolve({ stdout, stderr })
        const commandError = error as Error & { stdout?: string; stderr?: string }
        commandError.stdout = stdout
        commandError.stderr = stderr
        reject(commandError)
      },
    )

    if (options.timeout && options.timeout > 0) {
      timer = setTimeout(() => {
        timedOut = true
        if (child.pid) killProcessTree(child.pid)
      }, options.timeout)
    }
  })
}

export async function execPrisma(
  cwd: string,
  args: string[],
  options: PrismaCliOptions = {},
): Promise<{ stdout: string; stderr: string }> {
  const localCli = await resolveLocalPrismaCli(cwd)
  if (localCli) {
    return execFileWithTimeout(process.execPath, [localCli, ...args], {
      cwd,
      env: options.env,
      timeout: options.timeout,
    })
  }

  if (process.platform === 'win32') {
    const npxCli = await resolveBundledNpxCli()
    if (npxCli) {
      return execFileWithTimeout(process.execPath, [npxCli, 'prisma', ...args], {
        cwd,
        env: options.env,
        timeout: options.timeout,
      })
    }
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  return execFileWithTimeout(command, ['prisma', ...args], {
    cwd,
    env: options.env,
    timeout: options.timeout,
  })
}

function hasUnsupportedMigrateDiffFlag(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const commandError = error as Error & { stderr?: string }
  const message = `${error.message}\n${commandError.stderr ?? ''}`.toLowerCase()
  return (
    message.includes('was removed') ||
    message.includes('unknown option') ||
    message.includes('unexpected option')
  )
}

/**
 * Run `prisma migrate diff` across supported Prisma CLI generations.
 *
 * Prisma 7 renamed the schema flags and removed direct URL flags. Prefer its
 * config-datasource form, then retry with the Prisma 5/6 flags only when the
 * installed CLI rejects the modern form. Both forms are read-only.
 */
export async function execPrismaMigrateDiff(
  cwd: string,
  { fromSchema, legacyDestinationArgs, env, timeout }: PrismaMigrateDiffOptions,
): Promise<{ stdout: string; stderr: string }> {
  const options: PrismaCliOptions = {
    ...(env === undefined ? {} : { env }),
    ...(timeout === undefined ? {} : { timeout }),
  }

  try {
    return await execPrisma(
      cwd,
      ['migrate', 'diff', '--from-schema', fromSchema, '--to-config-datasource', '--script'],
      options,
    )
  } catch (error) {
    if (!hasUnsupportedMigrateDiffFlag(error)) throw error

    return execPrisma(
      cwd,
      [
        'migrate',
        'diff',
        '--from-schema-datamodel',
        fromSchema,
        ...legacyDestinationArgs,
        '--script',
      ],
      options,
    )
  }
}
