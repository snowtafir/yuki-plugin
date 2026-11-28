import React from 'react';
import type { VideoComment } from '@/components/video/VideoComments';
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
export default function App({ data }: VideoPageProps): React.JSX.Element;
