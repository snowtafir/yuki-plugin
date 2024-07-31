// DynamicContent.tsx
import React from 'react';
import { createRequire } from 'module';
const require = createRequire(import.meta.url)

type ContentProps = {
  data: {
    type?: string
    pics?: Array<any>
    title?: string
    content?: string
    boxGrid?: boolean
  }
}

const Content: React.FC<ContentProps> = ({ data }) => {
  const picItems = data.pics && (
    <div className='pic-content'>
      {data.pics.map((item: any, index: number) => {
        if (item) {
          return (
            <div className="pic-item" key={`${index}_0`}>
              <img key={`${index}_1`} src={item?.url} alt=" " />
            </div>
          );
        }
        return null;
      })}
    </div>
  );

  /**动态宫格样式 */
  function getBoxGridStyle(pics: Array<any>) {
    if (!Array.isArray(pics) || pics.length === 0) {
      return null;
    }
    if (pics.length <= 1) {
      return null;
    }

    if (pics.length === 2) {
      for (const item of pics) {
        if (item.width === undefined || item.height === undefined) {
          continue;
        }
        if (item.width / item.height <= 0.5) {
          return null;
        }
      }
      for (const item of pics) {
        if (item.width === undefined) {
          continue;
        }
        if (item.width > 1240) {
          return null;
        }
      }
      return boxGrid_4;
    }

    if (pics.length >= 3) {
      for (const item of pics) {
        if (item.width === undefined || item.height === undefined) {
          continue;
        }
        if (item.width / item.height <= 0.5) {
          return null;
        }
      }
      for (const item of pics) {
        if (item.width === undefined) {
          continue;
        }
        if (item.width > 1240) {
          return null;
        }
      }
      const maxWidth = Math.max(...pics.map(item => item.width));
      if (maxWidth > 550 && maxWidth <= 1240) {
        return boxGrid_4;
      }
      return boxGrid_9;
    }

    return null;
  }
  const boxGrid = data.boxGrid && (data.pics && getBoxGridStyle(data.pics));
  const boxGrid_4 = <link key="0" rel="stylesheet" href={require('./../../resources/css/dynamic/Content.box.grid.4.css')} />
  const boxGrid_9 = <link key="0" rel="stylesheet" href={require('./../../resources/css/dynamic/Content.box.grid.9.css')} />
  const contentCss = <link rel="stylesheet" href={require('./../../resources/css/dynamic/Content.css')} />
  switch (data.type) {
    case 'DYNAMIC_TYPE_LIVE_RCMD':
      return (
        <>
          {contentCss}
          {boxGrid}
          <div className="content">
            {picItems}
            {data.title && <h1>{data.title}</h1>}
          </div>
        </>
      )
    case 'DYNAMIC_TYPE_AV':
      return (
        <>
          {contentCss}
          {boxGrid}
          <div className="content">
            {picItems}
            <div className="content-text-title" style={{ marginBottom: '10px' }}>
              {data.title && <h1>{data.title}</h1>}
            </div>
            <div className="content-text" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
          </div>
        </>
      )
    case 'DYNAMIC_TYPE_WORD':
      return (
        <>
          {contentCss}
          {boxGrid}
          <div className="content">
            <div className="content-text" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
            {picItems}
          </div>
        </>
      )
    case 'DYNAMIC_TYPE_DRAW':
      return (
        <>
          {contentCss}
          {boxGrid}
          <div className="content">
            <div className="content-text" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
            {picItems}
          </div>
        </>
      )
    case 'DYNAMIC_TYPE_ARTICLE':
      return (
        <>
          {contentCss}
          {boxGrid}
          <div className="content">
            <div className="content-text-title" style={{ marginBottom: '10px' }}>
              {data.title && <h1>{data.title}</h1>}
            </div>
            <div className="content-text" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
            {picItems}
          </div>
        </>
      )
    default:
      return (
        <>
          {contentCss}
          {boxGrid}
          <div className="content">
            {data.title && <h1>{data.title}</h1>}
            <div className="content-text" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
            {picItems}
          </div>
        </>
      )
  }
}

export default Content
