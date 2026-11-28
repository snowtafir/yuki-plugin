import React from 'react';
import Account from '@/components/dynamic/Account';
import Footer from '@/components/dynamic/Footer';
import VideoComments from '@/components/video/VideoComments';
import type { VideoComment } from '@/components/video/VideoComments';
import { createRequire } from '@/utils/paths';

const require = createRequire(import.meta.url);
const MainPageCss: string = require('./../../resources/css/dynamic/MainPage.css');
const VideoPageCss: string = require('./../../resources/css/video/VideoPage.css');

export type VideoStat = {
  label: string;
  value: string;
};

export type VideoPageProps = {
  data: {
    appName: 'bilibili';
    face?: string;
    pendant?: string;
    name?: string;
    pubTs: string;
    category: string;
    title: string;
    cover?: string;
    bvid: string;
    tname: string;
    pubTime: string;
    duration: string;
    copyright: string;
    desc?: string;
    stats: VideoStat[];
    comments: VideoComment[];
    urlImgData: string;
    created: string;
  };
};

export default function App({ data }: VideoPageProps) {
  return (
    <>
      <link rel="stylesheet" href={MainPageCss} />
      <link rel="stylesheet" href={VideoPageCss} />
      <div className="outside-border">
        <div className="container">
          <Account data={data} />
          <div className="dynamic-article-page-main unfold">
            <div className="video-page">
              <h1 className="video-title">{data.title}</h1>
              <div className="video-subline">
                <span>{data.bvid}</span>
                <span>{data.tname}</span>
              </div>

              {data.cover && (
                <div className="video-cover">
                  <img src={data.cover} alt={data.title} />
                </div>
              )}

              <div className="video-meta">
                <span>{data.pubTime}</span>
                <span>时长 {data.duration}</span>
                <span>{data.copyright}</span>
              </div>

              <div className="video-stats">
                {data.stats.map(stat => (
                  <div className="video-stat" key={stat.label}>
                    <span className="video-stat-value">{stat.value}</span>
                    <span className="video-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>

              {data.desc && (
                <section className="video-description">
                  <div className="video-description-title">视频简介</div>
                  <div className="video-description-content">{data.desc}</div>
                </section>
              )}

              <VideoComments comments={data.comments} />
            </div>
          </div>
          <Footer data={data} />
        </div>
      </div>
    </>
  );
}
