// gong_ju.js
export const 格式化数字 = (num) => {
    // 1. 防御性编程：处理 null, undefined
    if (num === null || num === undefined) return '0';
    if (num === 0) return '0';

    // 2. 取绝对值用于判断量级
    const abs = Math.abs(num);

    // --- 场景一：小于 1000 的数字 (包含负的小数) ---
    if (abs < 1000) {
        // 修复点：对于小数（比如 0.5），保留2位小数，不要直接 floor 变成 0
        // 同时也顺便处理了 -900 这种不需要加 K 的负数
        return parseFloat(num.toFixed(2)); 
    }
    
    // --- 场景二：大数值格式化 (K, M, B, T) ---
    // 关键修复点：判断条件全部改为检查 abs (绝对值)
    // 这样 -50000 的绝对值是 50000，> 1000，就会正确进入 K 的逻辑

    if (abs < 1000000) 
        return parseFloat((num / 1000).toFixed(2)) + 'K';
        
    if (abs < 1000000000) 
        return parseFloat((num / 1000000).toFixed(2)) + 'M';
        
    if (abs < 1000000000000) 
        return parseFloat((num / 1000000000).toFixed(2)) + 'B';
        
    return parseFloat((num / 1000000000000).toFixed(2)) + 'T';
}