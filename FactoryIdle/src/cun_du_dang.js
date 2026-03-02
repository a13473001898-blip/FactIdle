// src/cun_du_dang.js
import { use库存 } from '@/stores/ku_cun.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use科技系统 } from '@/stores/ke_ji_xi_tong.js';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { use游戏设置 } from '@/stores/she_zhi.js';
import { use殖民地系统 } from '@/stores/zhi_min_di_xi_tong.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';

const CURRENT_VERSION = '0.4.2'; // 引入版本号，方便以后做大版本的数据迁移

export const 存档 = () => {
    try {
        // 让各个系统自己提交自己的数据包
        const data = {
            version: CURRENT_VERSION,
            timestamp: Date.now(),
            ku_cun: use库存().导出数据(),
            pei_fang: use配方分配().导出数据(),
            ke_ji: use科技系统().导出数据(),
            ji_suan_ji: use计算机系统().导出数据(),
            she_zhi: use游戏设置().导出数据(),
            zhi_min_di: use殖民地系统().导出数据()
        };

        localStorage.setItem('存档字符串', JSON.stringify(data));
        console.log(`游戏进度已保存 (v${CURRENT_VERSION})`);
        return true;
    } catch (error) {
        console.error('存档失败:', error);
        return false;
    }
};

export const 读档 = (外来存档字符串 = null) => {
    try {
        const 存档文件 = 外来存档字符串 || localStorage.getItem('存档字符串');
        if (!存档文件) return false;

        const 存档对象 = JSON.parse(存档文件);
        
        // 【沙箱校验】防坏档防御：检查这到底是不是一个合法的存档文件
        if (!存档对象.ku_cun || !存档对象.version) {
            throw new Error('存档文件损坏或格式不合法');
        }

        const 版本号 = 存档对象.version;

        // 依次将数据下发给各个系统，由它们内部自己处理覆盖和热迁移
        use库存().导入数据(存档对象.ku_cun, 版本号);
        use配方分配().导入数据(存档对象.pei_fang, 版本号);
        use科技系统().导入数据(存档对象.ke_ji, 版本号);
        use计算机系统().导入数据(存档对象.ji_suan_ji, 版本号);
        use游戏设置().导入数据(存档对象.she_zhi, 版本号);
        use殖民地系统().导入数据(存档对象.zhi_min_di, 版本号);

        引擎信号.需要重新结算 = true;
        console.log(`游戏进度已载入 (源自 v${版本号})`);
        return true;
    } catch (error) {
        console.error('读档失败:', error);
        return false;
    }
};

export const 删除存档 = () => {
    localStorage.removeItem('存档字符串');
    console.warn('存档已从本地存储中抹除');
};

export const 启动自动存档 = () => {
    setInterval(() => {
        存档();
        console.log('自动存档已完成');
    }, 60000); // 你可以把这个 60000 改成读取 use游戏设置().自动存档间隔 * 1000
};