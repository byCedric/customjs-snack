import { transformSync } from 'snack-babel-standalone/build/runtime';

import { systemJSPrototype } from '../core/system';

declare global {
  namespace SystemJS {
    interface SystemModuleMeta {
      evaluate?: {
        sourceMap?: any;
        skipTranspile?: boolean;
      }
    }
  }
}

systemJSPrototype.transpile = function (source, url, parentUrl, meta) {
  meta = meta || this.createContext(url);
  meta.evaluate = meta.evaluate || {};

  if (meta.evaluate.skipTranspile) {
    return source;
  }

  console.time(`Transpile: ${url}`);
  const result = transformSync(source, {
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      ['@babel/plugin-transform-modules-commonjs'],
      // ['@babel/plugin-transform-modules-systemjs', { systemGlobal: 'System' }],
    ],
    filename: url,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    sourceFileName: url,
  });
  console.timeEnd(`Transpile: ${url}`);

  meta.evaluate.sourceMap = result.map;
  return result.code;
}

systemJSPrototype.evaluate = function (source, url, parentUrl, meta) {
  if (global.globalEvalWithSourceUrl) {
    global.globalEvalWithSourceUrl(source, url);
  }

  (0, eval)(source);

  return this.getRegister(url);
}
