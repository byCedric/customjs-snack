// Copied from systemjs/src/features/worker-load.js

import { systemJSPrototype } from '../system-rn';
import { hasSelf } from '../utils/common';

if (hasSelf && typeof global.importScripts === 'function')
  systemJSPrototype.instantiate = function (url) {
    var loader = this;
    return Promise.resolve().then(function () {
      global.importScripts(url);
      return loader.getRegister(url);
    });
  };
