// src/features/wu_pin_xi_tong/index.js
import wu_pin_ka_pian from './components/wu_pin_ka_pian.vue';
import wu_pin_lan from './components/wu_pin_lan.vue';
import wu_pin_xiang_qing from './components/wu_pin_xiang_qing.vue';
import xiang_qing_ka_pian from './components/xiang_qing_ka_pian.vue';



import { use库存 } from './store.js';

// 暴露对外 UI 组件
export { wu_pin_lan, wu_pin_xiang_qing, wu_pin_ka_pian,xiang_qing_ka_pian };

// 暴露对外 Store Hook
export { use库存 };