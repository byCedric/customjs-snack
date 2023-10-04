import { transformSync } from '@expo-system/babel';

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
  meta.evaluate = meta.evaluate || {};

  if (meta.evaluate.skipTranspile) return source;

  console.time(`Transpile: ${url}`);
  const result = transformSync(source, {
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      ['@babel/plugin-transform-modules-systemjs', { systemGlobal: 'System' }],
    ],
    filename: `snack://${url}`,
    babelrc: false,
    configFile: false,
    sourceMaps: 'inline',
    sourceFileName: `snack://${url}`,
  });

  console.timeEnd(`Transpile: ${url}`);

  return result.code;
}

systemJSPrototype.evaluate = function (source, url, parentUrl, meta) {
  console.log('[eval]', url, source);

  if (global.globalEvalWithSourceUrl) {
    global.globalEvalWithSourceUrl(source, `snack://${url}`);
  } else {
    (0, eval)(source);
  }

  return this.getRegister(url);
}
