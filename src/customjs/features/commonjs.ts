// See: https://github.com/byCedric/jackw-systemjs-extras/blob/main/packages/systemjs-cjs-extra/src/index.js

const CJS_REQUIRE_REGEX =
    /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF."'])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)\s*\)/g;
  const AMD_MODULE_REGEX =
    /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])define\s*\(\s*("[^"]+"\s*,\s*|'[^']+'\s*,\s*)?\s*(\[(\s*(("[^"]+"|'[^']+')\s*,|\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*(\s*("[^"]+"|'[^']+')\s*,?)?(\s*(\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*\s*\]|function\s*|{|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\))/;
  const CJS_EXPORTS_REGEX =
    /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])(exports\s*(\[['"]|\.)|module(\.exports|\['exports'\]|\["exports"\])\s*(\[['"]|[=,\.]))/;
  const CJS_FILEDIR_REGEX = /__filename|__dirname]/;
  const COMMENT_REGEX = /(^|[^\\])(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
  const STRING_REGEX = /("[^"\\\n\r]*(\\.[^"\\\n\r]*)*"|'[^'\\\n\r]*(\\.[^'\\\n\r]*)*')/g;
  const JAVASCRIPT_REGEX = /^[^#?]+\.js([?#].*)?$/;
  const JS_CONTENT_TYPE_REGEX = /^(text|application)\/(x-)?javascript(;|$)/;

  function isCJSFormat(source) {
    return (
      !AMD_MODULE_REGEX.test(source) &&
      (CJS_REQUIRE_REGEX.test(source) ||
        CJS_EXPORTS_REGEX.test(source) ||
        CJS_FILEDIR_REGEX.test(source))
    );
  }

  function errMsg(errCode, msg) {
    return (
      (msg || "") +
      " (SystemJS Error#" +
      errCode +
      " " +
      "https://github.com/systemjs/systemjs/blob/main/docs/errors.md#" +
      errCode +
      ")"
    );
  }

  function getPathVars(url) {
    const filename = url.substring(url.lastIndexOf("/") + 1);
    let dirname = url.split("/");
    dirname.pop();
    dirname = dirname.join("/");

    return {
      filename,
      dirname,
    };
  }

  function extractDepsFromSource(source) {
    CJS_REQUIRE_REGEX.lastIndex =
      COMMENT_REGEX.lastIndex =
      STRING_REGEX.lastIndex =
        0;
    let depIndentifiers = [];
    let stringLocations = [];
    let commentLocations = [];
    let match;

    if (source.length / source.split("\n").length < 200) {
      while ((match = STRING_REGEX.exec(source))) {
        stringLocations.push([match.index, match.index + match[0].length]);
      }

      while ((match = COMMENT_REGEX.exec(source))) {
        // only track comments not starting in strings
        if (!inLocation(stringLocations, match)) {
          commentLocations.push([
            match.index + match[1].length,
            match.index + match[0].length - 1,
          ]);
        }
      }
    }

    while ((match = CJS_REQUIRE_REGEX.exec(source))) {
      // ensure we're not within a string or comment location
      if (
        !inLocation(stringLocations, match) &&
        !inLocation(commentLocations, match)
      ) {
        var dep = match[1].substring(1, match[1].length - 1);
        // skip cases like require('" + file + "')
        if (dep.match(/"|'/)) {
          continue;
        }
        depIndentifiers.push(dep);
      }
    }

    return depIndentifiers;
  }

  function inLocation(locations, match) {
    for (var i = 0; i < locations.length; i++) {
      if (locations[i][0] < match.index && locations[i][1] > match.index) {
        return true;
      }
    }
    return false;
  }

  function template(source) {
    return `(function (module,exports,require,__filename,__dirname, global, GLOBAL) {
${source}
}).apply(__cjsWrapper.exports, __cjsWrapper.args)`;
  }

  function createRequire(loader, parentUrl) {
    return function require(id) {
      const resolvedUrl = loader.resolve(id, parentUrl);
      const module = loader.get(resolvedUrl);

      if (!module) {
        throw new Error(
          'Module not already loaded loading "' +
            id +
            '" as ' +
            resolvedUrl +
            (parentUrl ? ' from "' + parentUrl + '".' : "."),
        );
      }

      return "__useDefault" in module ? module.default : module;
    };
  }

  const systemJSPrototype = global.System.constructor.prototype;
  const originalInstantiate = systemJSPrototype.instantiate;
  // const originalShouldFetch =
  //   systemJSPrototype.shouldFetch.bind(systemJSPrototype);

  // systemJSPrototype.shouldFetch = function (url) {
  //   return originalShouldFetch(url) || JAVASCRIPT_REGEX.test(url);
  // };

  const nextEvaluate = systemJSPrototype.evaluate;
  systemJSPrototype.evaluate = function (source, url, parentUrl, options) {
    // const isJavascriptFile = JAVASCRIPT_REGEX.test(url);

    if (!(options.format === 'cjs' || isCJSFormat(source))) {
      console.log('[commonjs] Skipping, a commonjs file');
      return nextEvaluate.call(this, source, url, source, options);
    }

    console.log('[commonjs] Evaluating', url);

    const exports = {};
    const module = { exports };
    const require = createRequire(this, parentUrl ?? url);
    const dependencies = extractDepsFromSource(source);

    // Import all dependencies into the SystemJS registry
    const depsPromises = dependencies.map((dep) =>
      global.System.import(dep, parentUrl ?? url)
    );

    // Make sure all deps are loaded before attempting to exec the module
    // otherwise "require" will fail at System.get
    return Promise.all(depsPromises).then(() => {
      let _src = template(source);

      if (_src.indexOf("//# sourceURL=") < 0) {
        _src += "\n//# sourceURL=" + url;
      }

      const { filename, dirname } = getPathVars(url);
      global.__cjsWrapper = {
        exports,
        args: [
          module,
          exports,
          require,
          filename,
          dirname,
          global,
          global,
        ],
      };
      // exec the code to capture exports.
      (0, eval)(_src);

      global.__cjsWrapper = undefined;

      // Create a System.register format and pass the dependencies
      // and module exports.
      systemJSPrototype.register(
        dependencies,
        function (_export, _context) {
          return {
            setters: [],
            execute: function () {
              _export(module.exports);
              _export("default", module.exports);
            },
          };
        }
      );

      // Return the new module
      return systemJSPrototype.getRegister(url);
    });
  };

  // systemJSPrototype.instantiate = function (url, parentUrl, meta) {
  //   const isJavascriptFile = JAVASCRIPT_REGEX.test(url);

  //   if (isJavascriptFile) {
  //     return systemJSPrototype
  //       .fetch(url, {
  //         credentials: "same-origin",
  //         meta: meta,
  //       })
  //       .then((res) => {
  //         if (!res.ok) {
  //           throw Error(
  //             errMsg(
  //               7,
  //               res.status +
  //                 " " +
  //                 res.statusText +
  //                 ", loading " +
  //                 url +
  //                 (parentUrl ? " from " + parentUrl : "")
  //             )
  //           );
  //         }
  //         const contentType = res.headers.get("content-type");

  //         if (!contentType || !JS_CONTENT_TYPE_REGEX.test(contentType)) {
  //           throw Error(
  //             errMsg(
  //               4,
  //               'Unknown Content-Type "' +
  //                 contentType +
  //                 '", loading ' +
  //                 url +
  //                 (parentUrl ? " from " + parentUrl : "")
  //             )
  //           );
  //         }

  //         return res.text().then((source) => {
  //           if (isCJSFormat(source)) {
  //             const exports = {};
  //             const module = { exports };
  //             const require = createRequire(this, parentUrl ?? url);
  //             const dependencies = extractDepsFromSource(source);

  //             // Import all dependencies into the SystemJS registry
  //             const depsPromises = dependencies.map((dep) =>
  //               global.System.import(dep, parentUrl ?? url)
  //             );

  //             // Make sure all deps are loaded before attempting to exec the module
  //             // otherwise "require" will fail at System.get
  //             return Promise.all(depsPromises).then(() => {
  //               let _src = template(source);

  //               if (_src.indexOf("//# sourceURL=") < 0) {
  //                 _src += "\n//# sourceURL=" + url;
  //               }

  //               const { filename, dirname } = getPathVars(url);
  //               global.__cjsWrapper = {
  //                 exports,
  //                 args: [
  //                   module,
  //                   exports,
  //                   require,
  //                   filename,
  //                   dirname,
  //                   global,
  //                   global,
  //                 ],
  //               };
  //               // exec the code to capture exports.
  //               (0, eval)(_src);

  //               global.__cjsWrapper = undefined;

  //               // Create a System.register format and pass the dependencies
  //               // and module exports.
  //               systemJSPrototype.register(
  //                 dependencies,
  //                 function (_export, _context) {
  //                   return {
  //                     setters: [],
  //                     execute: function () {
  //                       _export(module.exports);
  //                       _export("default", module.exports);
  //                     },
  //                   };
  //                 }
  //               );

  //               // Return the new module
  //               return systemJSPrototype.getRegister(url);
  //             });
  //           } else {
  //             // If not a CommonJS module, use default behavior
  //             if (source.indexOf("//# sourceURL=") < 0) {
  //               source += "\n//# sourceURL=" + url;
  //             }
  //             (0, eval)(source);
  //             return systemJSPrototype.getRegister(url);
  //           }
  //         });
  //       });
  //   }

  //   // If not a JS file, use default behavior
  //   return originalInstantiate.call(this, url, parentUrl, meta);
  // };
