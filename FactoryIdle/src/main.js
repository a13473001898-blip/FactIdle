import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import naive from 'naive-ui'

import wu_pin_chao_lian_jie from './components/tong_yong/wu_pin_chao_lian_jie.vue'
import Ke_ji_chao_lian_jie from './components/tong_yong/ke_ji_chao_lian_jie.vue'
import Pei_fang_chao_lian_jie from './components/tong_yong/pei_fang_chao_lian_jie.vue'

const app = createApp(App)

app.use(createPinia())
app.use(naive)

app.component('wu_pin_chao_lian_jie', wu_pin_chao_lian_jie)
app.component('ke_ji_chao_lian_jie', Ke_ji_chao_lian_jie)
app.component('pei_fang_chao_lian_jie', Pei_fang_chao_lian_jie)

app.mount('#app')
