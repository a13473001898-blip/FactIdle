
import { computed, ref, watch } from 'vue';
// 引入数据源
import { 物品 as 物品配置, 配方, 配方类型, 配方 as 配方配置, 建筑 as 建筑配置} from '@/pei_zhi_shu_ju.js';
import { 游戏数据 } from '../../dong_tai_shu_ju.js';
import { 执行配方生产 } from '@/dong_tai_shu_ju.js';
import { 格式化数字 } from '@/gong_ju.js';


