import type { GoToOptions, ScreenshotOptions } from 'puppeteer';
import type * as React from 'react';

/**
 * 无头浏览器渲染函数配置参数
 */
export type RenderOptions = {
  goto?: GoToOptions;
  selector?: string;
  screenshot?: Readonly<ScreenshotOptions> & {
    encoding: 'base64';
  };
  /**
   * 是否为纯HTML模式
   * 当为true时，第一个参数将被视为HTML内容字符串而不是文件路径
   */
  isHtmlContent?: boolean;
  bufferFromEncoding?: BufferEncoding;
};

/**
 * 组件编译选项
 */
export type ComponentCreateOpsionType = {
  /**
   * 扩展路径
   */
  path?: string;
  /**
   * 生成的文件名
   */
  name?: string;
  /**
   * 是否保存并返回地址
   * 默认 true
   */
  create?: boolean;
  /**
   * server 模式
   */
  server?: boolean;
  /**
   * 可被浏览器渲染的完整组件
   */
  component?: React.ReactNode;
};

/**
 * 工程配置选项
 */
export type JSXPOptions = {
  port?: number;
  path?: string;
  host?: string;
  prefix?: string;
  statics?: string | string[];
  routes?: {
    [key: string]: {
      component?: React.ReactNode;
    };
  };
};

export type ObtainProps<T> = T extends React.FC<infer P> ? P : T extends React.ComponentClass<infer P> ? P : never;

export type RendersType = <ComponentsType extends Record<string, React.FC<any> | React.ComponentClass<any>>>(
  Components: ComponentsType
) => <TKey extends keyof ComponentsType>(
  /**
   * 组件 key
   */
  key: TKey,
  /**
   * 组件 props
   */
  options: ObtainProps<ComponentsType[TKey]>,
  /**
   * 文件名。默认为组件key
   */
  name?: string
) => Promise<false | Buffer>;
