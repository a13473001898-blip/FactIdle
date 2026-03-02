import { defineStore } from 'pinia'

export const use殖民地系统 = defineStore('zhi_min_di', {
  state: () => ({
    当前视角ID: 'main_base',
    // 已发现的殖民地列表
    列表: [
      {
        id: 'main_base',
        名称: '初始着陆点',
        // 环境属性：1.0 为标准值
        环境: {
          太阳能强度: 1.0,
          风力等级: 1.0
        },
        // 资源丰度：影响矿机产出倍率
        资源丰度: {
          tie_kuang: 1.0,
          tong_kuang: 1.0,
          mei_tan: 1.0,
          shi_tou: 1.0
        }
      },
      {
        id: 'two',
        名称: '测试',
        // 环境属性：1.0 为标准值
        环境: {
          太阳能强度: 1.0,
          风力等级: 1.0
        },
        // 资源丰度：影响矿机产出倍率
        资源丰度: {
          tie_kuang: 5.0,
          tong_kuang: 5.0,
          mei_tan: 5.0,
          shi_tou: 5.0
        }
      }
    ]
  }),

  actions: {
    切换视角(id) {
      this.当前视角ID = id
    },

    获取殖民地配置(id) {
      return this.列表.find(c => c.id === id)
    },

    /**
     * 由雷达系统触发的新殖民地生成逻辑
     */
    发现新殖民地(配置) {
      this.列表.push(配置)
    },

    // ================= 存档接口 =================
    导出数据() {
      return this.$state;
    },
    导入数据(存档数据, 版本号) {
      if (存档数据) this.$patch(存档数据);
    },
  }
})