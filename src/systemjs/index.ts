// Export everything from SystemJS
export * from './system-rn';

// Build the SystemJS core loader
import './features/script-load';
import './features/fetch-load';
import './features/resolve';
import './features/import-maps';
import './features/depcache';
import './features/worker-load';
import './extras/global';
import './extras/module-types';
import './features/registry';

// Build React Native specific features
import './react-native/snack-files';

// @ts-expect-error
export const System: SystemJS = global.System;

interface SystemJS {
  // See: ./system-rn
  import(id: string, parentId?: string, meta?: object): any;
  import(id: string, meta?: object): any;
  createContext(parentId: string): {
    url: string;
    resolve(id: string, parentId: string): any;
  };
  register(deps: any, declare: any, metas: any): any;
  getRegister(): any;

  // See: ./features/script-load.ts | ./features/fetch-load.ts | ./features/depcache.ts | ./features/worker-load.ts
  createScript(url: string): HTMLScriptElement;
  instantiate(url: string, parentUrl?: string, meta?: object): HTMLScriptElement;

  // See: ./features/resolve.ts
  resolve(id: string, parentId?: string): any;

  // See: ./features/import-map.ts
  prepareImport(doProcessScripts: boolean): any;
  addImportMap(newMap: { imports: Record<string, string> }, mapBase: any): any;

  // See: ./react-native/snack-files.ts
  addFiles(files: Record<string, string>): void;
  resetFiles(): void;
}
