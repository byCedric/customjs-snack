import { systemJSPrototype } from '../system-rn';

systemJSPrototype._files = {} as Record<string, string>;
/**
 * Create a snack-like local file system, with the following files.
 * This will be used to resolve file paths.
 */
systemJSPrototype.addFiles = function (files: Record<string, string>) {
  this._files = { ...this._files, ...files };
};
systemJSPrototype.resetFiles = function () {
  this._files = {};
};

/**
 * Overwrite the default resolve function.
 * This routes module requests to the proper Metro request.
 * By converting it to a HTTP path, we can let SystemJS load the code.
 *
 * This disables the import map functionality
 */
systemJSPrototype.resolve = function (id: string, parentUrl?: string) {
  console.log('RESOLVE', id, parentUrl);

  // Resolve from local files if exist
  if (id.startsWith('./')) {
    const filePath = id.replace(/^\.\//, '');
    if (this._files[filePath]) {
      return `module://${filePath}`;
    }

    throw new Error(`Could not resolve "${id}", not found.`);
  }

  // Resolve external module
  return resolveModule(id, parentUrl);
};
function resolveModule(id: string, parentUrl?: string): string {
  return '';
}

const systemInstantiate = systemJSPrototype.instantiate;
systemJSPrototype.instantiate = function (id: string, parentUrl?: string) {
  if (id.startsWith('module://')) {
    const filePath = id.replace(/^module:\/\//, '');
    const source = this._files[filePath];

    if (source) {
      evaluateCode(source, id);
      return systemJSPrototype.getRegister(id);
    }

    throw new Error(`Could not instantiate "${id}", not found.`);
  }

  // Fallback to normal instantiate
  return systemInstantiate.call(this, id, parentUrl);
}

function evaluateCode(source: string, fileName: string) {
  // See: src/systemjs/features/fetch-load.js line 33...38
  if (source.indexOf('//# sourceURL=') < 0) {
    source += '\n//# sourceURL=' + fileName;
  }

  // Add support for Metro's runtime
  if (global.globalEvalWithSourceUrl) {
    return global.globalEvalWithSourceUrl(source, fileName);
  }

  return (0, eval)(source);
}
