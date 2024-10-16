import { defineConfig } from 'lvyjs';
import { alias, files } from 'lvyjs/plugins';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'jsxp';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  plugins: [
    {
      name: 'yunzaijs',
      callback: async () => {
        if (process.argv.includes('--yunzai')) {
          const { Client, createLogin, Processor } = await import('yunzaijs');
          setTimeout(async () => {
            await createLogin();
            Client.run()
              .then(() => Processor.install(['yunzai.config.ts', 'yunzai.config.json']))
              .catch(console.error);
          }, 0);
        }
      }
    },
    {
      name: 'jsxp',
      callback: async () => {
        if (process.argv.includes('--view')) createServer();
      }
    }
  ],
  build: {
    plugins: [
      alias({
        entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
      }),
      files({ filter: /\.(png|jpg|jpeg|gif|svg)$/ })
    ]
  }
});
