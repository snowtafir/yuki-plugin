import { defineConfig } from 'lvyjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  plugins: [
    {
      name: 'yunzaijs',
      useApp: async () => {
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
      useApp: async () => {
        if (process.argv.includes('--view')) {
          const { createServer } = await import('jsxp');
          createServer();
        }
      }
    }
  ],
  build: {
    alias: {
      entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
    }
  }
});
