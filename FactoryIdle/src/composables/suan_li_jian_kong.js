// src/composables/suan_li_jian_kong.js
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js'
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js'
import { use生产线系统 } from '@/stores/sheng_chan_xian_xi_tong.js'
import { 获取物品数据 } from '@/pei_zhi_shu_ju.js'
import { 读取cid } from '@/gong_ju.js'

export function use算力监控() {
  const 计算机 = use计算机系统()
  const 配方分配 = use配方分配()
  const 生产线系统 = use生产线系统()

  // 1. 获取机箱能提供的总核心数
  const 获取总核心数 = (colonyId) => {
    const cid = 读取cid(colonyId)
    const 机箱 = 计算机.本地插槽[cid]
    if (!机箱 || !机箱.装备的主板) return 0

    let 总核心 = 0
    for (const cpuID of 机箱.装备的CPU) {
      const cpu数据 = 获取物品数据(cpuID)
      总核心 += (cpu数据?.核心数 || 0)
    }
    return 总核心
  }

  // 2. 获取已经开辟的高级生产线数量 (即已用核心数)
const 获取已用核心数 = (colonyId) => {
    const cid = 读取cid(colonyId)
    return (生产线系统.数据[cid]?.length || 0) + 1
  }

  // 3. 🌟 核心算法：多路 CPU 映射 (根据核心索引找单核频率上限)
  const 获取单核频率上限 = (核心索引, colonyId) => {
    const cid = 读取cid(colonyId)
    const 机箱 = 计算机.本地插槽[cid]
    if (!机箱 || !机箱.装备的主板 || 机箱.装备的CPU.length === 0) return 0

    let 剩余查找索引 = 核心索引
    for (const cpuID of 机箱.装备的CPU) {
      const cpu数据 = 获取物品数据(cpuID)
      const 当前CPU核心数 = cpu数据?.核心数 || 0
      const 当前CPU频率 = cpu数据?.频率 || 0

      // 如果剩余索引落在这个 CPU 的核心数范围内，说明就跑在这块 CPU 上
      if (剩余查找索引 < 当前CPU核心数) {
        return 当前CPU频率
      }
      // 否则减去这块 CPU 的核心数，继续向后找
      剩余查找索引 -= 当前CPU核心数
    }
    
    // 如果找遍了所有的 CPU 还是没命中，说明越界了（可能拔了CPU）
    return 0
  }

  // 4. 计算某条生产线的实时频率负载 (机器的字节总和)
  const 计算生产线负载 = (lineId = 'default', colonyId) => {
    const cid = 读取cid(colonyId)
    const 线上分配 = 配方分配.查询生产线(lineId, cid)
    
    let 负载 = 0
    for (const 配方id in 线上分配) {
      for (const 建筑id in 线上分配[配方id]) {
        const 机器状态 = 线上分配[配方id][建筑id]
        
        // 只有运行中的机器才消耗算力
        if (机器状态.状态 === '运行') {
          const 机器算力消耗 = 获取物品数据(建筑id)?.字节 || 1
          负载 += 机器状态.数量 * 机器算力消耗
        }
      }
    }
    return 负载
  }

  // 5. 综合校验：某条线是否还能塞入这批机器
  const 校验能否塞入机器 = (lineId = 'default', 建筑id, 新增数量, colonyId) => {
    const cid = 读取cid(colonyId)
    
    // 找出这条线绑定的核心索引
    let 绑定核心索引 = 0 // default 默认绑定核心 0
    if (lineId !== 'default') {
      const 产线信息 = 生产线系统.数据[cid]?.find(l => l.id === lineId)
      // 如果找不到这根线，或者这根线绑定失败，直接拦截
      if (!产线信息) return false
      绑定核心索引 = 产线信息.绑定核心索引
    }

    // 根据核心索引，查出物理主板上对应 CPU 的频率上限
    const 单核频率上限 = 获取单核频率上限(绑定核心索引, cid)
    
    // 如果上限为0 (没装CPU或者拔了CPU导致越界宕机)，肯定塞不进去了
    if (单核频率上限 <= 0) return false

    const 当前负载 = 计算生产线负载(lineId, cid)
    const 机器算力消耗 = 获取物品数据(建筑id)?.字节 || 1
    const 预计新增负载 = 机器算力消耗 * 新增数量

    return (当前负载 + 预计新增负载) <= 单核频率上限
  }

  return {
    获取总核心数,
    获取已用核心数,
    获取单核频率上限,
    计算生产线负载,
    校验能否塞入机器
  }
}