/**获取dm参数 */
export async function getDmImg() {
  const dm_img_list = `[]`;
  //Buffer.from("WebGL 1", 'utf-8').toString("base64") //webgl version的值 WebGL 1 的base64 编码
  const dm_img_str = 'V2ViR0wgMS';
  //webgl unmasked renderer的值拼接webgl unmasked vendor的值的base64编码
  const dm_cover_img_str = 'QU5HTEUgKEludGVsLCBJbnRlbChSKSBIRCBHcmFwaGljcyBEaXJlY3QzRDExIHZzXzVfMCBwc181XzApLCBvciBzaW1pbGFyR29vZ2xlIEluYy4gKEludGVsKQ';
  const dm_img_inter = `{ds:[],wh:[0,0,0],of:[0,0,0]}`;
  return {
    dm_img_list: dm_img_list,
    dm_img_str: dm_img_str,
    dm_cover_img_str: dm_cover_img_str,
    dm_img_inter: dm_img_inter
  };
}
