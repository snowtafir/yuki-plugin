import React from 'react';
export type VersionProps = {
    data: {
        version: string;
        data: string[];
    }[];
};
export default function App({ data }: VersionProps): React.JSX.Element;
