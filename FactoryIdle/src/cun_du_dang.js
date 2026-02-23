
import { use库存 } from '@/stores/ku_cun.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use全局速率 } from '@/stores/su_lv.js'
import { use科技系统 } from '@/stores/ke_ji_xi_tong.js'



export const 存档 = () => {
    const 配方分配 = use配方分配();
    const 科技系统 = use科技系统()
    const 库存 = use库存()
    const data = {
        库存 : 库存.数据,
        配方分配 : 配方分配.数据,
        科技系统: 科技系统.$state,
    }

    localStorage.setItem('存档字符串',JSON.stringify(data))

  }

export const 读档 = (data) => {
    const 全局速率 = use全局速率()
    const 科技系统 = use科技系统()
    const 配方分配 = use配方分配();
    const 库存 = use库存()
    const 存档文件 = localStorage.getItem('存档字符串')
    if (存档文件 === null) return
    const 存档对象 = JSON.parse(存档文件)
    if(存档对象.库存) {
        Object.assign(库存.数据,存档对象.库存)
    }
    if(存档对象.配方分配) {
        Object.assign(配方分配.数据,存档对象.配方分配)
    }
    if(存档对象.科技系统) {
        Object.assign(科技系统.$state, 存档对象.科技系统)
    }
    全局速率.更新全局速率()
}

export const 启动自动存档 = () => {
    // 每 60 秒自动保存一次
    setInterval(() => {
        存档();
        console.log('自动存档已完成'); // 开发阶段留着 log 方便观察，上线可以删掉
    }, 60000);
}