import { systemJSPrototype } from './system';

declare global {
  namespace SystemJS {
    interface System {
      /**
       * Resolve, fetch, transpile, and evaluate a module.
       */
      instantiate(id: SystemModuleUrl, parentId?: SystemModuleUrl, meta?: SystemModuleMeta): Promise<SystemModuleUrl>;
    }
  }
}

systemJSPrototype.instantiate = function (url, parentUrl, meta) {
  const loader: SystemJS.System = this;

  return Promise.resolve(loader.resolve(url, parentUrl))
    .then((resolvedUrl) => loader.fetch(resolvedUrl, parentUrl, meta))
    .then((response) => response.text())
    .then((source) => loader.transpile(source, url, parentUrl, meta))
    .then((source) => loader.evaluate(source, url, parentUrl, meta));
};
