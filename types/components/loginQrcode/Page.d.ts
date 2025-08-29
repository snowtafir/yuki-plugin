import React from 'react';
export type LoginProps = {
    data: {
        name: string;
        url: string;
    };
};
export default function App({ data }: LoginProps): React.JSX.Element;
