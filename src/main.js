import { Client, Loader, createLogin, Processor } from 'yunzai'
setTimeout(async () => {
  await createLogin()
  await Client.run().then(async () => {
    // 读取yunzai.config.js
    await Processor.install()
    await Loader.load()
  })
}, 0)
