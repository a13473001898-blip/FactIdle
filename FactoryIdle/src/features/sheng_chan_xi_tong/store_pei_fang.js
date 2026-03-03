// src/stores/pei_fang_fen_pei.js
import { defineStore } from 'pinia'
import { 获取建筑数据 } from '@/shared/pei_zhi_shu_ju.js'
import { 引擎信号 } from '@/core/quan_ju_xin_hao'
import { 读取cid } from '@/shared/gong_ju.js'
import { 全局常量 } from '@/shared/constants';

/** * @typedef {import('./types').MachineAllocation} MachineAllocation */

function 配方分配数据模板(状态 = '运行') {
  return { 数量: 0, 状态: 状态 }
}


export const use配方分配 = defineStore('pei_fang_fen_pei', {
  state: () => ({
    // 结构: { colonyId: { lineId: { 配方id: { 建筑id: { 数量, 状态 } } } } }
    // 'default' 为无 CPU 时的默认散装主线程
    /** @type {Record<string, any>} */
    数据: {
      [全局常量.初始基地ID]: {
        [全局常量.默认产线ID]: {}
      }
    }
  }),

  actions: {
    // ================= 查询接口 (读操作，保持宽容) =================

    // 获取该星球所有生产线的数据总集（供结算引擎外层循环使用）
    查询殖民地全部(colonyId) {
      return this.数据[读取cid(colonyId)] || {}
    },

    // 获取特定生产线的数据
    查询生产线(lineId = 全局常量.默认产线ID, colonyId) {
      return this.数据[读取cid(colonyId)]?.[lineId] || {}
    },

    查询建筑(lineId = 全局常量.默认产线ID, 配方id, colonyId) {
      return this.数据[读取cid(colonyId)]?.[lineId]?.[配方id] || {}
    },

    查询分配数量(lineId = 全局常量.默认产线ID, 配方id, 建筑id, colonyId) {
      return this.数据[读取cid(colonyId)]?.[lineId]?.[配方id]?.[建筑id]?.数量 || 0
    },

    查询建筑状态(lineId = 全局常量.默认产线ID, 配方id, 建筑id, colonyId) {
      return this.数据[读取cid(colonyId)]?.[lineId]?.[配方id]?.[建筑id]?.状态 || '运行'
    },

    // 跨生产线全局查询（用于计算星球总能耗等全局指标）
    查询指定能源类型建筑(能源类型, colonyId) {
      const cid = 读取cid(colonyId)
      const 结果 = {}
      const 本地所有线 = this.数据[cid] || {}

      for (const lineId in 本地所有线) {
        const 生产线数据 = 本地所有线[lineId]
        for (const 配方ID in 生产线数据) {
          for (const 建筑ID in 生产线数据[配方ID]) {
            const 建筑数据 = 获取建筑数据(建筑ID)
            if (建筑数据 && 建筑数据.能源类型 === 能源类型) {
              const 分配状态 = 生产线数据[配方ID][建筑ID]
              if (!结果[建筑ID]) 结果[建筑ID] = { 运行数量: 0, 停止数量: 0, 能耗: 建筑数据.能耗 || 0 }

              if (分配状态.状态 === '运行') {
                结果[建筑ID].运行数量 += 分配状态.数量
              } else {
                结果[建筑ID].停止数量 += 分配状态.数量
              }
            }
          }
        }
      }
      return 结果
    },

    // ================= 操作接口 (写操作，实行暴政) =================

    初始化配方分配数据(lineId, 配方id = null, 建筑id = null, colonyId) {
      if (!colonyId) {
        console.error('🚨 [致命防御] 初始化配方分配失败：未提供 colonyId！')
        return
      }
      const cid = colonyId
      if (!this.数据[cid]) this.数据[cid] = {}
      if (!this.数据[cid][lineId]) this.数据[cid][lineId] = {}
      if (配方id && !this.数据[cid][lineId][配方id]) this.数据[cid][lineId][配方id] = {}
      if (配方id && 建筑id && !this.数据[cid][lineId][配方id][建筑id]) {
        this.数据[cid][lineId][配方id][建筑id] = 配方分配数据模板()
      }
    },

    _增加数量(lineId = 全局常量.默认产线ID, 配方id, 建筑id, 数量, colonyId) {
      const cid = colonyId
      this.初始化配方分配数据(lineId, 配方id, 建筑id, cid)
      this.数据[cid][lineId][配方id][建筑id].数量 += 数量
      引擎信号.需要重新结算 = true
    },

    _减少数量(lineId = 全局常量.默认产线ID, 配方id, 建筑id, 数量, colonyId) {
      const cid = colonyId
      if (!this.数据[cid]?.[lineId]?.[配方id]?.[建筑id]) return

      this.数据[cid][lineId][配方id][建筑id].数量 -= 数量
      if (this.数据[cid][lineId][配方id][建筑id].数量 <= 0) {
        delete this.数据[cid][lineId][配方id][建筑id]
      }
      引擎信号.需要重新结算 = true
    },

    _切换状态(lineId = 全局常量.默认产线ID, 配方id, 建筑id, colonyId) {
      const cid = colonyId
      const 建筑数据 = this.数据?.[cid]?.[lineId]?.[配方id]?.[建筑id]
      if (!建筑数据) return
      建筑数据.状态 = 建筑数据.状态 === '运行' ? '停止' : '运行'
      引擎信号.需要重新结算 = true
    },

    _删除生产线(lineId, colonyId) {
      const cid = colonyId
      if (this.数据[cid] && this.数据[cid][lineId]) {
        delete this.数据[cid][lineId]
        引擎信号.需要重新结算 = true
      }
    },

    初始化新殖民地(cid) {
      if (!cid) return
      if (!this.数据[cid]) this.数据[cid] = { [全局常量.默认产线ID]: {} }
    },

    // ================= 存档接口 (包含热迁移机制) =================
    导出数据() { return this.$state },
    导入数据(存档数据) {
      if (!存档数据 || !存档数据.数据) return

      const 迁移后数据 = {}
      // 检查是否是老版本二维结构，如果是，自动全部塞入 [全局常量.默认产线ID] 中转正
      for (const cid in 存档数据.数据) {
        const 殖民地内容 = 存档数据.数据[cid]
        if (殖民地内容 && !殖民地内容.default && Object.keys(殖民地内容).length > 0 && !Object.keys(殖民地内容)[0].startsWith('line_')) {
          迁移后数据[cid] = { [全局常量.默认产线ID]: 殖民地内容 }
        } else {
          迁移后数据[cid] = 殖民地内容
        }
      }
      this.数据 = 迁移后数据
    }
  }
})