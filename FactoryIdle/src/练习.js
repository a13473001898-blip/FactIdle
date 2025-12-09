import { 查询配方分配, 游戏数据 } from "./dong_tai_shu_ju";
import { 建筑 as 建筑配置, 物品, 物品 as 物品配置 } from "./pei_zhi_shu_ju";
import { 配方 as 配方配置 } from "./pei_zhi_shu_ju";


export const 调整建筑分配数量 = (配方id, 建筑id, delta) => {
    const 调整值 = delta * 倍率.value

    if (调整值 > 0 ){
        //判定库存够不够,如果真则减去
        if( (游戏数据.库存[建筑id] || 0) < 调整值) return;
            游戏数据.库存[建筑id] = 游戏数据.库存[建筑id] - 调整值

            //初始化数据,并增加
            if(!游戏数据.配方分配[配方id]) 游戏数据.配方分配[配方id] = {}
            if(!游戏数据.配方分配[配方id][建筑id]) 游戏数据.配方分配[配方id][建筑id] = {数量:0,状态:'运行'}
            游戏数据.配方分配[配方id][建筑id].数量 = 游戏数据.配方分配[配方id][建筑id].数量 + 调整值
    }

    else{
        if ((游戏数据.配方分配[配方id][建筑id].数量 || 0) < -调整值) return;
        游戏数据.配方分配[配方id][建筑id].数量 -= -调整值

        //如果数值为0,删除掉
        if (游戏数据.配方分配[配方id][建筑id].数量 === 0) {
            delete 游戏数据.配方分配[配方id][建筑id];
        }

        if (!游戏数据.库存[建筑id]) 游戏数据.库存[建筑id] = 0;
        游戏数据.库存[建筑id] += -调整值
    }
  };

  查询配方分配
let 上次时间 = Date.now();

export function 启动游戏循环() {
    
    const loop = () => {
        const 现在时间 = Date.now();
        const 过去的时间秒 = 现在时间 /1000 - 上次时间 / 1000

        if (现在时间 > 上次时间) {
            for (const id in 游戏数据.速率) {
                
                const 净值速率 = 游戏数据.速率[id].净值
                if (净值速率 === 0) continue;

                const 增加量 = 净值速率 * 过去的时间秒

                if (游戏数据.库存[id] === undefined) {
                    游戏数据.库存[id] = 0;
                }
                游戏数据.库存[id] += 增加量
            }
        }

        上次时间 = 现在时间;
        requestAnimationFrame(loop);
    };

    // 第一次启动
    loop();
}