/**
 * Runs Vite with Node 18+. npm often picks up old Node 8 from Program Files;
 * this script prefers nvm, then Cursor's bundled Node 22, then Program Files.
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const projectRoot = path.join(__dirname, '..')
const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')

function nodeMajor(nodePath) {
  const result = spawnSync(nodePath, ['-p', 'process.versions.node.split(".")[0]'], {
    encoding: 'utf8'
  })
  if (result.status !== 0) return 0
  return parseInt(String(result.stdout).trim(), 10) || 0
}

function collectCandidates() {
  const list = []
  const push = (p) => {
    if (p && typeof p === 'string' && !list.includes(p)) list.push(p)
  }

  push(process.env.VITE_NODE)
  push(process.execPath)

  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
  const nvmRoot = process.env.NVM_HOME || path.join(localAppData, 'nvm')
  if (fs.existsSync(nvmRoot)) {
    try {
      const versions = fs
        .readdirSync(nvmRoot)
        .filter((name) => /^v?\d+/.test(name))
        .sort()
        .reverse()
      for (const ver of versions) {
        push(path.join(nvmRoot, ver, 'node.exe'))
        push(path.join(nvmRoot, ver.replace(/^v/, ''), 'node.exe'))
      }
    } catch (_) {
      /* ignore */
    }
  }

  push(path.join(localAppData, 'Programs', 'cursor', 'resources', 'app', 'resources', 'helpers', 'node.exe'))

  push(path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node.exe'))
  push(path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'nodejs', 'node.exe'))
  push('/usr/local/bin/node')
  push('/opt/homebrew/bin/node')

  return list
}

function resolveNode() {
  for (const candidate of collectCandidates()) {
    if (fs.existsSync(candidate) && nodeMajor(candidate) >= 18) {
      return candidate
    }
  }

  console.error('')
  console.error(`Node ${process.version} is too old for Vite (requires Node 18+).`)
  console.error('')
  console.error('You have Node 18 via nvm. In this terminal run:')
  console.error('  nvm use 18')
  console.error('  npm run dev')
  console.error('')
  console.error('Or set for one session:')
  console.error('  set VITE_NODE=%LOCALAPPDATA%\\nvm\\v18.17.0\\node.exe')
  console.error('  npm run dev')
  console.error('')
  process.exit(1)
}

const node = resolveNode()
const subcommand = process.argv[2] || 'dev'
const viteArgs = subcommand === 'dev' ? [] : [subcommand]

if (!fs.existsSync(viteBin)) {
  console.error('Vite is not installed. Run: npm install')
  process.exit(1)
}

if (process.env.npm_config_loglevel === undefined && !process.env.CI) {
  const ver = spawnSync(node, ['-v'], { encoding: 'utf8' })
  if (ver.stdout) process.stderr.write(`Using Node ${ver.stdout.trim()} for Vite\n`)
}

const result = spawnSync(node, [viteBin, ...viteArgs], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env
})

process.exit(result.status === null ? 1 : result.status)
