import React from 'react';
type ContentProps = {
    data: {
        type?: string;
        pics?: Array<any>;
        title?: string;
        content?: string;
        boxGrid?: boolean;
    };
};
declare const Content: React.FC<ContentProps>;
export default Content;
