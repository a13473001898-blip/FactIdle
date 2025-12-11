<template>
    <n-collapse :default-expanded-names="['资源','原材料','零部件','建筑']">

        <n-collapse-item
            v-for="组 in 分组后的物品列表"
            :key="组.标题"
            :title="组.标题"
            :name="组.标题"
        >

            <n-flex>
                <wu_pin_ka_pian
                    v-for="物品 in 组.列表"
                    :key="物品.id"
                    :id="物品.id"
                    class="物品卡片"
                    :名称="物品.名称"
                    @action="点击物品卡片(物品.id)"
                    />
            </n-flex>

        </n-collapse-item>

    </n-collapse>
</template>

<script setup>
import { computed } from 'vue';
import Wu_pin_ka_pian from './wu_pin_ka_pian.vue';
import { 物品类型, 获取所有物品列表 } from '@/pei_zhi_shu_ju';

const emit = defineEmits(['发送物品id'])

const 点击物品卡片 = (id) => {
    emit('发送物品id',id)
}

const 分类名称列表 = Object.values(物品类型)
const 物品数组 = Object.values(获取所有物品列表())

const 分组后的物品列表 = computed(() => {
  return 分类名称列表.map( (当前分类) => {
      const 物品组 = 物品数组.filter( (物品) => {
          return 物品.类型 === 当前分类; 
      });
      return {
          标题: 当前分类,
          列表: 物品组
      };
  });
});

</script>

<style scoped>
/* 当卡片被点击时，稍微缩小一点点，模拟按压效果 */
.物品卡片:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}
</style>