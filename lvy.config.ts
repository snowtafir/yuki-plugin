import { defineConfig } from 'lvyjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const includes = (value: string) => process.argv.includes(value);
const jsxp = () => import('jsxp').then(res => res.createServer());
const useYunzaiJS = async () => {
  const { Client, createLogin, Processor } = await import('yunzaijs');
  setTimeout(async () => {
    await createLogin();
    Client.run()
      .then(() => Processor.install(['yunzai.config.ts', 'yunzai.config.json']))
      .catch(console.error);
  }, 0);
};
export default defineConfig({
  plugins: [
    () => {
      if (includes('--yunzai')) return useYunzaiJS;
      if (includes('--view')) return jsxp;
    }
  ],
  build: {
    typescript: {
      // 打包时移除注释，如果需要其他配置，参考typeScript库的 CompilerOptions
      removeComments: false
    }
  },
  alias: {
    entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
  }
});
