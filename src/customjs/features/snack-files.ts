import { systemJSPrototype } from '../core/system';

declare global {
  namespace SystemJS {
    interface System {
      files: Map<string, string>;
      addFiles(files: Record<string, string>): void;
      resetFiles(): void;
    }
  }
}

systemJSPrototype.files = new Map<string, string>();

systemJSPrototype.addFiles = function (newFiles: Record<string, string>) {
  for (const [url, source] of Object.entries(newFiles)) {
    this.files.set(url, source);
  }
};

systemJSPrototype.resetFiles = function () {
  this.files.clear();
};

const nextResolve = systemJSPrototype.resolve;
systemJSPrototype.resolve = function (url, parentUrl) {
  return this.files.has(url) ? url : nextResolve.call(this, url, parentUrl);
}

const nextShouldFetch = systemJSPrototype.shouldFetch;
systemJSPrototype.shouldFetch = function (url) {
  if (this.files.has(url)) {
    return true;
  }

  return nextShouldFetch.call(this, url);
};

const nextFetch = systemJSPrototype.fetch;
systemJSPrototype.fetch = function (url, options) {
  if (this.files.has(url)) {
    const loader: SystemJS.System = this;

    return Promise.resolve({
      ok: true,
      text() {
        return Promise.resolve(loader.files.get(url));
      },
      //@ts-expect-error
      headers: {
        get() {
          return 'application/javascript';
        }
      }
    });
  }

  return nextFetch.call(this, url, options);
}
