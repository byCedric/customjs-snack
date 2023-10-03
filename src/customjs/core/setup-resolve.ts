import { errMsg } from 'systemjs/src/err-msg';

import { resolveIfNotPlainOrUrl } from '../common';
import { systemJSPrototype } from './system';

declare global {
  namespace SystemJS {
    interface System {
      /**
       * Resolve a module request by converting a requestiong "url", and it's "parentUrl" to a full URL.
       * If the URL can't be resolved, an error is thrown.
       */
      resolve(id: SystemModuleUrl, parentId?: SystemModuleUrl): SystemModuleUrl;
    }
  }
}

systemJSPrototype.resolve = function (url, parentUrl) {
  throw new Error('Resolve not implemented');
  // const result = resolveIfNotPlainOrUrl(url, parentUrl) || throwUnresolved(url, parentUrl);
  // console.log('[resolve]', url, '->', result);
  // return result;
};

function throwUnresolved(url: string, parentUrl?: string) {
  throw Error(
    errMsg(8,
      process.env.SYSTEM_PRODUCTION
        ? [url, parentUrl].join(', ')
        : "Unable to resolve bare specifier '" + url + (parentUrl ? "' from " + parentUrl : "'")
    )
  );
}
