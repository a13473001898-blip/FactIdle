import { use游戏设置 } from '@/stores/she_zhi.js';
import { use殖民地系统 } from '@/stores/zhi_min_di_xi_tong.js'; 

const 算法_标准后缀 = (num, 精度) => {
    if (Math.abs(num) < 1000) return num.toFixed(Math.abs(num) < 10 ? 精度 : 0);
    
    const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    const i = Math.floor(Math.log10(Math.abs(num)) / 3);
    const val = num / Math.pow(10, i * 3);
    
    // 如果超出单位表范围，回退到科学计数法
    if (i >= units.length) return num.toExponential(精度);
    
    return val.toFixed(精度) + units[i];
};

/** 科学计数法处理 (1.23e9) */
const 算法_科学计数 = (num, 精度) => {
    return num.toExponential(精度);
};

/** 工程计数法处理 (指数为3的倍数) */
const 算法_工程计数 = (num, 精度) => {
    const absNum = Math.abs(num);
    if (absNum === 0) return '0';
    if (absNum < 1000) return num.toFixed(精度);
    
    const exp = Math.floor(Math.log10(absNum) / 3) * 3;
    const mantissa = num / Math.pow(10, exp);
    return `${mantissa.toFixed(精度)}e${exp}`;
};


export const 格式化数字 = (num) => {
    if (num === 0 || !num) return '0';

    const 设置 = use游戏设置();
    const { 数字模式, 保留小数 } = 设置.显示配置;

    // 指挥中心：根据模式选择对应的策略函数
    switch (数字模式) {
        case 'scientific':  return 算法_科学计数(num, 保留小数);
        case 'engineering': return 算法_工程计数(num, 保留小数);
        case 'standard':
        default:            return 算法_标准后缀(num, 保留小数);
    }
};

export const 格式化字节 = (bytes) => {
    if (bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // 如果是 B (0级)，不需要小数，否则保留两位小数
    if (i === 0) return Math.floor(bytes) + ' ' + sizes[i];
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 规则：优先使用显式传入的 ID；若缺省，则自动降级读取当前 UI 视角。
 * 警告：严禁用于任何写操作（增删改）！
 */
export const 读取cid = (传入的ID) => {
    if (传入的ID) return 传入的ID;
    const 殖民地系统 = use殖民地系统();
    return 殖民地系统 ? 殖民地系统.当前视角ID : 'main_base'; // 增加兜底防止初始化时序报错
};