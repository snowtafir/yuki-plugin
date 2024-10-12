import React from 'react';
export type MainProps = {
    data: {
        appName: string;
        boxGrid?: boolean;
        type?: string;
        face?: string;
        pendant?: string;
        name?: string;
        pubTs: any;
        title?: string;
        content?: string;
        urlImgData?: string;
        created?: any;
        pics?: Array<any>;
        category?: string;
        orig?: {
            data?: {
                type?: string;
                face?: string;
                pendant?: string;
                name?: string;
                pubTs?: any;
                title?: string;
                content?: string;
                urlImgData?: string;
                created?: any;
                pics?: string[];
                category?: string;
            };
        };
    };
};
export default function App({ data }: MainProps): React.JSX.Element;
