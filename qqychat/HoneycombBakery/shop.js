/**
 * 商店模块核心逻辑 - 适配多模块独立运行
 * 无需修改，上传到GitHub后通过CDN外链引入即可
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
    updateModule(moduleRoot); // 仅更新当前模块合计
}

// 3. 切换工具选中状态（仅操作当前模块）
function toggleTool(btn) {
    const moduleRoot = getModuleRoot(btn);
    btn.classList.toggle('active');
    btn.innerText = btn.classList.contains('active') ? '已选中' : '未选中';
    updateModule(moduleRoot); // 仅更新当前模块合计
}

// 4. 更新当前模块的合计金额和购物列表
function updateModule(moduleRoot) {
    let items = []; 
    let curT = 0; // 局部变量，仅当前模块生效
    
    // 计算消耗品金额
    moduleRoot.querySelectorAll('.cons').forEach(el => {
        const q = parseInt(el.querySelector('.s-qty').innerText);
        if (q > 0) { 
            items.push(el.dataset.name + ' x ' + q); 
            curT += q * parseInt(el.dataset.price, 10);
        }
    });
    
    // 计算工具金额
    moduleRoot.querySelectorAll('.tool').forEach(el => {
        if (el.querySelector('.s-btn-t').classList.contains('active')) {
            items.push(el.dataset.name); 
            curT += parseInt(el.dataset.price, 10);
        }
    });
    
    // 更新当前模块的合计和列表
    moduleRoot.querySelector('.s-t-val').innerText = curT;
    moduleRoot.querySelector('.s-list').innerText = items.length ? items.join(' ，') : '';
}

// 5. 后备复制函数（兼容低版本浏览器）
function fallbackCopyText(text) {
    let tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = 'fixed';
    tmp.style.top = '0';
    tmp.style.left = '0';
    tmp.style.opacity = '0';
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try { 
        document.execCommand('copy'); 
    } catch (err) {
        console.error('复制失败', err);
    }
    document.body.removeChild(tmp);
}

// 6. 购买并复制订单（仅操作当前模块）
function copyModule(btn) {
    const moduleRoot = getModuleRoot(btn);
    const curT = parseInt(moduleRoot.querySelector('.s-t-val').innerText);
    
    // 无商品时直接返回
    if (curT === 0) return;

    // 读取当前模块余额
    const balText = moduleRoot.querySelector('.s-bal').innerText;
    const bal = parseInt(balText.match(/\d+/)[0]);
    const tip = moduleRoot.querySelector('.s-tip');
    
    // 余额不足判断
    if (curT > bal) {
        btn.classList.add('err'); 
        btn.innerText = '余额不足'; 
        tip.innerText = '抱歉，您的余额不足'; 
        tip.classList.add('error-text', 'show');
        
        fallbackCopyText("");
        setTimeout(() => { 
            btn.classList.remove('err'); 
            btn.innerText = '购买'; 
            tip.classList.remove('show', 'error-text'); 
        }, 2000);
        return;
    }

    // 组装订单内容
    let items = [];
    moduleRoot.querySelectorAll('.cons').forEach(el => { 
        const q = el.querySelector('.s-qty').innerText; 
        if(q > 0) items.push(el.dataset.name + q + '个'); 
    });
    moduleRoot.querySelectorAll('.tool').forEach(el => { 
        if(el.querySelector('.s-btn-t').classList.contains('active')) 
            items.push(el.dataset.name + '1个'); 
    });
    const cmd = '【$花费' + curT + 'g，购买' + items.join('，') + '】';
    
    // 执行复制（优先用剪贴板API，兼容后备方案）
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(cmd).catch(() => fallbackCopyText(cmd));
    } else {
        fallbackCopyText(cmd);
    }
    
    // 成功提示（仅当前模块）
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

// 自动绑定事件（可选：如果想去掉HTML里的onclick，可启用这段）
// document.addEventListener('DOMContentLoaded', function() {
//     // 绑定数量按钮事件
//     document.querySelectorAll('.s-btn-q').forEach(btn => {
//         btn.addEventListener('click', function() {
//             const delta = this.dataset.o === '+' ? 1 : -1;
//             changeQty(this, delta);
//         });
//     });
//     // 绑定工具选中事件
//     document.querySelectorAll('.s-btn-t').forEach(btn => {
//         btn.addEventListener('click', function() {
//             toggleTool(this);
//         });
//     });
//     // 绑定购买按钮事件
//     document.querySelectorAll('.s-buy').forEach(btn => {
//         btn.addEventListener('click', function() {
//             copyModule(this);
//         });
//     });
// });
