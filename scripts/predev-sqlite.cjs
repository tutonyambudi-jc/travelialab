/**
 * Recompile better-sqlite3 avec le MÊME node.exe que `next.cmd` utilisera
 * (premier résultat de `where.exe node` sous Windows).
 */
'use strict'

const { execFileSync, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const addon = path.join(root, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')

/** Toutes les entrées `where node` (ordre = priorité PATH, comme next.cmd). */
function allNodeCandidatesWindows() {
  try {
    const out = execSync('where.exe node', { encoding: 'utf8' })
    return out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && fs.existsSync(l))
  } catch (_) {
    return [process.execPath]
  }
}

/**
 * Utiliser une install Node complète (npm-cli à côté de node.exe) pour rebuild.
 * Évite de compiler avec un binaire « embarqué » sans toolchain npm.
 */
function pickNodeForRebuildWindows() {
  const lines = allNodeCandidatesWindows()
  const withNpm = lines.find((line) =>
    fs.existsSync(path.join(path.dirname(line), 'node_modules', 'npm', 'bin', 'npm-cli.js'))
  )
  return withNpm || lines[0] || process.execPath
}

/** npm-cli.js livré avec l’installation Node (évite execFile sur .cmd qui peut échouer avec EINVAL). */
function npmCliBesideNode(nodeExe) {
  const dir = path.dirname(nodeExe)
  const cli = path.join(dir, 'node_modules', 'npm', 'bin', 'npm-cli.js')
  if (fs.existsSync(cli)) return cli
  const cmd = path.join(dir, 'npm.cmd')
  if (fs.existsSync(cmd)) return cmd
  return null
}

function main() {
  const node = process.platform === 'win32' ? pickNodeForRebuildWindows() : process.execPath
  let abi = '?'
  try {
    abi = execFileSync(node, ['-p', 'process.versions.modules'], { encoding: 'utf8' }).trim()
  } catch (_) {
    /* ignore */
  }
  console.log('[predev-sqlite] rebuild better-sqlite3 for', node, '(NODE_MODULE_VERSION', abi + ')')

  try {
    if (fs.existsSync(addon)) fs.unlinkSync(addon)
  } catch (_) {
    /* ignore */
  }

  const npmCli = npmCliBesideNode(node)
  if (npmCli && npmCli.endsWith('npm-cli.js')) {
    execFileSync(node, [npmCli, 'rebuild', 'better-sqlite3'], { cwd: root, stdio: 'inherit' })
  } else if (npmCli) {
    execSync(`"${npmCli}" rebuild better-sqlite3`, { cwd: root, stdio: 'inherit', shell: true })
  } else {
    const env = { ...process.env }
    const prefix = path.dirname(node) + path.delimiter
    env.Path = prefix + (env.Path || '')
    env.PATH = prefix + (env.PATH || '')
    execSync('npm rebuild better-sqlite3', { cwd: root, stdio: 'inherit', shell: true, env })
  }
}

main()
