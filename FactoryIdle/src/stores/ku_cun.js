import { defineStore } from 'pinia'
import { 获取物品数据 } from '@/pei_zhi_shu_ju.js'
import { use殖民地系统 } from './zhi_min_di_xi_tong'

export const use库存 = defineStore('ku_cun', {
  state: () => ({
    // 结构：{ 殖民地ID: { 物品ID: 数量 } }
    本地数据: {
      'main_base': { mei_tan: 500 }
    },

    // 结构：{ 物品ID: 数量 }
    // 存储所有“建筑”和“计算机硬件”
    云端数据: {
      kuang_ji: 10,
      shi_lu: 10,
      guo_lu: 5,
      shi_yan_shi: 5
    }
  }),

  actions: {
    // 内部私有辅助：路由判断
    _isGlobalItem(id) {
      const 物品 = 获取物品数据(id)
      if (!物品) return false
      return 物品.类型 === '建筑' || 物品.类型 === '计算机硬件'
    },

    _getColonyIdForRead(colonyId) {
      if (colonyId) return colonyId;
      const 殖民地系统 = use殖民地系统()
      return colonyId || 殖民地系统.当前视角ID
    },

    // ================= 查询接口 =================

    查询库存(id, colonyId) {
      if (this._isGlobalItem(id)) {
        return this.云端数据[id] || 0
      }
      const cid = this._getColonyIdForRead(colonyId)
      return this.本地数据[cid]?.[id] || 0
    },

    库存检查(输入数组, 倍率 = 1, colonyId) {
      if (!输入数组 || 输入数组.length === 0) return true
      for (const 输入 of 输入数组) {
        if (this.查询库存(输入.id, colonyId) < 输入.数量 * 倍率) return false
      }
      return true
    },

    // ================= 操作接口 =================

    库存增加(id, 数量, colonyId) {
      if (数量 <= 0) return

      if (this._isGlobalItem(id)) {
        this.云端数据[id] = (this.云端数据[id] || 0) + 数量
      } else {
        if (!colonyId) {
          console.error(`🚨 [致命防御] 尝试【增加】本地物品 [${id}] 的库存，但未明确指定 colonyId！已拦截。`);
          return;
        }
        const cid = colonyId
        if (!this.本地数据[cid]) this.本地数据[cid] = {}
        this.本地数据[cid][id] = (this.本地数据[cid][id] || 0) + 数量
      }
    },

    库存减少(id, 数量, colonyId) {
      if (数量 <= 0) return false

      if (this._isGlobalItem(id)) {
        const 目标库 = this.云端数据
        if (!目标库 || (目标库[id] || 0) < 数量) return false
        目标库[id] -= 数量
        return true
      } else {
        if (!colonyId) {
          console.error(`🚨 [致命防御] 尝试【扣除】本地物品 [${id}] 的库存，但未明确指定 colonyId！已拦截。`);
          return false;
        }
        const cid = colonyId;
        const 目标库 = this.本地数据[cid]
        if (!目标库 || (目标库[id] || 0) < 数量) return false
        目标库[id] -= 数量
        return true
      }
    },
    /**
         * 直接覆盖库存的数量
         */
    覆盖库存(id, 数量, colonyId) {
      if (this._isGlobalItem(id)) {
        this.云端数据[id] = 数量
      } else {
        // 🚨 强校验防火墙
        if (!colonyId) {
          console.error(`🚨 [致命防御] 尝试【覆盖】本地物品 [${id}] 的库存，但未明确指定 colonyId！已拦截。`);
          return;
        }
        const cid = colonyId;
        if (!this.本地数据[cid]) this.本地数据[cid] = {}
        this.本地数据[cid][id] = 数量
      }
    },

    初始化新殖民地(colonyId) {
      if (!colonyId) {
        console.error(`🚨 [致命防御] 初始化新殖民地失败：未提供 colonyId！`);
        return;
      }
      if (!this.本地数据[colonyId]) {
        this.本地数据[colonyId] = {}
      }
    },
    // ================= 存档接口 =================
    导出数据() {
      return {
        本地数据: this.本地数据,
        云端数据: this.云端数据
      };
    },

    导入数据(存档数据, 版本号) {
      if (!存档数据) return;
      // 兼容老版本坏档数据（如果玩家之前存进去了 undefined）
      if (存档数据.本地数据) this.本地数据 = 存档数据.本地数据;
      if (存档数据.云端数据) this.云端数据 = 存档数据.云端数据;
    }
  }
})