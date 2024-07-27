import autoExternal from 'rollup-plugin-auto-external';
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
//import { terser } from 'rollup-plugin-terser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // 当前配置文件的路径
const __dirname = path.dirname(__filename); // 当前配置文件所在的目录

/**
 *
 * @param {*} warning
 * @param {*} warn
 * @returns
 */
const onwarn = (warning, warn) => {
  // 忽略与无法解析的导入相关的警告信息
  if (warning.code === 'UNRESOLVED_IMPORT') return
  // 继续使用默认的警告处理
  warn(warning)
}

/**
 * @type {import("rollup").RollupOptions[]}
 */
export default [
  {
    input: 'index.ts',
    output: {
      dir: path.join(__dirname, 'dist'),
      preserveModules: true,
      format: 'es',
      sourcemap: false
    },
    plugins: [
      autoExternal(),
      copy({
        targets: [
          { src: 'resources/', dest: path.join(__dirname, 'dist') },
          { src: './package.json', dest: path.join(__dirname, 'dist') },
          //{ src: './tsconfig.json', dest: path.join(__dirname, 'dist') },
          { src: './README.md', dest: path.join(__dirname, 'dist') },
          { src: 'LICENSE', dest: path.join(__dirname, 'dist') },
          { src: './CHANGELOG.md', dest: path.join(__dirname, 'dist') },
          { src: './.gitignore', dest: path.join(__dirname, 'dist') },
          { src: 'defaultConfig/', dest: path.join(__dirname, 'dist') },
          { src: 'config/', dest: path.join(__dirname, 'dist') },
        ]
      }),
      json(),
      nodeResolve({
        extensions: [".js", ".jsx", ".ts", ".tsx"], //允许加载第三方模块
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true
      }),
      commonjs(),
      typescript({
        tsconfig: path.join(__dirname, 'tsconfig.json'),
        sourceMap: false,
        inlineSources: true,
        declaration: false,
        //declarationDir: path.join(__dirname, 'dist/types/'),
        composite: false,
        outDir: path.join(__dirname, 'dist')
      }),
      //terser(), //压缩代码
      //image(),
    ],
    onwarn,
    external: ['fs', 'path', 'chalk', 'module', 'yunzai','child_process','net','lodash']
  },
]

