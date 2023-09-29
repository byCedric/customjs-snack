
import { systemJSPrototype } from '../core/system';

// DO NOT USE THIS, ITS NOT GOOD

const nextResolve = systemJSPrototype.resolve;
systemJSPrototype.resolve = function (url, parentUrl) {
  try {
    return nextResolve.call(this, url, parentUrl);
  } catch (error) {
    console.log(url);
    if (url.includes('http')) {
      return url;
    }

    const sourceUrl = new URL('http://localhost:3000/');
    sourceUrl.pathname = '_resolve';
    sourceUrl.searchParams.set('target', unpackParentUrl(url));

    const parentTarget = unpackParentUrl(parentUrl);
    if (parentTarget.startsWith('/')) {
      sourceUrl.searchParams.set('origin', parentTarget);
    }

    return fetch(sourceUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not resolve location: ${response.status} - ${response.statusText}`);
        return response.text();
      });
  }
};

function unpackParentUrl(url: string) {
  return parseUrl(url) ?? url;
}

function parseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.substring(1));
  } catch {
    return null;
  }
}
