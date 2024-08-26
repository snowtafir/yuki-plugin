import { defineConfig } from 'yunzai/rollup'
import typescript from '@rollup/plugin-typescript'
import babel from '@rollup/plugin-babel'
export default defineConfig({
  plugins: [
    babel({
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript'
      ],
      plugins: [
        [
          'module-resolver',
          {
            root: ['./'],
            alias: {
              '@': './'
            }
          }
        ]
      ]
    }),
    typescript({
      compilerOptions: {
        declaration: true,
        declarationDir: 'lib',
        outDir: 'lib'
      },
      include: ['src/**/*']
    })
  ]
})
