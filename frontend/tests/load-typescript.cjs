const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

// Use the existing TypeScript dependency; no extra test runner or emitted files.
exports.load = function load(name, overrides = {}) {
  const file = path.resolve(__dirname, '../src/components/recipe-bowl', name + '.ts')
  const mod = new Module(file, module)
  mod.filename = file
  mod.paths = Module._nodeModulePaths(path.dirname(file))
  const original = mod.require.bind(mod)
  mod.require = name => Object.hasOwn(overrides, name) ? overrides[name] : original(name)
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, file)
  return mod.exports
}
