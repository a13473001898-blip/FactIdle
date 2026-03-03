// src/composables/sheng_chan_xian_diao_du.js
import { use生产线系统 } from '@/stores/sheng_chan_xian_xi_tong.js'
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js'
import { useMessage } from 'naive-ui'

export function use生产线调度() {
  const 生产线系统 = use生产线系统()
  const 配方分配 = use配方分配()
  const message = useMessage()

  // 导出全中文结构蓝图
  const 导出生产线蓝图 = (lineId, cid) => {
    if (!cid || !lineId) return null

    const 产线基本信息 = 生产线系统.数据[cid]?.find(l => l.id === lineId)
    if (!产线基本信息) {
      message.error('未找到该生产线信息')
      return null
    }

    const 机器分配数据 = 配方分配.查询生产线(lineId, cid)

    const 蓝图对象 = {
      版本: '1.0',
      类型: '生产线蓝图',
      名称: 产线基本信息.名称,
      目标物品ID: 产线基本信息.目标物品ID,
      配方结构: 机器分配数据
    }

    return JSON.stringify(蓝图对象)
  }

  // 预留位置：后续需要实现带有“物理机器退回仓库”逻辑的安全删除
  const 安全删除生产线 = (lineId, cid) => {
    // 1. 查出这条线占用的所有机器
    // 2. 调用库存把机器加回去
    // 3. 抹除配方分配里的记录
    // 4. 调用 生产线系统._删除生产线记录(cid, lineId)
  }

  return {
    导出生产线蓝图,
    安全删除生产线
  }
}