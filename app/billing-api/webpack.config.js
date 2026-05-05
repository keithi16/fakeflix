const nodeExternals = require('webpack-node-externals');
const { join } = require('path');

const root = join(__dirname, '../..');

// Exported as a function so Nx calls it with (config, { options }) and we
// receive options.watch — enabling webpack's built-in watcher when running
// through @nx/js:node in watch mode.  Without this, the webpack Observable
// completes after one build and @nx/js:node spins in an infinite kill-restart
// loop while silently dropping all app output.
module.exports = function (_config, ctx) {
  const watch = ctx?.options?.watch ?? false;
  return {
  mode: 'none',
  target: 'node',
  watch,
  entry: join(root, 'app/billing-api/main.ts'),
  output: {
    path: join(root, 'dist/app/billing-api'),
    filename: 'main.js',
    libraryTarget: 'commonjs2',
  },
  // Externalize all node_modules except @tlc/* workspace packages.
  // nodeExternals checks the import specifier (not the resolved path), so
  // @tlc/* symlinks in node_modules are treated as external by default.
  // The allowlist overrides that and lets webpack compile their .ts sources
  // into the bundle, so Node never has to resolve them at runtime.
  externals: [
    nodeExternals({
      modulesDir: join(root, 'node_modules'),
      allowlist: [/^@tlc\//],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    // Keep symlinks so the real path (outside node_modules) is used
    // when loaders decide whether to process a file.
    symlinks: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: join(root, 'app/billing-api/tsconfig.json'),
              // Type-checking runs separately via nx typecheck; transpile-only
              // keeps the build fast and avoids duplicate errors.
              transpileOnly: true,
            },
          },
        ],
        // Exclude node_modules EXCEPT @tlc/* workspace packages (their real
        // path after symlink resolution is under package/, not node_modules/).
        exclude: /node_modules/,
      },
    ],
  },
  };
};
