This is required as middleware:

```
import { getBareExtensions } from '@expo/config/paths';
import fs from 'fs';

import { createFastResolver } from './createExpoMetroResolver';

  protected async startImplementationAsync(...)
    ...

    const createContext = ({
      platform,
      isServer,
      origin,
    }: {
      origin: string;
      platform: string;
      isServer?: boolean;
    }) => {
      const preferNativePlatform = platform === 'ios' || platform === 'android';
      const sourceExtsConfig = { isTS: true, isReact: true, isModern: true };
      const sourceExts = getBareExtensions([], sourceExtsConfig);

      return {
        resolveAsset: (a, b, c) => ['idk'],
        customResolverOptions: Object.create({
          environment: isServer ? 'node' : 'client',
        }),
        getPackage(packageJsonPath) {
          return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        },
        mainFields: preferNativePlatform
          ? ['react-native', 'browser', 'main']
          : isServer
          ? ['module', 'main']
          : ['browser', 'module', 'main'],
        nodeModulesPaths: ['node_modules'],
        originModulePath: origin,
        preferNativePlatform,
        sourceExts,
        unstable_enablePackageExports: false,
        externalModules: ['react', 'react/jsx-runtime'],
      };
    };

    const resolver = createFastResolver({ preserveSymlinks: false });

    middleware.use(
      '/_expo/resolve',
      async (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
        const url = req.url;
        if (!url) return next();

        const parsed = new URL(url, 'http://localhost:8081');
        const platform = parsed.searchParams.get('platform')!;
        const moduleId = parsed.searchParams.get('target')!;
        // const reqOrigin = parsed.searchParams.get('origin') || '';

        const origin = path.join(this.projectRoot, './test');

        console.log('Resolving: ', url, { platform, target: moduleId, origin });
        const context = createContext({
          platform,
          isServer: false,
          // origin: path.join(this.projectRoot, origin),
          origin,
        });
        console.log('[projectroot]', this.projectRoot);
        try {
          const metroResults = resolver(context, moduleId, platform);

          console.log('Resolved: ', metroResults);
          if (metroResults.type === 'sourceFile') {
            const result = await metro.build({
              bundleType: 'delta',
              entryFile: metroResults.filePath,
              dev: true,
              hot: false,
              minify: false,
              lazy: true,
              platform,
              excludeSource: false,
              inlineSourceMap: false,
              modulesOnly: false,
              runModule: false,
              customResolverOptions: context,
            } as any);

            if (result && result.code) {
              let source = result.code;

              // Actually export the imported file
              source += `\n\n// Make it an actual module export\n\n`;
              source += `module.exports = __r('${path.relative(this.projectRoot, metroResults.filePath)}');`;
              // source += `module.exports = __r(0);`;

              // Force-link externals into System
              source = source.replace(
                'global.$$require_external = typeof window === "undefined" ? require : function () {',
                'global.$$require_external = require ?? function () {'
              );

              // Make externals actually work
              source = source.replace(
                /_\$\$_REQUIRE\(_dependencyMap\[[0-9]+\], "(react|react\/jsx-runtime)"\)/gm,
                'global.$$require_external("$1")'
              );

              res.setHeader('Content-Type', 'text/javascript');
              return res.end(source);
            }

            return res.end('whoops');
          }
        } catch (error: any) {
          console.log('Error: ', error);

          res.statusCode = 404;
          return res.end(error.message);
        }

        return next();
      }
    );
  }
```
