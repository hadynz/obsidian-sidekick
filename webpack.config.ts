import path from 'path';
import pack from './package.json';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { type Configuration, DefinePlugin } from 'webpack';

const isProduction = process.env.NODE_ENV === 'production';

const config: Configuration = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
    clean: true,
  },
  target: 'node',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.(svg|njk|html)$/,
        type: 'asset/source',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif)$/i,
        type: 'asset/inline',
      },
    ],
  },
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        minify: TerserPlugin.uglifyJsMinify,
        terserOptions: {},
      }),
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: './manifest.json', to: '.' }],
    }),
    new DefinePlugin({
      PACKAGE_NAME: JSON.stringify(pack.name),
      VERSION: JSON.stringify(pack.version),
      PRODUCTION: JSON.stringify(isProduction),
    }),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.tsx', '.js'],
    mainFields: ['browser', 'module', 'main'],
  },
  externals: {
    obsidian: 'commonjs2 obsidian',
    '@codemirror/view': 'commonjs2 @codemirror/view',
    '@codemirror/state': 'commonjs2 @codemirror/state',
    '@codemirror/rangeset': 'commonjs2 @codemirror/rangeset',
    'webworker-threads': 'require(webworker-threads)',
  },
};

export default config;
