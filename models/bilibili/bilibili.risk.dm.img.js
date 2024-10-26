async function getDmImg() {
    const dm_img_list = [];
    const dm_img_str = 'V2ViR0wgMS';
    const dm_cover_img_str = 'QU5HTEUgKEludGVsLCBJbnRlbChSKSBIRCBHcmFwaGljcyBEaXJlY3QzRDExIHZzXzVfMCBwc181XzApLCBvciBzaW1pbGFyR29vZ2xlIEluYy4gKEludGVsKQ';
    const dm_img_inter = { ds: [], wh: [0, 0, 0], of: [0, 0, 0] };
    return {
        dm_img_list: dm_img_list,
        dm_img_str: dm_img_str,
        dm_cover_img_str: dm_cover_img_str,
        dm_img_inter: dm_img_inter
    };
}

export { getDmImg };
