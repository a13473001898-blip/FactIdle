<template>
  <n-card title="💾 数据管理" segmented>
    <div class="section-title">本地存档 (浏览器缓存)</div>
    <n-space size="large" style="margin-bottom: 24px;">
      <n-button type="primary" @click="触发存档">
        <template #icon><span>💾</span></template>
        保存当前进度
      </n-button>
      
      <n-button type="info" ghost @click="触发读档">
        载入本地存档
      </n-button>
      
      <n-popconfirm @positive-click="触发删档">
        <template #trigger>
          <n-button type="error" quaternary size="small">抹除所有数据</n-button>
        </template>
        确定要删除所有工业进度吗？此操作不可撤销，系统将重置并刷新。
      </n-popconfirm>
    </n-space>

    <n-divider />

    <div class="section-title">数据传输 (存档字符串)</div>
    <n-space vertical>
      <n-input
        v-model:value="存档代码"
        type="textarea"
        placeholder="在此粘贴存档代码进行导入，或点击下方按钮导出当前进度..."
        :autosize="{ minRows: 3, maxRows: 6 }"
        style="font-family: monospace; font-size: 12px;"
      />
      <n-flex>
        <n-button size="small" @click="执行导出">生成导出代码</n-button>
        <n-button size="small" type="warning" @click="执行导入" :disabled="!存档代码">
          执行数据导入
        </n-button>
      </n-flex>
      <n-text depth="3" style="font-size: 12px;">
        * 提示：您可以将导出的代码复制到记事本中妥善保管。
      </n-text>
    </n-space>
  </n-card>
</template>

<script setup>
import { ref } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { 存档, 读档, 删除存档 } from '@/cun_du_dang.js'; //

const message = useMessage();
const dialog = useDialog();
const 存档代码 = ref('');

// --- 本地操作 ---
const 触发存档 = () => {
  if (存档()) message.success('进度已安全保存至本地'); //
  else message.error('存档失败，请检查浏览器存储权限'); //
};

const 触发读档 = () => {
  if (读档()) message.success('已恢复至上次保存的进度'); //
  else message.error('未发现可用的本地存档'); //
};

const 触发删档 = () => {
  删除存档(); //
  message.warning('数据已清除，正在重启初始化...');
  setTimeout(() => window.location.reload(), 1000);
};

// --- 导入导出逻辑 ---
const 执行导出 = () => {
  // 先执行一次本地存档，确保数据是最新的
  存档(); //
  const rawData = localStorage.getItem('存档字符串'); //
  if (rawData) {
    // 使用 btoa 转成 Base64 方便玩家复制，不至于满屏幕乱码
    存档代码.value = btoa(encodeURIComponent(rawData));
    message.info('导出代码已生成，请手动复制');
  }
};

const 执行导入 = () => {
  dialog.warning({
    title: '确认导入',
    content: '导入外部存档将覆盖您当前的本地进度，是否继续？',
    positiveText: '确定覆盖',
    negativeText: '取消',
    onPositiveClick: () => {
      try {
        // 先解密外部代码
        const decodedData = decodeURIComponent(atob(存档代码.value));
        
        // 尝试走一次不落盘（不写入 localStorage）的试运行
        const 读档成功 = 读档(decodedData);
        
        if (读档成功) {
          // 只有试运行没抛出异常，才真正覆盖玩家的本地备份
          localStorage.setItem('存档字符串', decodedData);
          message.success('外部存档导入成功并已应用！');
          存档代码.value = '';
        } else {
          message.error('存档损坏，已回滚。');
        }
      } catch (e) {
        message.error('无效的存档代码，请确保代码完整且未被篡改');
      }
    }
  });
};
</script>

<style scoped>
.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #666;
  margin-bottom: 12px;
}
</style>