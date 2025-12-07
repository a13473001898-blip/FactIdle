import { 游戏数据 } from "./dong_tai_shu_ju";
import { 建筑 as 建筑配置, 物品, 物品 as 物品配置 } from "./pei_zhi_shu_ju";
import { 配方 as 配方配置 } from "./pei_zhi_shu_ju";



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