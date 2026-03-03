// src/shared/constants.js

export const 全局常量 = {
    /** 初始默认的殖民地/基地 ID */
    初始基地ID: 'main_base',
    
    /** 散装机器所在的默认生产线 ID */
    默认产线ID: 'default',
    
    /** 用于绕过本地库存，直接扣除/增加全网云端建筑的虚拟 ID */
    云端库存ID: 'cloud_item_dummy_cid'
};

/**
 * 机器与生产线的运行状态枚举
 */
export const 运行状态 = {
    运行: '运行',
    停止: '停止'
};