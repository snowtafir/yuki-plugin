import React from 'react';
type AccountProps = {
    data: {
        appName: string;
        face?: string;
        pendant?: string;
        name?: string;
        pubTs?: any;
        category?: string;
    };
};
declare const Account: React.FC<AccountProps>;
export default Account;
