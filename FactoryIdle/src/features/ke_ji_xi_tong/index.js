// ke_ji_xi_tong/index.js
import ke_ji_lan from './components/ke_ji_lan.vue';
import ke_ji_xiang_qing from './components/ke_ji_xiang_qing.vue';
import ke_ji_ka_pian from './components/ke_ji_ka_pian.vue';
import { use科技系统 } from './store.js';

// 暴露对外 UI 组件
export { ke_ji_lan, ke_ji_xiang_qing, ke_ji_ka_pian };

// 暴露对外 Store Hook
export { use科技系统 };