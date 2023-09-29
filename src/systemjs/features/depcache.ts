// Copied from systemjs/src/features/depcache.js

import { IMPORT_MAP } from '../utils/common';
import { systemJSPrototype, getOrCreateLoad } from '../system-rn';
import { importMap } from './import-maps';

var systemInstantiate = systemJSPrototype.instantiate;
systemJSPrototype.instantiate = function (url, firstParentUrl, meta) {
  var preloads = (!process.env.SYSTEM_BROWSER && this[IMPORT_MAP] || importMap).depcache[url];
  if (preloads) {
    for (var i = 0; i < preloads.length; i++)
      getOrCreateLoad(this, this.resolve(preloads[i], url), url, undefined);
  }
  return systemInstantiate.call(this, url, firstParentUrl, meta);
};
