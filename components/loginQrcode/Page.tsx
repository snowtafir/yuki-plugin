// QrcodeLoginPage.tsx
import React from 'react';
import { _paths, createRequire } from '@/utils/paths';

const require = createRequire(import.meta.url);

const LoginQrcodeCss: string = require('./../../resources/css/loginQrcode/Page.css')

export type LoginProps = {
  data: {
    url: string,
  };
}

export default function App({ data }: LoginProps) {
  return (
    <>
      <link rel="stylesheet" href={LoginQrcodeCss} />
      <div className='container w-96 max-h-96 m-auto text-lg p-5'>
        <div className="txt-0 text-center mt-3 mb-3 p-1 text-blue-500" >
          Created By yuki-plugin<br />扫码登录B站获取CK
        </div>
        <div className="QrCode m-auto">
          <img className="qr-code w-72 h-72 ml-7" src={data.url} alt="二维码" />
        </div>
        <div className="txt-1 text-center mt-3 mb-3 p-1 text-red-600">
          免责声明：bot仅提供功能。<br />如果不良使用行为导致账号出问题的请自行承担后果。
        </div>
      </div>
    </>
  );
};
