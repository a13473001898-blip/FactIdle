// src/features/sheng_chan_xi_tong/index.js
import { use配方分配 } from './store_pei_fang.js';
import { use生产线系统 } from './store_xian.js';

import { use建筑调度 } from './composables/jian_zhu_diao_du.js';
import { use手动生产 } from './composables/shou_dong_sheng_chan.js';
import { use生产线管理 } from './composables/sheng_chan_xian_guan_li.js';

export {
    use配方分配,
    use生产线系统,
    use建筑调度,
    use手动生产,
    use生产线管理
};