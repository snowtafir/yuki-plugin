import React from 'react';
export type HelpPageProps = {
    data: {
        group: string;
        list: {
            icon: string;
            title: string;
            desc: string;
        }[];
    }[];
};
export default function App({ data }: HelpPageProps): React.JSX.Element;
