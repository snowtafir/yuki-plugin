class MurmurHash3 {
    static x64Add = function (m, n) {
        m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
        n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
        var o = [0, 0, 0, 0];
        o[3] += m[3] + n[3];
        o[2] += o[3] >>> 16;
        o[3] &= 0xffff;
        o[2] += m[2] + n[2];
        o[1] += o[2] >>> 16;
        o[2] &= 0xffff;
        o[1] += m[1] + n[1];
        o[0] += o[1] >>> 16;
        o[1] &= 0xffff;
        o[0] += m[0] + n[0];
        o[0] &= 0xffff;
        return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
    };
    static x64Multiply = function (m, n) {
        m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
        n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
        var o = [0, 0, 0, 0];
        o[3] += m[3] * n[3];
        o[2] += o[3] >>> 16;
        o[3] &= 0xffff;
        o[2] += m[2] * n[3];
        o[1] += o[2] >>> 16;
        o[2] &= 0xffff;
        o[2] += m[3] * n[2];
        o[1] += o[2] >>> 16;
        o[2] &= 0xffff;
        o[1] += m[1] * n[3];
        o[0] += o[1] >>> 16;
        o[1] &= 0xffff;
        o[1] += m[2] * n[2];
        o[0] += o[1] >>> 16;
        o[1] &= 0xffff;
        o[1] += m[3] * n[1];
        o[0] += o[1] >>> 16;
        o[1] &= 0xffff;
        o[0] += m[0] * n[3] + m[1] * n[2] + m[2] * n[1] + m[3] * n[0];
        o[0] &= 0xffff;
        return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
    };
    static x64Rotl = function (m, n) {
        n %= 64;
        if (n === 32) {
            return [m[1], m[0]];
        }
        else if (n < 32) {
            return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))];
        }
        else {
            n -= 32;
            return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))];
        }
    };
    static x64LeftShift = function (m, n) {
        n %= 64;
        if (n === 0) {
            return m;
        }
        else if (n < 32) {
            return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n];
        }
        else {
            return [m[1] << (n - 32), 0];
        }
    };
    static x64Xor = function (m, n) {
        return [m[0] ^ n[0], m[1] ^ n[1]];
    };
    static x64Fmix = function (h) {
        h = MurmurHash3.x64Xor(h, [0, h[0] >>> 1]);
        h = MurmurHash3.x64Multiply(h, [0xff51afd7, 0xed558ccd]);
        h = MurmurHash3.x64Xor(h, [0, h[0] >>> 1]);
        h = MurmurHash3.x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53]);
        h = MurmurHash3.x64Xor(h, [0, h[0] >>> 1]);
        return h;
    };
    static x64hash128 = function (key, seed) {
        key = key || '';
        seed = seed || 0;
        var remainder = key.length % 16;
        var bytes = key.length - remainder;
        var h1 = [0, seed];
        var h2 = [0, seed];
        var k1 = [0, 0];
        var k2 = [0, 0];
        var c1 = [0x87c37b91, 0x114253d5];
        var c2 = [0x4cf5ad43, 0x2745937f];
        for (var i = 0; i < bytes; i += 16) {
            k1 = [
                (key.charCodeAt(i + 4) & 0xff) |
                    ((key.charCodeAt(i + 5) & 0xff) << 8) |
                    ((key.charCodeAt(i + 6) & 0xff) << 16) |
                    ((key.charCodeAt(i + 7) & 0xff) << 24),
                (key.charCodeAt(i) & 0xff) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24)
            ];
            k2 = [
                (key.charCodeAt(i + 12) & 0xff) |
                    ((key.charCodeAt(i + 13) & 0xff) << 8) |
                    ((key.charCodeAt(i + 14) & 0xff) << 16) |
                    ((key.charCodeAt(i + 15) & 0xff) << 24),
                (key.charCodeAt(i + 8) & 0xff) |
                    ((key.charCodeAt(i + 9) & 0xff) << 8) |
                    ((key.charCodeAt(i + 10) & 0xff) << 16) |
                    ((key.charCodeAt(i + 11) & 0xff) << 24)
            ];
            k1 = MurmurHash3.x64Multiply(k1, c1);
            k1 = MurmurHash3.x64Rotl(k1, 31);
            k1 = MurmurHash3.x64Multiply(k1, c2);
            h1 = MurmurHash3.x64Xor(h1, k1);
            h1 = MurmurHash3.x64Rotl(h1, 27);
            h1 = MurmurHash3.x64Add(h1, h2);
            h1 = MurmurHash3.x64Add(MurmurHash3.x64Multiply(h1, [0, 5]), [0, 0x52dce729]);
            k2 = MurmurHash3.x64Multiply(k2, c2);
            k2 = MurmurHash3.x64Rotl(k2, 33);
            k2 = MurmurHash3.x64Multiply(k2, c1);
            h2 = MurmurHash3.x64Xor(h2, k2);
            h2 = MurmurHash3.x64Rotl(h2, 31);
            h2 = MurmurHash3.x64Add(h2, h1);
            h2 = MurmurHash3.x64Add(MurmurHash3.x64Multiply(h2, [0, 5]), [0, 0x38495ab5]);
        }
        k1 = [0, 0];
        k2 = [0, 0];
        switch (remainder) {
            case 15:
                k2 = MurmurHash3.x64Xor(k2, MurmurHash3.x64LeftShift([0, String(key).charCodeAt(i + 14)], 48));
            case 14:
                k2 = MurmurHash3.x64Xor(k2, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 13)], 40));
            case 13:
                k2 = MurmurHash3.x64Xor(k2, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 12)], 32));
            case 12:
                k2 = MurmurHash3.x64Xor(k2, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 11)], 24));
            case 11:
                k2 = MurmurHash3.x64Xor(k2, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 10)], 16));
            case 10:
                k2 = MurmurHash3.x64Xor(k2, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 9)], 8));
            case 9:
                k2 = MurmurHash3.x64Xor(k2, [0, key.charCodeAt(i + 8)]);
                k2 = MurmurHash3.x64Multiply(k2, c2);
                k2 = MurmurHash3.x64Rotl(k2, 33);
                k2 = MurmurHash3.x64Multiply(k2, c1);
                h2 = MurmurHash3.x64Xor(h2, k2);
            case 8:
                k1 = MurmurHash3.x64Xor(k1, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 7)], 56));
            case 7:
                k1 = MurmurHash3.x64Xor(k1, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 6)], 48));
            case 6:
                k1 = MurmurHash3.x64Xor(k1, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 5)], 40));
            case 5:
                k1 = MurmurHash3.x64Xor(k1, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 4)], 32));
            case 4:
                k1 = MurmurHash3.x64Xor(k1, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 3)], 24));
            case 3:
                k1 = MurmurHash3.x64Xor(k1, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 2)], 16));
            case 2:
                k1 = MurmurHash3.x64Xor(k1, MurmurHash3.x64LeftShift([0, key.charCodeAt(i + 1)], 8));
            case 1:
                k1 = MurmurHash3.x64Xor(k1, [0, key.charCodeAt(i)]);
                k1 = MurmurHash3.x64Multiply(k1, c1);
                k1 = MurmurHash3.x64Rotl(k1, 31);
                k1 = MurmurHash3.x64Multiply(k1, c2);
                h1 = MurmurHash3.x64Xor(h1, k1);
        }
        h1 = MurmurHash3.x64Xor(h1, [0, key.length]);
        h2 = MurmurHash3.x64Xor(h2, [0, key.length]);
        h1 = MurmurHash3.x64Add(h1, h2);
        h2 = MurmurHash3.x64Add(h2, h1);
        h1 = MurmurHash3.x64Fmix(h1);
        h2 = MurmurHash3.x64Fmix(h2);
        h1 = MurmurHash3.x64Add(h1, h2);
        h2 = MurmurHash3.x64Add(h2, h1);
        return (('00000000' + (h1[0] >>> 0).toString(16)).slice(-8) +
            ('00000000' + (h1[1] >>> 0).toString(16)).slice(-8) +
            ('00000000' + (h2[0] >>> 0).toString(16)).slice(-8) +
            ('00000000' + (h2[1] >>> 0).toString(16)).slice(-8));
    };
}
function gen_buvid_fp(browserData) {
    const components = [
        { key: 'userAgent', value: browserData.userAgent },
        { key: 'webdriver', value: browserData.webdriver },
        { key: 'language', value: browserData.language },
        { key: 'colorDepth', value: browserData.colorDepth },
        { key: 'deviceMemory', value: browserData.deviceMemory },
        { key: 'pixelRatio', value: browserData.pixelRatio },
        { key: 'hardwareConcurrency', value: browserData.hardwareConcurrency },
        { key: 'screenResolution', value: browserData.screenResolution },
        { key: 'availableScreenResolution', value: browserData.availableScreenResolution },
        { key: 'timezoneOffset', value: browserData.timezoneOffset },
        { key: 'timezone', value: browserData.timezone },
        { key: 'sessionStorage', value: browserData.sessionStorage ? 1 : 0 },
        { key: 'localStorage', value: browserData.localStorage ? 1 : 0 },
        { key: 'indexedDb', value: browserData.indexedDb ? 1 : 0 },
        { key: 'addBehavior', value: browserData.addBehavior ? 1 : 0 },
        { key: 'openDatabase', value: browserData.openDatabase ? 1 : 0 },
        { key: 'cpuClass', value: browserData.cpuClass },
        { key: 'platform', value: browserData.platform },
        { key: 'doNotTrack', value: browserData.doNotTrack },
        { key: 'plugins', value: browserData.plugins.map(p => p.name).join(',') },
        { key: 'canvas', value: browserData.canvas },
        { key: 'webgl', value: browserData.webgl },
        { key: 'webglVendorAndRenderer', value: browserData.webglVendorAndRenderer },
        { key: 'adBlock', value: browserData.adBlock ? 1 : 0 },
        { key: 'hasLiedLanguages', value: browserData.hasLiedLanguages ? 1 : 0 },
        { key: 'hasLiedResolution', value: browserData.hasLiedResolution ? 1 : 0 },
        { key: 'hasLiedOs', value: browserData.hasLiedOs ? 1 : 0 },
        { key: 'hasLiedBrowser', value: browserData.hasLiedBrowser ? 1 : 0 },
        { key: 'touchSupport', value: browserData.touchSupport },
        { key: 'fonts', value: browserData.fonts.map(f => f.replace(/\s+/g, '')).join(',') },
        { key: 'fontsFlash', value: browserData.hasLiedOs ? browserData.fonts.map(f => f.replace(/\s+/g, '')).join(',') : 'flash not installed' },
        { key: 'audio', value: browserData.audio },
        { key: 'enumerateDevices', value: browserData.enumerateDevices.map(f => f.replace(/\s+/g, '')).join(',') }
    ];
    const values = components.map(component => component.value).join('~~~');
    const fingerprint = MurmurHash3.x64hash128(values, 31);
    return fingerprint;
}

export { gen_buvid_fp };
