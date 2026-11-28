import React from 'react';
import moment from 'moment';
import { createRequire } from '@/utils/paths';

const require = createRequire(import.meta.url);
const VideoCommentsCss: string = require('./../../resources/css/video/VideoComments.css');

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

const renderCommentContent = (comment: VideoComment) => {
  const emoteMap = new Map(comment.emotes?.map(emote => [emote.text, emote] as const));

  return comment.message.split(/(\[[^\]]+\])/g).map((part, index) => {
    const emote = emoteMap.get(part);
    if (!emote) return part;

    const size = `${emote.size * 1.5}em`;
    return (
      <img key={`${part}-${index}`} className="video-comment-emote" src={emote.url} alt={emote.text} title={emote.text} style={{ width: size, height: size }} />
    );
  });
};

const VideoComments: React.FC<VideoCommentsProps> = ({ comments }) => {
  if (!comments?.length) return null;

  return (
    <>
      <link rel="stylesheet" href={VideoCommentsCss} />
      <section className="video-comments">
        <div className="video-comments-title">热门评论</div>
        <div className="video-comments-list">
          {comments.map(comment => (
            <article className="video-comment" key={comment.rpid}>
              <div className="video-comment-avatar">
                {comment.avatar ? <img src={comment.avatar} alt={`${comment.uname}的头像`} /> : <span>{comment.uname.slice(0, 1)}</span>}
              </div>
              <div className="video-comment-main">
                <div className="video-comment-meta">
                  <span className="video-comment-author">{comment.uname}</span>
                  <div className="video-comment-actions">
                    <time>{moment(comment.ctime * 1000).format('YYYY-MM-DD HH:mm')}</time>
                    <span className="video-comment-like">赞 {comment.like}</span>
                  </div>
                </div>
                <p className="video-comment-message">{renderCommentContent(comment)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
};

export default VideoComments;
