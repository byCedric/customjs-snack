import { systemJSPrototype } from './system';

declare global {
  namespace SystemJS {
    interface System {
      /**
       * Determine if the resolved module url should be fetched.
       */
      shouldFetch(id: SystemModuleUrl, parentId?: SystemModuleUrl, meta?: SystemModuleMeta): boolean;

      /**
       * Fetch the module source from the requested module url.
       */
      fetch(id: SystemModuleUrl, parentId?: SystemModuleUrl, meta?: SystemModuleMeta): Promise<Response>;
    }
  }
}

// @ts-expect-error
systemJSPrototype.prepareImport = function() { }

systemJSPrototype.shouldFetch = function () {
  return false;
};

systemJSPrototype.fetch = function (url, parentId, meta) {
  console.log('[fetch]', url);
  return fetch(url)
    .then((response) => response.ok ? response : Promise.reject(response))
    // .catch((response) => {
    //   throw new Error(`Failed to fetch module "${url}": ${response.status} - ${response.statusText}`);
    // });
};
