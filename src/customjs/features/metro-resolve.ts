import { Platform } from 'react-native';
import { systemJSPrototype } from '../core/system';
import { hasDocument } from '../utils/runtime';

declare global {
  namespace SystemJS {
    interface SystemModuleMeta {
      format?: 'cjs' | 'esm';
    }
  }
}

const nextFetch = systemJSPrototype.fetch;
systemJSPrototype.fetch = function (url, parentUrl, meta) {
  if (isSourceUrl(url)) {
    meta.evaluate = meta.evaluate || {};
    meta.evaluate.skipTranspile = true;
    meta.format = 'cjs';
  }

  return nextFetch.call(this, url, parentUrl, meta);
}

const nextResolve = systemJSPrototype.resolve;
systemJSPrototype.resolve = function (url, parentUrl) {
  try {
    return nextResolve.call(this, url, parentUrl);
  } catch (error) {
    if (isSourceUrl(url)) return url;
    if (Platform.OS === 'web' && url === 'react-native') {
      url = 'react-native-web';
    }

    const sourceUrl = createSourceUrl(url);
    // const parentTarget = parentUrl && unpackModuleTarget(parentUrl) || parentUrl;

    // if (parentTarget) {
    //   sourceUrl.searchParams.set('origin', parentTarget);
    // }

    console.log('[metro-resolve] handling dependency request', { url, parentUrl, sourceUrl });

    return sourceUrl.toString();
  }
};

function isSourceUrl(url: string) {
  return url.includes('/_expo/resolve');
  try {
    const { pathname } = new URL(url);
    return pathname.startsWith('/_expo/resolve');
  } catch {
    return false;
  }
}

function createSourceUrl(url: string) {
  // Avoid CORS issues on web
  const host = Platform.select({
    default: '192.168.86.235',
    web: 'localhost',
  });

  return `http://${host}:8081/_expo/resolve?test=true`
    + `&platform=${encodeURIComponent(Platform.OS)}`
    + `&target=${encodeURIComponent(url)}`;

  const sourceUrl = new URL(hasDocument ? window.location.href : 'http://localhost:8081');

  sourceUrl.pathname = '_expo/resolve';
  sourceUrl.searchParams.set('platform', 'web');
  sourceUrl.searchParams.set('target', url);

  return sourceUrl;
}

function unpackModuleTarget(sourceUrl: string) {
  try {
    return (new URL(sourceUrl)).searchParams.get('target');
  } catch {
    return null;
  }
}
