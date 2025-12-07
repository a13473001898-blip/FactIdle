// gong_ju.js
export const 格式化数字 = (num) => {
    // 1. 防御性编程：处理 null, undefined
    if (num === null || num === undefined) return '0';
    
    // 【核心修复】强制转为数字，防止字符串混入（比如 "123".toFixed 就会报错）
    const val = Number(num);
    
    // 如果转完不是个数字（比如传了 "abc" 或 {}），直接返回 0 安全退出
    if (isNaN(val)) return '0';
    if (val === 0) return '0';

    // 2. 取绝对值用于判断量级
    const abs = Math.abs(val);

    // --- 场景一：小于 1000 的数字 (包含负的小数) ---
    if (abs < 1000) {
        // 使用 val 而不是 num
        return parseFloat(val.toFixed(2)); 
    }
    
    // --- 场景二：大数值格式化 (K, M, B, T) ---
    if (abs < 1000000) 
        return parseFloat((val / 1000).toFixed(2)) + 'K';
        
    if (abs < 1000000000) 
        return parseFloat((val / 1000000).toFixed(2)) + 'M';
        
    if (abs < 1000000000000) 
        return parseFloat((val / 1000000000).toFixed(2)) + 'B';
        
    return parseFloat((val / 1000000000000).toFixed(2)) + 'T';
}