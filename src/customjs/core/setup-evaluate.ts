import { systemJSPrototype } from './system';

declare global {
  namespace SystemJS {
    interface System {
      /**
       * Convert the source to evaluatable code.
       */
      transpile(source: string, url: SystemModuleUrl, parentUrl?: SystemModuleUrl, meta?: SystemModuleMeta): SystemModule;

      /** Evaluate and return the module source */
      evaluate(source: string, url: SystemModuleUrl, parentUrl?: SystemModuleUrl, meta?: SystemModuleMeta): SystemModule;
    }
  }
}

systemJSPrototype.transpile = function () {
  throw new Error('Pre evaluate is not implemented.');
};

systemJSPrototype.evaluate = function () {
  throw new Error('Evaluate is not implemented.');
};
