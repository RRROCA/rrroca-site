const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScriptExports(relativePath, exportNames, options = {}) {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const scriptPath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(scriptPath, 'utf8');
  const context = {
    console,
    module: { exports: {} },
    exports: {},
    require,
    __dirname: path.dirname(scriptPath),
    __filename: scriptPath,
    window: options.window,
    document: options.document,
    navigator: options.window?.navigator,
    Event: options.window?.Event,
    KeyboardEvent: options.window?.KeyboardEvent,
    MouseEvent: options.window?.MouseEvent,
    HTMLElement: options.window?.HTMLElement,
    Node: options.window?.Node,
    setTimeout: options.setTimeout || setTimeout,
    clearTimeout: options.clearTimeout || clearTimeout,
    Math: options.Math || Math,
    ...options.extraGlobals
  };

  context.global = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(
    `${source}\nmodule.exports = { ${exportNames.join(', ')} };`,
    context,
    { filename: scriptPath }
  );

  return {
    exports: context.module.exports,
    context,
    scriptPath,
    source
  };
}

module.exports = {
  loadScriptExports
};
