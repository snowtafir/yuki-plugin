export declare function getDmImg(): Promise<{
    dm_img_list: any[];
    dm_img_str: string;
    dm_cover_img_str: string;
    dm_img_inter: {
        ds: any[];
        wh: number[];
        of: number[];
    };
}>;