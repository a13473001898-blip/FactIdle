
export const 物品类型 = {
    资源 : '资源',
    原材料 : '原材料',
    零部件 : '零部件',
    建筑 : '建筑',
}

export const 配方类型 = {
    采集 : '采集',
    熔炼 : '熔炼',
    制造 : '制造',
}

export const 建筑类型 = {
    采集 : '采集',
    熔炼 : '熔炼',
    制造 : '制造',
}

const 物品配置 = {
    //资源
    tie_kuang : {id:'tie_kuang',名称:'铁矿',类型:物品类型.资源,字节:1},
    tong_kuang : {id:'tong_kuang',名称:'铜矿',类型:物品类型.资源,字节:1},
    mei_tan : {id:'mei_tan',名称:'煤炭',类型:物品类型.资源,字节:1,燃料:true,热值:600000},
    shi_tou : {id:'shi_tou',名称:'石头',类型:物品类型.资源,字节:1},
    //原材料
    tie_ban : {id:'tie_ban',名称:'铁板',类型:物品类型.原材料,字节:1},
    tong_ban : {id:'tong_ban',名称:'铜板',类型:物品类型.原材料,字节:1},
    //零部件
    tong_xian : {id:'tong_xian',名称:'铜线',类型:物品类型.零部件,字节:0.5},
    chi_lun : {id:'chi_lun',名称:'齿轮',类型:物品类型.零部件,字节:2},
    //建筑
    shi_lu : {id:'shi_lu',名称:'石炉',类型:物品类型.建筑, 字节:2},
    kuang_ji : {id:'kuang_ji',名称:'热能矿机',类型:物品类型.建筑, 字节:2},
    zu_zhuang_ji : {id:'zu_zhuang_ji',名称:'组装机',类型:物品类型.建筑, 字节:2}
}

const 配方配置 = {
    //采集
    tie_kuang_r : {id:'tie_kuang_r',输入:[],输出:[{id:'tie_kuang',数量:1}],时间:1,类型:配方类型.采集},
    tong_kuang_r : {id:'tong_kuang_r',输入:[],输出:[{id:'tong_kuang',数量:1}],时间:1,类型:配方类型.采集},
    mei_tan_r : {id:'mei_tan_r',输入:[],输出:[{id:'mei_tan',数量:1}],时间:1,类型:配方类型.采集},
    shi_tou_r : {id:'shi_tou_r',输入:[],输出:[{id:'shi_tou',数量:1}],时间:1,类型:配方类型.采集},
    //冶炼
    tie_ban_r : {id:'tie_ban_r',输入:[{id:'tie_kuang',数量:1}],输出:[{id:'tie_ban',数量:1}],时间:1,类型:配方类型.熔炼},
    tong_ban_r : {id:'tong_ban_r',输入:[{id:'tong_kuang',数量:1}],输出:[{id:'tong_ban',数量:1}],时间:1,类型:配方类型.熔炼},
    //制造
    tong_xian_r : {id:'tong_xian_r',输入:[{id:'tong_ban',数量:1}],输出:[{id:'tong_xian',数量:2}],时间:1,类型:配方类型.制造},
    chi_lun_r : {id:'chi_lun_r',输入:[{id:'tie_ban',数量:2}],输出:[{id:'chi_lun',数量:1}],时间:1,类型:配方类型.制造},
    shi_lu_r : {id:'shi_lu_r',输入:[{id:'shi_tou',数量:5}],输出:[{id:'shi_lu',数量:1}],时间:1,类型:配方类型.制造},
    kuang_ji_r : {id:'kuang_ji_r',输入:[{id:'tie_ban',数量:9},{id:'shi_tou',数量:5}],输出:[{id:'kuang_ji',数量:1}],时间:1,类型:配方类型.制造},
    zu_zhuang_ji_r : {id:'zu_zhuang_ji_r',输入:[{id:'tie_ban',数量:12},{id:'chi_lun',数量:4}],输出:[{id:'zu_zhuang_ji',数量:1}],时间:4,类型:配方类型.制造},
}

const 建筑配置 ={
    shi_lu : {id:'shi_lu', 类型:建筑类型.熔炼, 速度:1,能耗:10000,占用:1},
    kuang_ji : {id:'kuang_ji', 类型:建筑类型.采集, 速度:1,能耗:40000,占用:1},
    zu_zhuang_ji : {id:'zu_zhuang_ji', 类型:建筑类型.制造, 速度:1,能耗:40000,占用:1},
}

function 冻结对象 (对象) {
//  1.安全检查
    if(对象 === null || typeof 对象 !== 'object') {
        return 对象
    } 

//  2.遍历获得键值
    for (const 键 of Object.keys(对象)) {
        const 值 = 对象[键]

//      3.检查值是否为对象
        if(值 && typeof 值 === 'object' && !Object.isFrozen(值)) {
            冻结对象(值)
        }
    }

//  4.递归后对当前对象冻结
    return Object.freeze(对象)
}

const 配置数据 = {
    '物品类型' : 物品类型,
    '配方类型' : 配方类型,
    '建筑类型' : 建筑类型,
    '物品' : 物品配置,
    '配方' : 配方配置,
    '建筑' : 建筑配置,
}

冻结对象(配置数据)

/**
 * 查不到返回 undefined，UI需要自己处理兜底
 * 或者你可以改为返回一个 {名称:'未知'} 的空对象
 */
export function 获取物品数据(id) {
    return 配置数据.物品[id];
}

export function 获取配方数据(id) {
    return 配置数据.配方[id];
}

export function 获取建筑数据(id) {
    return 配置数据.建筑[id];
}

/**
 * 专门给 v-for 用的列表接口
 * 直接返回整个对象，让外部去遍历 (key, value)
 */
export function 获取所有物品列表() {
    return 配置数据.物品;
}

export function 获取所有配方列表() {
    return 配置数据.配方;
}

export function 获取所有建筑列表() {
    return 配置数据.建筑;
}