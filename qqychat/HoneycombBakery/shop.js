/**
 * 蜜巢面包店商店核心逻辑 - 外链版
 * 采用事件委托，适配动态DOM，全局监听稳定生效
 */

// 1. 获取当前操作的模块根节点（核心：避免多模块冲突）
function getModuleRoot(el) {
    return el.closest('.s-box');
}

// 2. 修改消耗品数量（仅操作当前模块）
function changeQty(btn, delta) {
    const moduleRoot = getModuleRoot(btn);
    const disp = btn.parentElement.querySelector('.s-qty');
    const val = Math.max(0, parseInt(disp.innerText) + delta);
    disp.innerText = val;
    updateModule(moduleRoot);
}

// 3. 切换工具选中状态（仅操作当前模块）
function toggleTool(btn) {
    const moduleRoot = getModuleRoot(btn);
    btn.classList.toggle('active');
    btn.innerText = btn.classList.contains('active') ? '已选中' : '未选中';
    updateModule(moduleRoot);
}

// 4. 更新当前模块合计与购物列表
function updateModule(moduleRoot) {
    let items = []; 
    let curT = 0;
    // 计算消耗品
    moduleRoot.querySelectorAll('.cons').forEach(el => {
        const q = parseInt(el.querySelector('.s-qty').innerText);
        if (q > 0) {
            items.push(el.dataset.name + ' x ' + q);
            curT += q * parseInt(el.dataset.price, 10);
        }
    });
    // 计算工具
    moduleRoot.querySelectorAll('.tool').forEach(el => {
        if (el.querySelector('.s-btn-t').classList.contains('active')) {
            items.push(el.dataset.name);
            curT += parseInt(el.dataset.price, 10);
        }
    });
    // 更新DOM
    moduleRoot.querySelector('.s-t-val').innerText = curT;
    moduleRoot.querySelector('.s-list').innerText = items.length ? items.join(' ，') : '';
}

// 5. 后备复制函数（兼容低版本浏览器）
function fallbackCopyText(text) {
    const tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try { document.execCommand('copy'); }
    catch (err) { console.error('复制失败：', err); }
    document.body.removeChild(tmp);
}

// 6. 购买并复制订单（仅操作当前模块）
function copyModule(btn) {
    const moduleRoot = getModuleRoot(btn);
    const curT = parseInt(moduleRoot.querySelector('.s-t-val').innerText);
    if (curT === 0) return;

    // 读取余额
    const bal = parseInt(moduleRoot.querySelector('.s-bal').innerText.match(/\d+/)[0]);
    const tip = moduleRoot.querySelector('.s-tip');

    // 余额不足处理
    if (curT > bal) {
        btn.classList.add('err');
        btn.innerText = '余额不足';
        tip.innerText = '抱歉，余额不足';
        tip.classList.add('error-text', 'show');
        fallbackCopyText("");
        setTimeout(() => {
            btn.classList.remove('err');
            btn.innerText = '购买';
            tip.classList.remove('show', 'error-text');
        }, 2000);
        return;
    }

    // 组装订单
    let items = [];
    moduleRoot.querySelectorAll('.cons').forEach(el => {
        const q = el.querySelector('.s-qty').innerText;
        if (q > 0) items.push(el.dataset.name + q + '个');
    });
    moduleRoot.querySelectorAll('.tool').forEach(el => {
        if (el.querySelector('.s-btn-t').classList.contains('active'))
            items.push(el.dataset.name + '1个');
    });
    const cmd = '【$花费' + curT + 'g，购买' + items.join('，') + '】';

    // 执行复制
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(cmd).catch(() => fallbackCopyText(cmd));
    } else {
        fallbackCopyText(cmd);
    }

    // 成功提示
    btn.classList.add('success');
    btn.innerText = '已生成';
    tip.innerText = '已复制！';
    tip.classList.add('show');
    setTimeout(() => {
        btn.classList.remove('success');
        btn.innerText = '购买';
        tip.classList.remove('show');
    }, 2000);
}

// 🔥 核心：全局事件委托（适配外链、动态DOM，100%生效）
document.body.addEventListener('click', function(e) {
    const target = e.target;
    // 匹配数量按钮（+/-）
    if (target.classList.contains('s-btn-q')) {
        const delta = target.dataset.o === '+' ? 1 : -1;
        changeQty(target, delta);
    }
    // 匹配工具选中按钮
    else if (target.classList.contains('s-btn-t')) {
        toggleTool(target);
    }
    // 匹配购买按钮
    else if (target.classList.contains('s-buy')) {
        copyModule(target);
    }
});
