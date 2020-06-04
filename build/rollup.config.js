import path from 'path';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import glsl from './rollup-plugin-glsl';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import url from 'postcss-url';
const { BUILD, MINIFY } = process.env;
const minified = MINIFY === 'true';
const production = BUILD === 'production';
const outputFile = !production
  ? 'packages/g-webgpu/dist/gwebgpu-dev.js'
  : minified
    ? 'packages/g-webgpu/dist/gwebgpu.js'
    : 'packages/g-webgpu/dist/gwebgpu-dev.js';
function resolveFile(filePath) {
  return path.join(__dirname, '..', filePath);
}

module.exports = [
  {
    input: resolveFile('build/bundle.ts'),
    output: {
      file: resolveFile(outputFile),
      format: 'umd',
      name: 'GWebGPU',
    },
    treeshake: minified,
    plugins: [
      alias(
        {
          resolve: [ '.tsx', '.ts' ],
          entries: [
            {
              find: /^@antv\/g-webgpu-(.*)/,
              replacement: resolveFile('packages/$1/src'),
            },
            {
              find: /^@antv\/g-webgpu$/,
              replacement: resolveFile('packages/g-webgpu/src'),
            }
          ]
        }
      ),
      resolve({
        browser: true,
        preferBuiltins: false,
        extensions: [ '.js', '.ts' ]
      }),
      glsl(
        [ '**/*.glsl' ],
        true
      ),
      json(),
      postcss({
        extract: false,
        plugins: [
          url({ url: 'inline' })
        ]
      }),
      // @see https://github.com/rollup/rollup-plugin-node-resolve#using-with-rollup-plugin-commonjs
      commonjs({
        namedExports: {
          // @see https://github.com/rollup/rollup-plugin-commonjs/issues/266
          lodash: [
            'isNil',
            'uniq',
            'clamp',
            'isObject',
            'isFunction',
            'cloneDeep',
            'concat',
            'isString',
            'isNumber',
            'merge',
            'isFinite',
            'isBoolean',
            'isTypedArray'
          ]
        }
      }),
      typescript(),
      // babel({
      //   extensions: [ '.js', '.ts' ]
      // }),
      minified ? terser() : false,
      analyze({
        summaryOnly: true,
        limit: 20
      })
    ]
  }
];