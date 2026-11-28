import React from 'react';
export type VideoCommentEmote = {
    text: string;
    url: string;
    size: number;
};
export type VideoComment = {
    rpid: string;
    uname: string;
    avatar: string;
    message: string;
    emotes?: VideoCommentEmote[];
    like: number;
    ctime: number;
};
type VideoCommentsProps = {
    comments: VideoComment[];
};
declare const VideoComments: React.FC<VideoCommentsProps>;
export default VideoComments;
