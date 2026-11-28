import React from 'react';
import moment from 'moment';
import { createRequire } from '../../utils/paths.js';

const require$1 = createRequire(import.meta.url);
const VideoCommentsCss = require$1('./../../resources/css/video/VideoComments.css');
const renderCommentContent = (comment) => {
    const emoteMap = new Map(comment.emotes?.map(emote => [emote.text, emote]));
    return comment.message.split(/(\[[^\]]+\])/g).map((part, index) => {
        const emote = emoteMap.get(part);
        if (!emote)
            return part;
        const size = `${emote.size * 1.5}em`;
        return (React.createElement("img", { key: `${part}-${index}`, className: "video-comment-emote", src: emote.url, alt: emote.text, title: emote.text, style: { width: size, height: size } }));
    });
};
const VideoComments = ({ comments }) => {
    if (!comments?.length)
        return null;
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: VideoCommentsCss }),
        React.createElement("section", { className: "video-comments" },
            React.createElement("div", { className: "video-comments-title" }, "\u70ED\u95E8\u8BC4\u8BBA"),
            React.createElement("div", { className: "video-comments-list" }, comments.map(comment => (React.createElement("article", { className: "video-comment", key: comment.rpid },
                React.createElement("div", { className: "video-comment-avatar" }, comment.avatar ? React.createElement("img", { src: comment.avatar, alt: `${comment.uname}的头像` }) : React.createElement("span", null, comment.uname.slice(0, 1))),
                React.createElement("div", { className: "video-comment-main" },
                    React.createElement("div", { className: "video-comment-meta" },
                        React.createElement("span", { className: "video-comment-author" }, comment.uname),
                        React.createElement("div", { className: "video-comment-actions" },
                            React.createElement("time", null, moment(comment.ctime * 1000).format('YYYY-MM-DD HH:mm')),
                            React.createElement("span", { className: "video-comment-like" },
                                "\u8D5E ",
                                comment.like))),
                    React.createElement("p", { className: "video-comment-message" }, renderCommentContent(comment))))))))));
};

export { VideoComments as default };
