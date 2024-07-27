import { exec, execSync } from 'child_process';
import { existsSync } from 'fs';
import lodash from 'lodash';
import { createRequire } from 'module';
import net from 'net';
import { join } from 'path';
import { Plugin, Redis } from 'yunzai';
import { _paths } from '../utils/paths';

const require = createRequire(import.meta.url);

declare const logger: any;
const REDIS_RESTART_KEY = 'Yz:restart';

/**
 *
 * @param port
 * @returns
 */
const isPortTaken = async port => {
  return new Promise(resolve => {
    const tester = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () =>
        tester.once('close', () => resolve(false)).close()
      )
      .listen(port)
  })
}

export default class YukiUpdate extends Plugin {
  private isUpdating: boolean = false;
  private hasUpdated: boolean = false;
  previousCommitId: string;

  constructor() {
    super();
    this.rule = [
      {
        reg: "^(#|\/)(yuki|优纪)(强制)?更新$",
        fnc: this.updateYuki.name,
      },
    ];
    this.previousCommitId = "";
  }

  /**
   * 更新优纪插件
   */
  async updateYuki(): Promise<boolean> {
    if (!this.e.isMaster) return false;

    /** 检查是否正在更新中 */
    if (this.isUpdating) {
      await this.reply("已有命令更新中..请勿重复操作");
      return;
    }

    /** 检查git安装 */
    if (!(await this.checkGitInstallation())) return;

    const isForceUpdate = this.e.msg.includes("强制");

    /** 执行更新 */
    await this.performUpdate(isForceUpdate);

    /** 是否需要重载插件 */
    if (this.hasUpdated) {
      setTimeout(() => this.restart(), 2000);
      this.e.reply("插件重载中..");
      return true;
    }

    return true;
  }


  /**
   * 执行优纪插件更新
   * @param {boolean} isForceUpdate 是否为强制更新
   * @returns
   */
  async performUpdate(isForceUpdate: boolean): Promise<boolean> {
    let command = `git -C ./plugins/${_paths.pluginName}/ pull --no-rebase`;
    if (isForceUpdate) {
      command = `git -C ./plugins/${_paths.pluginName}/ checkout . && ${command}`;
      this.e.reply("正在执行强制更新操作，请稍等");
    } else {
      this.e.reply("正在执行更新操作，请稍等");
    }
    /** 获取上次提交的commitId，用于获取日志时判断新增的更新日志 */
    this.previousCommitId = await this.getPreviousCommitId(`${_paths.pluginName}/`);
    this.isUpdating = true;
    let result = await this.executeCommand(command);
    this.isUpdating = false;

    if (result.error) {
      logger.mark(`${this.e.logFnc} 更新失败：优纪插件`);
      await this.handleUpdateError(result.error, result.stdout);
      return false;
    }

    /** 获取插件提交的最新时间 */
    let updateTime = await this.getLatestUpdateTime(`${_paths.pluginName}/`);

    if (/(Already up[ -]to[ -]date|已经是最新的)/.test(result.stdout)) {
      await this.reply(`优纪插件已经是最新版本\n最后更新时间：${updateTime}`);
    } else {
      await this.reply(`优纪插件\n最后更新时间：${updateTime}`);
      this.hasUpdated = true;
    }

    logger.mark(`${this.e.logFnc} 最后更新时间：${updateTime}`);

    return true;
  }

  /**
   * 获取上次提交的commitId
   * @param {string} pluginName 插件名称
   * @returns
   */
  async getPreviousCommitId(pluginName: string = ""): Promise<string> {
    let command = `git -C ./plugins/${pluginName}/ rev-parse --short HEAD`;

    let commitId: string = await execSync(command, { encoding: "utf-8" });
    commitId = lodash.trim(commitId);

    return commitId;
  }

  /**
   * 获取本次更新插件的最后一次提交时间
   * @param {string} pluginName 插件名称
   * @returns
   */
  async getLatestUpdateTime(pluginName: string = ""): Promise<string> {
    let command = `cd ./plugins/${pluginName}/ && git log -1 --oneline --pretty=format:"%cd" --date=format:"%m-%d %H:%M"`;

    let time: string = "";
    try {
      time = await execSync(command, { encoding: "utf-8" });
      time = lodash.trim(time);
    } catch (error) {
      logger.error(error.toString());
      time = "获取时间失败";
    }
    return time;
  }

  /**
   * 处理更新失败的相关函数
   * @param {Error} error
   * @param {string} stdout
   * @returns
   */
  async handleUpdateError(error: Error, stdout: string): Promise<void> {
    let message = "更新失败！";
    let errorMessage = error.toString();
    stdout = stdout.toString();

    if (errorMessage.includes("Timed out")) {
      let remote = errorMessage.match(/'(.+?)'/g)[0].replace(/'/g, "");
      await this.reply(message + `\n连接超时：${remote}`);
      return;
    }

    if (/Failed to connect|unable to access/g.test(errorMessage)) {
      let remote = errorMessage.match(/'(.+?)'/g)[0].replace(/'/g, "");
      await this.reply(message + `\n连接失败：${remote}`);
      return;
    }

    if (errorMessage.includes("be overwritten by merge")) {
      await this.reply(
        message +
        `存在冲突：\n${errorMessage}\n` +
        "请解决冲突后再更新，或者执行#强制更新，放弃本地修改"
      );
      return;
    }

    if (stdout.includes("CONFLICT")) {
      await this.reply([
        message + "存在冲突\n",
        errorMessage,
        stdout,
        "\n请解决冲突后再更新，或者执行#强制更新，放弃本地修改",
      ]);
      return;
    }

    await this.reply([errorMessage, stdout]);
  }

  /**
   * 异步执行git相关命令
   * @param {string} command git命令
   * @returns
   */
  async executeCommand(command: string): Promise<{ error: Error | null, stdout: string, stderr: string }> {
    return new Promise((resolve, _reject) => {
      exec(command, { windowsHide: true }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }

  /**
   * 检查git是否安装
   * @returns
   */
  async checkGitInstallation(): Promise<boolean> {
    let result = await execSync("git --version", { encoding: "utf-8" });
    if (!result || !result.includes("git version")) {
      await this.reply("请先安装git");
      return false;
    }
    return true;
  }

  /**
   * 重启优纪插件
  */
  async restart() {
    // 开始询问是否有正在运行的同实例进程
    const dir = join(process.cwd(), 'pm2.config.cjs')
    if (!existsSync(dir)) {
      // 不存在配置，错误
      this.e.reply('pm2 配置丢失')
      return
    }
    const cfg = require(dir)
    const restart_port = cfg?.restart_port || 27881
    await this.e.reply('开始执行重启，请稍等...')
    logger.mark(`${this.e.logFnc} 开始执行重启，请稍等...`)
    /**
     *
     */
    const data = JSON.stringify({
      uin: this.e?.self_id || this.e.bot.uin,
      isGroup: !!this.e.isGroup,
      id: this.e.isGroup ? this.e.group_id : this.e.user_id,
      time: new Date().getTime()
    })
    const npm = await this.checkPnpm()
    await Redis.set(REDIS_RESTART_KEY, data, { EX: 120 })

    /**
     *
     */
    if (await isPortTaken(restart_port)) {
      try {
        const result = await fetch(
          `http://localhost:${restart_port}/restart`
        ).then(res => res.text())
        if (result !== `OK`) {
          Redis.del(REDIS_RESTART_KEY)
          this.e.reply(`操作失败！`)
          logger.error(`重启失败`)
        }
      } catch (error) {
        Redis.del(REDIS_RESTART_KEY)
        this.e.reply(`操作失败！\n${error}`)
      }
    } else {
      /**
       *
       */
      try {
        exec(`${npm} run start`, { windowsHide: true }, (error, stdout, _) => {
          if (error) {
            Redis.del(REDIS_RESTART_KEY)
            this.e.reply(`操作失败！\n${error.stack}`)
            logger.error(`重启失败\n${error.stack}`)
          } else if (stdout) {
            logger.mark('重启成功，运行已由前台转为后台')
            logger.mark(`查看日志请用命令：${npm} run logs`)
            logger.mark(`停止后台运行命令：${npm} run stop`)
            process.exit()
          }
        })
      } catch (error) {
        Redis.del(REDIS_RESTART_KEY)
        this.e.reply(`操作失败！\n${error.stack ?? error}`)
      }
    }

    return true
  }

  /**
 *
 * @returns
 */
  async checkPnpm() {
    return 'npm'
  }
}

