class Murmur3 {
  static MOD = 1n << 64n;
  static C1 = 0x87c37b91114253d5n;
  static C2 = 0x4cf5ad432745937fn;
  static C3 = 0x52dce729n;
  static C4 = 0x38495ab5n;
  static R1 = 27n;
  static R2 = 31n;
  static R3 = 33n;
  static M = 5n;

  static hash(source, seed) {
    let h1 = BigInt(seed);
    let h2 = BigInt(seed);
    let processed = 0;

    for (let i = 0; i < source.length; i += 16) {
      const chunk = source.slice(i, i + 16);
      processed += chunk.length;
      if (chunk.length === 16) {
        const k1 = BigInt(chunk.slice(0, 8).reduce((acc, val, idx) => acc | (BigInt(val) << BigInt(8 * idx)), 0n));
        const k2 = BigInt(chunk.slice(8).reduce((acc, val, idx) => acc | (BigInt(val) << BigInt(8 * idx)), 0n));
        h1 ^= (Murmur3.rotateLeft((k1 * Murmur3.C1) % Murmur3.MOD, Murmur3.R2) * Murmur3.C2) % Murmur3.MOD;
        h1 = ((Murmur3.rotateLeft(h1, Murmur3.R1) + h2) * Murmur3.M + Murmur3.C3) % Murmur3.MOD;
        h2 ^= (Murmur3.rotateLeft((k2 * Murmur3.C2) % Murmur3.MOD, Murmur3.R3) * Murmur3.C1) % Murmur3.MOD;
        h2 = ((Murmur3.rotateLeft(h2, Murmur3.R2) + h1) * Murmur3.M + Murmur3.C4) % Murmur3.MOD;
      } else {
        let k1 = 0n;
        let k2 = 0n;
        for (let j = 0; j < chunk.length; j++) {
          const byteVal = BigInt(chunk[j]);
          if (j < 8) {
            k1 |= byteVal << BigInt(8 * j);
          } else {
            k2 |= byteVal << BigInt(8 * (j - 8));
          }
        }
        k1 = (Murmur3.rotateLeft((k1 * Murmur3.C1) % Murmur3.MOD, Murmur3.R2) * Murmur3.C2) % Murmur3.MOD;
        h1 ^= k1;
        h2 ^= (Murmur3.rotateLeft((k2 * Murmur3.C2) % Murmur3.MOD, Murmur3.R3) * Murmur3.C1) % Murmur3.MOD;
      }
    }

    h1 ^= BigInt(processed);
    h2 ^= BigInt(processed);
    h1 = (h1 + h2) % Murmur3.MOD;
    h2 = (h2 + h1) % Murmur3.MOD;
    h1 = Murmur3.fmix64(h1);
    h2 = Murmur3.fmix64(h2);
    h1 = (h1 + h2) % Murmur3.MOD;
    h2 = (h2 + h1) % Murmur3.MOD;

    return (h2 << BigInt(64)) | h1;
  }

  static rotateLeft(x, k) {
    const index = Number(k);
    const binStr = x.toString(2).padStart(64, '0');
    return BigInt(`0b${binStr.slice(index)}${binStr.slice(0, index)}`);
  }

  static fmix64(k) {
    const C1 = 0xff51afd7ed558ccdn;
    const C2 = 0xc4ceb9fe1a85ec53n;
    const R = 33;
    let tmp = k;
    tmp ^= tmp >> BigInt(R);
    tmp = (tmp * C1) % Murmur3.MOD;
    tmp ^= tmp >> BigInt(R);
    tmp = (tmp * C2) % Murmur3.MOD;
    tmp ^= tmp >> BigInt(R);
    return tmp;
  }
}

function gen_buvid_fp(uuid: any, seed: any) {
  const source = new TextEncoder().encode(uuid);
  const m = Murmur3.hash(source, seed);
  return `${(m & (Murmur3.MOD - 1n)).toString(16)}${(m >> 64n).toString(16)}`;
}

export { gen_buvid_fp };
