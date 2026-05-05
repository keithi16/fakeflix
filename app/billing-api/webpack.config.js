const { composePlugins, withNx } = require('@nx/webpack');
const nodeExternals = require('webpack-node-externals');
const { join } = require('path');

const root = join(__dirname, '../..');

// withNx() drives most of the config from project.json:
//   - ts-loader (compiler: tsc) for TypeScript bundling.
//   - Skips ForkTsCheckerWebpackPlugin in TS-solution mode (typecheck is
//     delegated to the dedicated `nx typecheck` target — `typeCheckOptions:
//     false` in project.json reinforces this).
//
// What we override below:
//   1. externals: webpack-node-externals with an explicit allowlist for all
//      `@tlc/*` packages (including subpath exports). withNx() builds an
//      allowlist via `getNonBuildableLibs`, but that helper only expands
//      `package.json#exports` for *direct* deps — transitive non-buildable
//      libs (e.g. `@tlc/shared-lib/common` used through `@tlc/identity`)
//      are listed as bare package names, leaving subpath imports external
//      and breaking at runtime. Explicit `^@tlc/` patterns sidestep that bug.
//   2. resolve.conditionNames: ensure webpack picks the `@tlc/source` export
//      condition declared by each workspace package, so non-buildable libs
//      are bundled from their TypeScript sources.
//   3. ts-loader compilerOptions: emit CommonJS for the bundle. The tsconfig
//      stays on `moduleResolution: bundler` + `customConditions` (required so
//      typecheck honors the `@tlc/source` condition), but at bundling time we
//      need CJS output so TypeORM bidirectional entity decorators (e.g.
//      Video <-> VideoMetadata @OneToOne) don't trip TDZ on harmony imports
//      during circular module init.
module.exports = composePlugins(withNx(), (config) => {
  config.externals = [
    nodeExternals({
      modulesDir: join(root, 'node_modules'),
      allowlist: [/^@tlc\//],
    }),
  ];

  config.resolve = {
    ...config.resolve,
    conditionNames: ['@tlc/source', 'node', 'require', 'default'],
  };

  for (const rule of config.module?.rules ?? []) {
    if (typeof rule.loader === 'string' && rule.loader.includes('ts-loader')) {
      rule.options = {
        ...rule.options,
        compilerOptions: {
          ...(rule.options?.compilerOptions ?? {}),
          module: 'commonjs',
          moduleResolution: 'node10',
          customConditions: undefined,
        },
      };
    }
  }

  return config;
});
