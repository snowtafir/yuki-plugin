// DynamicContent.tsx
import React from 'react';
import { createRequire } from 'module';
const require = createRequire(import.meta.url)

type ContentProps = {
  data: {
    type?: string
    pics?: string[]
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
              <img key={`${index}_1`} src={item} alt=" " />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
  const contentCss = <link rel="stylesheet" href={require('./../../resources/css/dynamic/Content.css')} />
  const boxGrid = data.boxGrid && (<link key="0" rel="stylesheet" href={require('./../../resources/css/dynamic/Content.box.grid.css')} />)
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
            {picItems}
            <div className="content-text" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
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
