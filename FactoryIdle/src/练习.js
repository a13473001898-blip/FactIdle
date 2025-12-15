import { computed } from "vue";
import { 查询配方分配数量, 游戏数据 } from "./dong_tai_shu_ju";
import {配置数据,物品类型, 获取所有物品列表 } from "./pei_zhi_shu_ju";
import { 配方 as 配方配置 } from "./pei_zhi_shu_ju";


const 分类名称列表 = Object.values(物品类型)
const 物品数组 = Object.values(获取所有物品列表())

const 分组后的物品列表 = computed(() => {
  
  // 1. 外层：map (加工每个分类名字)
  return 分类名称列表.map( (当前分类) => {

      // 2. 内层：filter (去所有物品里找符合条件的)
      const 物品组 = 物品数组.filter( (物品) => {
          return 物品.类型 === 当前分类; // 填空：谁等于谁？
      });

      // 3. 返回加工好的包裹 (对象)
      return {
          标题: 当前分类,
          列表: 物品组
      };
      
  });

});