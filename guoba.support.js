/**
 * Guoba Plugin 支持模块
 * 为 yuki-plugin 提供网页配置界面支持
 */

import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import lodash from 'lodash';
import Config from './utils/config.js';
import { _paths } from './utils/paths.js';

const icon_path = path.join(_paths.pluginPath, 'resources/img/icon/puplic/flower_1.png');
/**
 * 获取 Guoba 配置文件路径
 * 保存到 data/yuki-plugin/config/{app}/config.guoba.support.yaml
 */
function getGuobaConfigPath(appDir) {
  return path.join(_paths.botYukiData, 'config', appDir, 'config.guoba.support.yaml');
}

/**
 * 读取 Guoba 配置文件
 */
function readGuobaConfig(appDir) {
  try {
    const guobaPath = getGuobaConfigPath(appDir);
    if (!fs.existsSync(guobaPath)) {
      return null;
    }
    const content = fs.readFileSync(guobaPath, 'utf8');
    return YAML.parse(content);
  } catch (error) {
    console.error(`[Guoba] 读取配置文件失败 [${appDir}]:`, error);
    return null;
  }
}

/**
 * 保存 Guoba 配置文件
 */
function saveGuobaConfig(appDir, data) {
  try {
    const guobaPath = getGuobaConfigPath(appDir);
    console.log(`[Guoba] 准备保存配置文件: ${guobaPath}`);

    const dir = path.dirname(guobaPath);
    if (!fs.existsSync(dir)) {
      console.log(`[Guoba] 创建目录: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }

    const yamlContent = YAML.stringify(data);
    fs.writeFileSync(guobaPath, yamlContent, 'utf8');
    console.log(`[Guoba] 配置文件保存成功: ${guobaPath}`);
    return true;
  } catch (error) {
    console.error(`[Guoba] 保存配置文件失败 [${appDir}]:`, error);
    return false;
  }
}

/**
 * 导出 Guoba 支持函数
 */
export function supportGuoba() {
  return {
    // 插件信息
    pluginInfo: {
      name: 'yuki-plugin',
      title: '优纪插件',
      author: ['@snowtafir'],
      authorLink: ['https://github.com/snowtafir'],
      link: 'https://github.com/snowtafir/yuki-plugin',
      isV3: true,
      isV2: false,
      description: '一个适用于 Yunzai 系列机器人框架的B站动态、微博动态订阅推送和B站视频链接解析的插件',
      //icon: 'mdi:twitter-retweet',
      //iconColor: '#d19f56'
      iconPath: icon_path
    },

    // 配置项信息
    configInfo: {
      schemas: [
        // ==================== B站推送设置 ====================
        {
          component: 'Divider',
          label: 'B站推送设置'
        },
        {
          field: 'bilibili.pushStatus',
          label: 'B站推送状态',
          bottomHelpMessage: 'B站推送任务状态，1开启 0关闭，该项重启后生效',
          component: 'Select',
          required: true,
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择B站推送状态'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.checkDynamicCD',
          label: 'B站定时任务',
          bottomHelpMessage: '检测B站推送定时任务，Cron表达式，该项重启后生效',
          component: 'EasyCron',
          required: true,
          defaultValue: '*/23  * * * *'
        },
        {
          field: 'bilibili.userAgentList',
          label: 'User-Agent列表',
          bottomHelpMessage: '请求头 User-Agent 列表，出现风控时可更换',
          component: 'GTags',
          componentProps: {
            placeholder: '请输入 User-Agent',
            allowAdd: true,
            allowDel: true
          },
          defaultValue: ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36']
        },
        {
          field: 'bilibili.dynamicTimeRange',
          label: '动态时间范围',
          bottomHelpMessage: '筛选何时发布的动态，单位为秒，默认7200秒(2小时)',
          component: 'InputNumber',
          required: true,
          componentProps: {
            min: 3600,
            max: 36000,
            placeholder: '请输入动态时间范围(秒)'
          },
          defaultValue: 7200
        },
        {
          field: 'bilibili.getDataRandomDelay',
          label: '获取数据随机延时',
          bottomHelpMessage: '顺序检测相邻up主动态的最大随机间隔时间(毫秒)，默认8000',
          component: 'InputNumber',
          required: true,
          componentProps: {
            min: 4000,
            max: 60000,
            placeholder: '请输入随机延时(毫秒)'
          },
          defaultValue: 8000
        },
        {
          field: 'bilibili.pushTransmit',
          label: '推送转发动态',
          bottomHelpMessage: '全部订阅的转发动态是否推送，1开启 0关闭',
          component: 'Select',
          required: true,
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择是否推送转发动态'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.pushMsgMode',
          label: 'B站推送消息模式',
          bottomHelpMessage: '设置B站动态推送消息模式，0文字模式 1图片模式',
          component: 'Select',
          required: true,
          componentProps: {
            options: [
              { label: '文字模式', value: 0 },
              { label: '图片模式', value: 1 }
            ],
            placeholder: '请选择推送消息模式'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.isSplit',
          label: 'B站分片截图模式',
          bottomHelpMessage: '启用将推送每条动态的全部内容，不启用则只推送固定高度的动态卡片',
          component: 'Select',
          componentProps: {
            options: [
              { label: '关闭分片截图', value: 0 },
              { label: '开启分片截图', value: 1 }
            ],
            placeholder: '请选择是否开启分片截图'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.boxGrid',
          label: '九宫格样式',
          bottomHelpMessage: '是否启用九宫格样式，1启用 0不启用',
          component: 'Select',
          componentProps: {
            options: [
              { label: '不启用', value: 0 },
              { label: '启用', value: 1 }
            ],
            placeholder: '请选择是否启用九宫格'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.noSplitHeight',
          label: '非分片截图高度',
          bottomHelpMessage: '关闭分片截图时的截图高度(px)，默认7500',
          component: 'InputNumber',
          componentProps: {
            min: 1000,
            max: 20000,
            placeholder: '请输入截图高度(px)'
          },
          defaultValue: 7500
        },
        {
          field: 'bilibili.splitHeight',
          label: '分片截图高度',
          bottomHelpMessage: '启用分片截图时每片的高度(px)，默认8000',
          component: 'InputNumber',
          componentProps: {
            min: 1000,
            max: 20000,
            placeholder: '请输入分片高度(px)'
          },
          defaultValue: 8000
        },
        {
          field: 'bilibili.isPauseGif',
          label: '暂停GIF动图',
          bottomHelpMessage: '渲染动态内容时是否暂停GIF动图，1是 0否',
          component: 'Select',
          componentProps: {
            options: [
              { label: '不暂停', value: 0 },
              { label: '暂停', value: 1 }
            ],
            placeholder: '请选择是否暂停GIF'
          },
          defaultValue: 0
        },
        {
          field: 'bilibili.forwardSendDynamic',
          label: '合并转发动态',
          bottomHelpMessage: '动态过长或图片过多时是否以转发形式发送，1开启 0关闭',
          component: 'Select',
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择是否合并转发'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.mergeTextPic',
          label: '文字图片合并发送',
          bottomHelpMessage: '文字模式时，文字消息与图片是否合并发送，1合并 0不合并',
          component: 'Select',
          componentProps: {
            options: [
              { label: '不合并', value: 0 },
              { label: '合并', value: 1 }
            ],
            placeholder: '请选择是否合并发送'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.liveAtAll',
          label: '直播动态@全体成员',
          bottomHelpMessage: '直播动态是否@全体成员，需机器人有管理员权限',
          component: 'Select',
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择是否@全体成员'
          },
          defaultValue: 0
        },
        {
          field: 'bilibili.liveAtAllCD',
          label: '@全体成员冷却时间',
          bottomHelpMessage: '直播动态@全体成员的冷却时间(秒)，默认1800(30分钟)',
          component: 'InputNumber',
          componentProps: {
            min: 60,
            max: 86400,
            placeholder: '请输入冷却时间(秒)'
          },
          defaultValue: 1800
        },
        {
          field: 'bilibili.parseVideoLink',
          label: '视频链接解析',
          bottomHelpMessage: 'B站视频链接解析开关，1开启 0关闭',
          component: 'Select',
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择是否开启解析'
          },
          defaultValue: 1
        },
        {
          field: 'bilibili.banWords',
          label: '屏蔽关键词',
          bottomHelpMessage: '包含这些关键词的动态不推送，每行一个关键词',
          component: 'GTags',
          componentProps: {
            placeholder: '请输入屏蔽关键词',
            allowAdd: true,
            allowDel: true
          },
          defaultValue: []
        },

        // ==================== 微博推送设置 ====================
        {
          component: 'Divider',
          label: '微博推送设置'
        },
        {
          field: 'weibo.pushStatus',
          label: '微博推送状态',
          bottomHelpMessage: '微博推送任务状态，1开启 0关闭，该项重启后生效',
          component: 'Select',
          required: true,
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择微博推送状态'
          },
          defaultValue: 1
        },
        {
          field: 'weibo.checkDynamicCD',
          label: '微博定时任务',
          bottomHelpMessage: '检测微博推送定时任务，Cron表达式，该项重启后生效',
          component: 'EasyCron',
          required: true,
          defaultValue: '*/23  * * * *'
        },
        {
          field: 'weibo.userAgentList',
          label: 'User-Agent列表',
          bottomHelpMessage: '请求头 User-Agent 列表',
          component: 'GTags',
          componentProps: {
            placeholder: '请输入 User-Agent',
            allowAdd: true,
            allowDel: true
          },
          defaultValue: [
            'Mozilla/5.0 (Linux;u;Android 4.2.2;zh-cn;) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile Safari/10600.6.3 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
            'Mozilla/5.0 (iPhone;CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1 (compatible; Baiduspider-render/2.0; +http://www.baidu.com/search/spider.html)',
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36 Edg/143.0.0.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          ]
        },
        {
          field: 'weibo.dynamicTimeRange',
          label: '动态时间范围',
          bottomHelpMessage: '筛选何时发布的动态，单位为秒，默认7200秒(2小时)',
          component: 'InputNumber',
          required: true,
          componentProps: {
            min: 3600,
            max: 36000,
            placeholder: '请输入动态时间范围(秒)'
          },
          defaultValue: 7200
        },
        {
          field: 'weibo.pushTransmit',
          label: '推送转发动态',
          bottomHelpMessage: '全部订阅的转发动态是否推送，1开启 0关闭',
          component: 'Select',
          required: true,
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择是否推送转发动态'
          },
          defaultValue: 1
        },
        {
          field: 'weibo.pushMsgMode',
          label: '微博推送消息模式',
          bottomHelpMessage: '设置微博动态推送消息模式，0文字模式 1图片模式',
          component: 'Select',
          required: true,
          componentProps: {
            options: [
              { label: '文字模式', value: 0 },
              { label: '图片模式', value: 1 }
            ],
            placeholder: '请选择推送消息模式'
          },
          defaultValue: 1
        },
        {
          field: 'weibo.isSplit',
          label: '微博分片截图模式',
          bottomHelpMessage: '启用将推送每条动态的全部内容，不启用则只推送固定高度的动态卡片',
          component: 'Select',
          componentProps: {
            options: [
              { label: '关闭分片截图', value: 0 },
              { label: '开启分片截图', value: 1 }
            ],
            placeholder: '请选择是否开启分片截图'
          },
          defaultValue: 1
        },
        {
          field: 'weibo.boxGrid',
          label: '九宫格样式',
          bottomHelpMessage: '是否启用九宫格样式，1启用 0不启用',
          component: 'Select',
          componentProps: {
            options: [
              { label: '不启用', value: 0 },
              { label: '启用', value: 1 }
            ],
            placeholder: '请选择是否启用九宫格'
          },
          defaultValue: 1
        },
        {
          field: 'weibo.noSplitHeight',
          label: '非分片截图高度',
          bottomHelpMessage: '关闭分片截图时的截图高度(px)，默认7500',
          component: 'InputNumber',
          componentProps: {
            min: 1000,
            max: 20000,
            placeholder: '请输入截图高度(px)'
          },
          defaultValue: 7500
        },
        {
          field: 'weibo.splitHeight',
          label: '分片截图高度',
          bottomHelpMessage: '启用分片截图时每片的高度(px)，默认8000',
          component: 'InputNumber',
          componentProps: {
            min: 1000,
            max: 20000,
            placeholder: '请输入分片高度(px)'
          },
          defaultValue: 8000
        },
        {
          field: 'weibo.isPauseGif',
          label: '暂停GIF动图',
          bottomHelpMessage: '渲染动态内容时是否暂停GIF动图，1是 0否',
          component: 'Select',
          componentProps: {
            options: [
              { label: '不暂停', value: 0 },
              { label: '暂停', value: 1 }
            ],
            placeholder: '请选择是否暂停GIF'
          },
          defaultValue: 0
        },
        {
          field: 'weibo.forwardSendDynamic',
          label: '合并转发动态',
          bottomHelpMessage: '动态过长或图片过多时是否以转发形式发送，1开启 0关闭',
          component: 'Select',
          componentProps: {
            options: [
              { label: '关闭', value: 0 },
              { label: '开启', value: 1 }
            ],
            placeholder: '请选择是否合并转发'
          },
          defaultValue: 1
        },
        {
          field: 'weibo.mergeTextPic',
          label: '文字图片合并发送',
          bottomHelpMessage: '文字模式时，文字消息与图片是否合并发送，1合并 0不合并',
          component: 'Select',
          componentProps: {
            options: [
              { label: '不合并', value: 0 },
              { label: '合并', value: 1 }
            ],
            placeholder: '请选择是否合并发送'
          },
          defaultValue: 1
        },
        {
          field: 'weibo.banWords',
          label: '屏蔽关键词',
          bottomHelpMessage: '包含这些关键词的动态不推送，每行一个关键词',
          component: 'GTags',
          componentProps: {
            placeholder: '请输入屏蔽关键词',
            allowAdd: true,
            allowDel: true
          },
          defaultValue: []
        }
      ],

      // 获取配置数据方法
      getConfigData() {
        const models = ['bilibili', 'weibo'];
        const data = {};

        for (const model of models) {
          // 优先读取 Guoba 配置
          const guobaConfig = readGuobaConfig(model);
          if (guobaConfig) {
            data[model] = guobaConfig;
          } else {
            // 否则使用默认配置
            data[model] = Config.getDefaultConfig(model, 'config');
          }
        }

        return data;
      },

      // 设置配置的方法
      setConfigData(data, { Result }) {
        const models = ['bilibili', 'weibo'];

        try {
          console.log('[Guoba] 开始保存配置，接收到的数据:', JSON.stringify(data, null, 2));

          for (const model of models) {
            // 收集该模型的所有配置项
            const configData = {};
            const prefix = `${model}.`;

            for (const key in data) {
              if (key.startsWith(prefix)) {
                const fieldKey = key.substring(prefix.length);
                configData[fieldKey] = data[key];
              }
            }

            console.log(`[Guoba] ${model} 需要保存的配置:`, JSON.stringify(configData, null, 2));

            // 如果有配置数据需要保存
            if (Object.keys(configData).length > 0) {
              // 读取现有配置
              let existingConfig = readGuobaConfig(model);
              if (!existingConfig) {
                console.log(`[Guoba] ${model} 没有现有 Guoba 配置，使用默认配置`);
                existingConfig = Config.getDefaultConfig(model, 'config');
              }

              // 合并配置
              const mergedConfig = lodash.merge({}, existingConfig, configData);
              console.log(`[Guoba] ${model} 合并后的配置:`, JSON.stringify(mergedConfig, null, 2));

              const saveResult = saveGuobaConfig(model, mergedConfig);
              console.log(`[Guoba] ${model} 保存结果:`, saveResult);
            } else {
              console.log(`[Guoba] ${model} 没有需要保存的配置`);
            }
          }

          return Result.ok({}, '保存成功~');
        } catch (error) {
          console.error('[Guoba] 保存配置失败:', error);
          return Result.error('保存配置失败: ' + error.message);
        }
      }
    }
  };
}
