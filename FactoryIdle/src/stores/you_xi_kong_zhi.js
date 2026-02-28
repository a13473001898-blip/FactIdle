import { defineStore } from 'pinia';

export const use游戏控制 = defineStore('you_xi_kong_zhi', {
    state: () => ({
        暂停: false,
        计算面板显示: false // 👈 新增：控制右侧计算中心抽屉的开关
    }),
    actions: {
        切换暂停状态() {
            this.暂停 = !this.暂停;
        },
        打开计算面板() {
            this.计算面板显示 = true;
        },
        关闭计算面板() {
            this.计算面板显示 = false;
        }
    }
});