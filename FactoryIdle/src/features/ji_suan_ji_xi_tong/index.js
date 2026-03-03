// src/features/ji_suan_ji_xi_tong/index.js
import Ji_suan_ji_mian_ban from './components/ji_suan_ji_mian_ban.vue';
import { use计算机系统 } from './store.js';
import { use硬件调度 } from './composables/ying_jian_diao_du.js';
import { use算力监控 } from './composables/suan_li_jian_kong.js';

export {
    Ji_suan_ji_mian_ban,
    use计算机系统,
    use硬件调度,
    use算力监控
};