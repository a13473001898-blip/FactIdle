<template>
  <div class="settings-container">
    <n-scrollbar style="max-height: 100%; padding-right: 12px;">
      <n-flex vertical size="large">
        
        <shu_ju_guan_li_ka_pian />

        <yu_jing_ka_pian />

        <pian_hao_ka_pian />

        <xian_shi_ka_pian />

        <div style="text-align: center; padding: 20px 0; opacity: 0.3;">
          <n-text style="font-size: 12px; font-family: monospace;">
            FACTORY IDLE - VERSION 0.4.2 ALPHA
          </n-text>
        </div>

      </n-flex>
    </n-scrollbar>
  </div>
</template>

<script setup>
import Xiang_qing_ka_pian from '../wu_pin_xi_tong/xiang_qing_ka_pian.vue';
import shu_ju_guan_li_ka_pian from './1_shu_ju_guan_li_ka_pian.vue';
import yu_jing_ka_pian from './2_yu_jing_ka_pian.vue';
import pian_hao_ka_pian from './3_pian_hao_ka_pian.vue';
import xian_shi_ka_pian from './4_xian_shi_ka_pian.vue';
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
}
</style>