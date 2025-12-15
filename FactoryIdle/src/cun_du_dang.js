import { 更新全局速率, 游戏数据 } from "./dong_tai_shu_ju"


export const 存档 = () => {
    const data = {
        库存 : 游戏数据.库存,
        配方分配 : 游戏数据.配方分配
    }

    localStorage.setItem('存档字符串',JSON.stringify(data))

  }

export const 读档 = (data) => {
    const 存档文件 = localStorage.getItem('存档字符串')
    if (存档文件 === null) return
    const 存档对象 = JSON.parse(存档文件)
    if(存档对象.库存) {
        Object.assign(游戏数据.库存,存档对象.库存)
    }
    if(存档对象.配方分配) {
        Object.assign(游戏数据.配方分配,存档对象.配方分配)
    }
    更新全局速率()
}

export const 启动自动存档 = () => {
    // 每 60 秒自动保存一次
    setInterval(() => {
        存档();
        console.log('自动存档已完成'); // 开发阶段留着 log 方便观察，上线可以删掉
    }, 60000);
}