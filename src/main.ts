import { Client, createLogin, Processor } from 'yunzaijs';
setTimeout(async () => {
  // 登录
  await createLogin();
  // 运行
  await Client.run().then(async () => {
    // 读取yunzai.config.js
    await Processor.install('yunzaijs.config.ts');
  });
});
