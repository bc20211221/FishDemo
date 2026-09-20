/* ============================================================
   锦鲤钓鱼节 · 交互逻辑
   匹配：匹配大厅(图2) / 社交关系(图3) / 游戏场景(图1)
   ============================================================ */

/* ================= 全局状态 ================= */
const S = {
  jinli: 3280, coupon: 1860, farmCoin: 12500, diamond: 520,
  farmLevel: 35, reqLevel: 30, pondLevel: 4,
  used: { normal: 1, adv: 0 }, mobaTicket: 0, dailyFished: 6,
  pond: { open: false, type: null, time: 600, total: 0, mine: 0, friend: 0, activeN: 1, timer: null },
  warehouse: [], caught: new Set(),
  phase: 'open', curPool: 'normal', chatTab: 'world',
};

/* 初始仓库 */
function seedWarehouse() {
  const add = (id, w, m, n) => { S.warehouse.push({ id, w, m, n }); S.caught.add(id); };
  add(12, 1, 0, 5); add(15, 2, 0, 3); add(9, 3, 0, 2);
  add(7, 4, 1, 1); add(1, 5, 2, 1); add(13, 0, 0, 8);
}
seedWarehouse();

/* ================= 工具 ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => n.toLocaleString('en-US');
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[rand(0, arr.length - 1)];

/* Toast */
let toastEl = null;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    Object.assign(toastEl.style, {
      position: 'fixed', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg,rgba(14,26,48,0.97), rgba(8,16,30,0.98))',
      border: '1px solid rgba(60,110,170,0.25)', borderRadius: '12px',
      color: '#c8d6e8', padding: '10px 22px', fontSize: '13px', maxWidth: '360px',
      textAlign: 'center', zIndex: '9999', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)', pointerEvents: 'none', opacity: '0',
      transition: 'opacity .3s ease',
    });
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = msg; toastEl.style.opacity = '1';
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.style.opacity = '0', 2400);
}

/* Modal */
function modal(html) {
  const m = $('#modalMask');
  m.style.display = 'flex';
  m.innerHTML = `<div class="modal-box">${html}</div>`;
}
function closeModal() { $('#modalMask').style.display = 'none'; $('#modalMask').innerHTML = ''; }

/* 鱼获定价 */
function fishPrice(f) {
  const base = 20;
  const qMul = { red: 30, orange: 16, purple: 8, blue: 4, green: 1.5 }[f_q(f.id)];
  const wMul = [0.8, 1, 1.3, 1.7, 2.4, 3.4, 5][f.w];
  const mMul = f.m ? [1, 1.6, 1.8, 2.5][f.m] : 1;
  return Math.round(base * qMul * wMul * mMul);
}
const f_q = id => FISH.find(x => x.id === id).q;
const f_obj = id => FISH.find(x => x.id === id);

/* ================= 顶栏 & 底栏渲染 ================= */
function renderTopbar(cfg) {
  const tb = $('#topbar');
  let leftHtml = '';
  if (cfg.back) {
    leftHtml += `<button class="tb-icon" data-go="${cfg.back}" style="width:30px;height:30px;border-radius:8px;font-size:16px;">‹</button>`;
  }
  if (cfg.title) leftHtml += `<div class="tb-left"><span class="tb-title">${cfg.title}</span>${cfg.subtitle ? `<div class="tb-subtitle">${cfg.subtitle}</div>` : ''}</div>`;

  let rightHtml = '<div class="tb-right">';
  if (cfg.badge) rightHtml += `<span class="tb-badge ${cfg.badgeGold ? 'gold' : ''}">${cfg.badge}</span>`;
  if (cfg.curs) rightHtml += `<div class="cur-row">${cfg.curs.map(c =>
    `<div class="cur-item"><span class="ci-icon" style="background:${c.bg};border-radius:50%">${c.icon}</span>${fmt(c.val)}</div>`
  ).join('')}</div>`;
  // 固定图标
  rightHtml += `<div class="tb-icon">🧭</div><div class="tb-icon">⚙️</div></div>`;

  tb.innerHTML = leftHtml + rightHtml;
}

function renderBottombar(btns) {
  const bb = $('#bottombar');
  if (!btns) { bb.innerHTML = ''; bb.style.display = 'none'; return; }
  bb.style.display = 'flex';
  bb.innerHTML = btns.map(b => {
    if (b.type === 'spacer') return '<div class="bb-spacer"></div>';
    if (b.type === 'mini') return `<button class="bb-mini" data-act="${b.act || ''}"><span class="bbi">${b.icon}</span><span class="bbt">${b.label}</span></button>`;
    if (b.type === 'primary') return `<button class="bb-primary ${b.gold ? 'gold' : ''}" data-act="${b.act || ''}">${b.label}</button>`;
    return '';
  }).join('');
}

function defaultCurs() {
  return [
    { icon: '🪙', bg: 'linear-gradient(135deg,#ffe08a,#f3a93c)', val: S.jinli },
    { icon: '🎫', bg: 'linear-gradient(135deg,#ff9a9a,#ff5d5d)', val: S.coupon },
    { icon: '💎', bg: 'linear-gradient(135deg,#a371f7,#7d4ce0)', val: S.diamond },
  ];
}

/* ================= 路由系统 ================= */
function go(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = $('#screen-' + name);
  if (el) el.classList.add('active');

  $$('.sb-item[data-screen]').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === name);
  });

  if (renderers[name]) renderers[name]();
}

/* ================= 各界面渲染器 ================= */
const renderers = {};

/* ---- 钓鱼大厅（参考截图2 · 匹配布局） ---- */
let homeFrTab = 'friend';
renderers.home = () => {
  const ended = S.phase !== 'open';
  const locked = S.farmLevel < S.reqLevel;

  // 左侧房间区域（玩家卡槽 + 房间操作）
  const slots = [
    { name: '甜酷照我', emo: '👤', filled: true, mic: true },
    { name: 'Terry韬', emo: '🧑', filled: true, diamond: true, mic: true, speaker: true },
    { name: '', emo: '?', filled: false },
    { name: '', emo: '?', filled: false },
    { name: '', emo: '?', filled: false },
  ];
  const slotHtml = slots.map((s, i) => `
    <div class="player-slot">
      <div class="ps-avatar ${s.filled ? 'filled' : ''}">
        ${s.filled ? s.emo : '<div class="ps-empty">?</div>'}
        ${s.filled ? `<div class="ps-icons">
          ${s.mic ? '<div class="psi">🎤</div>' : ''}
          ${s.speaker ? '<div class="psi">🔊</div>' : ''}
        </div>` : ''}
      </div>
      <div class="ps-name">${s.name || '等待中'}</div>
    </div>
  `).join('');

  // 右侧好友列表（截图2右侧面板）
  const tabs = [['friend', '好友'], ['team', '车队'], ['recent', '最近'], ['nearby', '附近'], ['battle', '战']];
  const tabBtns = tabs.map(([k, n]) =>
    `<button class="${homeFrTab === k ? 'active' : ''}" data-hftab="${k}">${n}</button>`
  ).join('');

  const friends = RECRUITS.map(r => `
    <div class="friend-row">
      <div class="fr-avatar">${r.emo}<div class="fr-lv">${r.lv}</div></div>
      <div class="fr-info">
        <div class="fr-name">${r.name} <span class="fr-tag">至尊星耀I</span></div>
        <div class="fr-sub"><span style="color:var(--cyan)">🎮</span> 组队·排位 ${rand(1, 5)}${r.lv > 20 ? ' · VIP' : ''}</div>
      </div>
      <div class="fr-action">
        <button class="btn btn-outline btn-sm" data-act="goto-friend" data-name="${r.name}">组队 ▼</button>
      </div>
    </div>
  `).join('');

  // 顶栏配置
  renderTopbar({
    title: '🎣 5v5钓鱼排队',
    subtitle: '多人共钓 · 高级池 · 实时匹配',
    badge: ended ? '已结束' : `分路匹配: 12~18点 征召`,
    badgeGold: !ended,
    curs: defaultCurs(),
  });

  // 底栏配置
  renderBottombar([
    { type: 'mini', icon: '🎤', label: '麦克风', act: 'lv-tip' },
    { type: 'mini', icon: '📷', label: '摄像头', act: 'lv-tip' },
    { type: 'mini', icon: '😀', label: '表情', act: 'lv-tip' },
    { type: 'mini', icon: '📦', label: '收集', act: 'lv-tip' },
    { type: 'mini', icon: '📢', label: '招募', act: 'goto-social' },
    { type: 'spacer' },
    { type: 'primary', label: ended ? '活动已结束' : '取消准备', act: ended ? '' : 'lv-tip', gold: !ended },
  ]);

  $('#screen-home').innerHTML = `
    <div class="split-lr fade-in">
      <!-- 左侧：房间区 -->
      <div class="split-left" style="padding:12px 14px;">
        <!-- 共享入口 -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:rgba(25,48,80,0.5);border:1px solid var(--border);cursor:pointer;">
            <span style="font-size:20px">🧑‍🌾</span>
            <span style="font-size:13px;font-weight:700;color:#fff">共享 ›</span>
            <span class="lv-tag vip">V${S.farmLevel}</span>
          </div>
          <div style="font-size:11px;color:var(--text-dim)">多排 青铜III~黄金I / 五排 青铜III~黄金I</div>
        </div>

        <!-- 玩家卡槽 -->
        <div class="slot-area">${slotHtml}</div>

        <!-- 房间消息 -->
        <div class="room-chat">
          <span class="rc-speaker">Terry韬:</span> 这一局，我的皮肤，队友们<b>随便用</b>！
        </div>

        <!-- 房间操作按钮 -->
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-ghost btn-sm" style="flex:1" data-act="lv-tip">嗨嗨啥啥</button>
          <button class="btn btn-ghost btn-sm" style="flex:1" data-act="lv-tip">我再拉个人吧</button>
        </div>
      </div>

      <!-- 右侧：好友面板 -->
      <div class="split-right">
        <div class="htabs">${tabBtns}</div>
        <div class="status-line">
          <span class="sl-text">和朋友分享此刻状态吧～</span>
          <button class="sl-action" data-act="lv-tip">◎ 状态</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:0 6px 6px;">
          ${friends}
        </div>
        <div style="padding:8px;display:flex;gap:6px;border-top:1px solid var(--divider);">
          <div style="display:flex;align-items:center;gap:4px;flex:1;">
            ${[1, 2, 3].map(i => `<div class="fr-avatar" style="width:28px;height:28px;font-size:14px">${pick(['🐱','🐸','🦊','🐼','🐨'])}</div>`).join('')}
            <button class="btn btn-blue btn-sm" data-act="goto-social">开车车队 ${rand(2, 6)}</button>
          </div>
          <button class="btn btn-outline btn-sm" data-act="lv-tip">邀请</button>
        </div>
      </div>
    </div>
  `;
};

/* ---- 社交关系页（参考截图3） ---- */
let socialMainTab = 'my';
renderers.social = () => {
  renderTopbar({
    title: '💎 游戏关系',
    subtitle: '',
    curs: [],
  });
  renderBottombar(null);

  const mainTabs = [['my', '我的关系'], ['build', '可建立的关系']];
  const mainTabBtns = mainTabs.map(([k, n]) =>
    `<button class="${socialMainTab === k ? 'active' : ''}" data-smtab="${k}">${n}</button>`
  ).join('');

  // 好友数据（截图3风格）
  const socialFriends = [
    { name: '观望猫', emo: '👩', lv: 72, gender: '♀', intimate: true, hearts: null },
    { name: '糊涂星人', emo: '🐻', lv: 110, gender: '♂', intimate: false, hearts: null, vip: true },
    { name: 'Kiki', emo: '👧', lv: 43, gender: '♀', intimate: false, hearts: null },
    { name: '小宝贝', emo: '💕', lv: 0, gender: '', intimate: true, hearts: 2578 },
    { name: '小仙女', emo: '🧚', lv: 0, gender: '♀', intimate: false, hearts: 4805 },
    { name: '大佬', emo: '😎', lv: 0, gender: '', intimate: false, hearts: 4290 },
    { name: '懂鸟语的人', emo: '🦜', lv: 0, gender: '♂', intimate: false, hearts: null, time: '最近同玩9月22日' },
    { name: '茶奶丝丘比特', emo: '🏹', lv: 0, gender: '', intimate: false, hearts: null, vip: true },
    { name: 'L.i.Ly', emo: '👩', lv: 868, gender: '♀', intimate: false, hearts: null },
    { name: '基友', emo: '🤝', lv: 0, gender: '', intimate: false, hearts: 2489 },
    { name: '青铜侠', emo: '⚔️', lv: 0, gender: '', intimate: false, hearts: 1420 },
    { name: '饭搭子', emo: '🍚', lv: 0, gender: '', intimate: false, hearts: 1139 },
    { name: '流心贝贝', emo: '🐚', lv: 2679, gender: '♂', intimate: false, hearts: null },
    { name: '壮哥不会飞', emo: '🦅', lv: 0, gender: '♂', intimate: false, hearts: null, time: '最近同玩11月6日' },
    { name: '北川潮品', emo: '🌊', lv: 0, gender: '', intimate: false, hearts: null, time: '最近同玩3月27日' },
  ];

  const gridHtml = socialFriends.map((f, idx) => `
    <div class="social-card ${f.intimate ? 'intimate' : ''}" data-act="social-info" data-idx="${idx}">
      <div class="sc-top">
        <div class="sc-avatar">${f.emo}</div>
        <div class="sc-name-row">
          <div class="sc-name">${f.name} 
            ${f.gender ? `<span class="sc-tag-icon">${f.gender}</span>` : ''}
            ${f.vip ? '<span class="sc-tag">👑</span>' : ''}
          </div>
          ${f.time ? `<div class="sc-tags" style="font-size:10px;color:var(--text-dim)">${f.time}</div>` :
            f.hearts != null ? `<div class="sc-intimacy"><span class="sc-heart">♥</span> ${f.hearts} ›</div>` :
            `<div class="sc-tags" style="font-size:10px;color:var(--text-dim)">互信黑贵${f.lv || rand(10, 200)}</div>`
          }
        </div>
      </div>
      ${f.hearts != null ? `<div class="sc-arrow">›</div>` : ''}
    </div>
  `).join('');

  $('#screen-social').innerHTML = `
    <div class="fade-in" style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div class="htabs" style="flex-shrink:0;">${mainTabBtns}</div>
      <div style="display:flex;align-items:center;justify-content:flex-end;padding:4px 14px;gap:8px;flex-shrink:0;">
        <span style="font-size:11px;color:var(--text-dim)">设置对TA的称呼，关系更亲密</span>
        <div class="tb-icon" style="width:26px;height:26px;font-size:12px">💎</div>
        <div class="tb-icon" style="width:26px;height:26px;font-size:12px">⚙️</div>
      </div>
      <div class="scroll-area" style="flex:1;">
        <div class="social-grid">${gridHtml}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;border-top:1px solid var(--divider);flex-shrink:0;">
        <span style="font-size:11px;color:var(--text-dim)">已优先显示恋人</span>
        <button class="btn btn-blue btn-sm" data-act="lv-tip">优先显示</button>
        <button class="btn btn-blue btn-sm" data-act="lv-tip">申请列表</button>
      </div>
    </div>
  `;
};

/* ---- 聊天频道 ---- */
renderers.chat = () => {
  const world = S.chatTab === 'world';
  const tabs = [
    ['all', '综合'],
    ['world', '农场世界'],
    ['friend', '好友'],
    ['city', '深圳市🔥']
  ];
  const tabBtns = tabs.map(([k, n]) =>
    `<button class="${(S.chatTab === k ? 'active' : '')}${k === 'friend' || k === 'city' ? '" style="opacity:.4"' : '"'} data-chattab="${k}">${n}</button>`
  ).join('');

  renderTopbar({
    back: 'home',
    title: world ? '🌍 农场世界频道' : '💬 综合频道',
    curs: defaultCurs(),
  });
  renderBottombar(null);

  const msgs = (world ? CHAT_MSGS : [
    { name: '小面包喵', g: '♂', lv: 0, t: '排位有没有？来个野王哥哥～', ava: '🙂' },
    { name: '路人乙', g: '♀', lv: 0, t: '综合频道：求带飞～想打娱乐赛', ava: '🙃' },
  ]).map(m => `
    <div class="chat-msg">
      <div class="cm-avatar">${m.ava}</div>
      <div class="cm-body">
        <div class="cm-meta">
          <span style="color:${m.g === '♂' ? 'var(--cyan)' : 'var(--red-soft)'}">${m.g === '♂' ? '♂' : '♀'}</span>
          <span class="cm-name">${m.name}</span>
          ${world ? `<span class="lv-tag">农场 Lv.${m.lv}</span>` : '<span class="lv-tag gray">王者</span>'}
        </div>
        <div class="cm-bubble">${m.t}</div>
      </div>
    </div>
  `).join('');

  // 插入鱼塘推送
  const pushHtml = (name) => `
    <div class="chat-msg">
      <div class="cm-avatar">${name === 'me' ? '🧑‍🌾' : '🐱'}</div>
      <div class="cm-body">
        <div class="cm-meta">
          <span style="color:var(--cyan)">♂</span>
          <span class="cm-name">${name === 'me' ? '小面包喵' : '不要啊n我怕'}</span>
          <span class="lv-tag gray">${name === 'me' ? '王者9★' : '王者'}</span>
        </div>
        <div class="fish-push">
          <div class="fp-icon">🎣🌊</div>
          <div class="fp-text">鱼塘高倍池已开启</div>
          <button class="btn btn-blue btn-sm" data-act="open-pond">前往</button>
        </div>
      </div>
    </div>`;

  const chatBody = world ? msgs : pushHtml('a') + msgs + pushHtml('me');

  const quick = (world ? QUICK_WORDS.slice(0, 5) : ['互赞呀', '排位有没有？', '来个野王哥哥', '想打娱乐赛～', '求带'])
    .map(w => `<button class="qp-btn" data-act="quick" data-w="${w}">${w}</button>`).join('');

  // 右侧队伍列表
  const sideRows = RECRUITS.slice(0, 5).map(r => `
    <div class="friend-row" style="padding:8px 10px;">
      <div class="fr-avatar" style="width:36px;height:36px;font-size:17px;">${r.emo}<div class="fr-lv" style="font-size:7px">${r.lv}</div></div>
      <div class="fr-info">
        <div class="fr-name" style="font-size:12px">${r.name} <span class="lv-tag vip">V${r.lv}</span></div>
        <div class="fr-sub" style="font-size:10px">💎高级池 · 剩余 ${r.left} · ${r.fishers}/7人</div>
      </div>
      <button class="btn btn-blue btn-sm" style="padding:3px 10px;font-size:10px;" data-act="goto-friend" data-name="${r.name}">进鱼塘</button>
    </div>
  `).join('');

  $('#screen-chat').innerHTML = `
    <div class="split-lr fade-in">
      <div class="split-left" style="display:flex;flex-direction:column;">
        <div class="htabs">${tabBtns}</div>
        ${world ? '<div style="padding:8px 14px;text-align:center;font-size:11px;color:var(--text-dim);border-bottom:1px solid var(--divider);">💬 来农场世界频道，找钓鱼搭子！</div>' : ''}
        <div class="chat-msg-list" id="chatList">${chatBody}</div>
        <div class="quick-phrases">${quick}</div>
        <div class="chat-input-bar">
          <button class="cib-btn" data-act="lv-tip">🎙️</button>
          <input class="cib-input" placeholder="请点击输入…" readonly>
          <button class="cib-btn" data-act="lv-tip">😊</button>
          <button class="cib-btn" data-act="lv-tip">🖼️</button>
          <button class="btn btn-blue btn-sm" data-act="quick" data-w="来钓鱼了!">发送</button>
        </div>
      </div>
      <div class="split-right">
        <div class="panel-head" style="flex-shrink:0;"><span class="ph-title gold"><span class="ph-icon">📢</span> 队伍推荐 · 钓鱼招募</span></div>
        <div style="flex:1;overflow-y:auto;padding:6px;">${sideRows}</div>
        <div style="padding:8px;display:flex;gap:6px;border-top:1px solid var(--divider);flex-shrink:0;">
          <button class="btn btn-ghost btn-sm" style="flex:1;" data-act="lv-tip">换一批</button>
        </div>
      </div>
    </div>
  `;
};

function sendQuick(w) {
  const list = $('#chatList');
  list.insertAdjacentHTML('beforeend', `
    <div class="chat-msg slide-up" style="flex-direction:row-reverse;">
      <div class="cm-avatar">🧑‍🌾</div>
      <div class="cm-body" style="text-align:right;">
        <div class="cm-meta" style="justify-content:flex-end;">
          <span class="cm-name">我</span><span class="lv-tag">农场 Lv.${S.farmLevel}</span><span style="color:var(--cyan)">♂</span>
        </div>
        <div class="cm-bubble" style="background:linear-gradient(135deg,rgba(226,192,116,0.12),rgba(180,150,62,0.08));border-color:var(--border-gold);border-radius:12px 4px 12px 12px;color:var(--gold);display:inline-block;">${w}</div>
      </div>
    </div>`);
  list.scrollTop = list.scrollHeight;
}

/* ---- 开启鱼塘 ---- */
renderers.pond = () => {
  const t = S.curPool, P = POOLS[t];
  const used = S.used[t], left = P.dailyMax - used;
  const price = P.prices[Math.min(used, P.prices.length - 1)];
  const dots = Array.from({ length: P.dailyMax }, (_, i) =>
    `<i style="display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:3px;background:${i < used ? 'rgba(60,110,170,0.15)' : 'var(--gold)'};border:1px solid ${i < used ? 'transparent' : 'rgba(226,192,116,0.3)'}"></i>`
  ).join('');
  const ended = S.phase !== 'open';
  const advFree = t === 'adv' && S.mobaTicket > 0;

  renderTopbar({
    back: 'home',
    title: '🎣 开启鱼塘',
    subtitle: t === 'adv' ? '高级池 · 高概率出稀有鱼' : '普通池 · 稳定收益',
    curs: defaultCurs(),
  });
  renderBottombar(null);

  $('#screen-pond').innerHTML = `
    <div class="split-lr fade-in">
      <div class="split-left" style="padding:14px;">
        <div class="pool-tabs">
          <button class="${t === 'normal' ? 'active' : ''}" data-pool="normal">普通池</button>
          <button class="adv ${t === 'adv' ? 'active' : ''}" data-pool="adv">高级池 💎</button>
        </div>
        <div class="pool-hero ${t === 'adv' ? 'adv' : ''}">${P.hero}<div class="pool-hero-label">${P.name}</div></div>
        
        ${advFree ? `<div class="notice" style="margin-top:10px;border-color:var(--border-gold);"><span class="n-icon">🎁</span> <span>检测到 <b>MOBA免费高级池券 ×${S.mobaTicket}</b>，本次可免费开启！</span></div>` : ''}

        ${ended ? `<button class="btn btn-gray btn-full btn-lg" disabled>玩法已结束，无法开塘</button>`
          : left <= 0 ? `<button class="btn btn-gray btn-full btn-lg" disabled>今日次数已用完（次日05:00重置）</button>`
          : `<button class="btn ${t === 'adv' ? '' : 'btn-blue'} btn-full btn-lg" data-act="confirm-open" data-pool="${t}" style="margin-top:14px;">
              ${advFree ? '使用免费券开启' : `投放鱼饵开启（${P.curIcon}${price}）`}
            </button>`
        }
      </div>
      
      <aside class="split-right panel" style="border-left:none;">
        <div class="panel-head"><span class="ph-title gold"><span class="ph-icon">📋</span> 鱼池信息</span></div>
        <div style="padding:12px;">
          <div class="info-row"><span>S品阶以上概率</span><b style="color:${P.color}">${P.sProb}</b></div>
          <div class="info-row"><span>今日剩余次数</span><span>${dots} <b style="margin-left:6px;color:#fff">${left}/${P.dailyMax}</b></span></div>
          <div class="info-row"><span>本次开启价格</span><b style="color:${P.color}">${P.curIcon} ${price} ${P.curName}</b></div>
          <div class="info-row"><span>开放时长</span><b style="color:#fff">开塘后 10 分钟</b></div>
          <div class="info-row"><span>可被钓次数</span><b style="color:#fff">共10次（自己3 / 好友7）</b></div>
          
          <div class="section-label gold">🐟 普通池 vs 高级池</div>
          <div style="font-size:12px;line-height:1.9;color:var(--text-sub);">
            · 普通池：<b style="color:var(--gold)">农场币</b>，S品阶以上 <b style="color:var(--gold)">10%</b><br>
            · 高级池：<b style="color:var(--gold)">钻石</b>，S品阶以上 <b style="color:var(--gold)">30%</b>，好友收到推送<br>
            · 每日各 <b style="color:var(--gold)">3 次</b>，价格递增，次日05:00重置
          </div>
        </div>
      </aside>
    </div>
  `;
};

/* ---- 聚众钓鱼（参考截图1 游戏视角风格） ---- */
function buffStrip() {
  const n = S.pond.activeN;
  let rules = [];
  if (n >= 5) rules = COFISH_BUFF[5]; else if (n >= 3) rules = COFISH_BUFF[3]; else if (n >= 2) rules = COFISH_BUFF[2];
  if (!rules.length) return '<div class="buff-pill" style="width:100%;text-align:center;background:rgba(30,55,90,0.3);border-color:var(--border);color:var(--text-dim)">独自垂钓中 · 招呼好友触发共钓BUFF</div>';
  return rules.map(r => `<div class="buff-pill">✨ ${r}</div>`).join('');
}
function fisherList() {
  let html = `<div class="friend-row" style="padding:6px 8px;">
    <div class="fr-avatar" style="width:28px;height:28px;font-size:14px;">🧑‍🌾</div>
    <div class="fr-info"><div class="fr-name" style="font-size:12px">我 <span style="color:var(--cyan)">${S.pond.mine}/3</span></span></div>
  </div>`;
  for (let i = 0; i < 7; i++) {
    const f = RECRUITS[i];
    if (i < S.pond.friend && f) html += `<div class="friend-row" style="padding:6px 8px;">
      <div class="fr-avatar" style="width:28px;height:28px;font-size:14px;">${f.emo}</div>
      <div class="fr-info"><div class="fr-name" style="font-size:12px;color:var(--text-main)">${f.name.slice(0, 3)}</div></div>
    </div>`;
    else html += `<div class="friend-row" style="padding:6px 8px;opacity:.35;">
      <div class="fr-avatar" style="width:28px;height:28px;font-size:12px;background:rgba(30,50,80,0.3);">+</div>
      <div class="fr-info"><div class="fr-name" style="font-size:12px;color:var(--text-dim)">空位</div></div>
    </div>`;
  }
  return html;
}
renderers.fishing = () => {
  const p = S.pond;

  renderTopbar({
    back: '',
    title: '🎣 聚众钓鱼',
    curs: [{ icon: '🎫', bg: 'linear-gradient(135deg,#ff9a9a,#ff5d5d)', val: S.coupon }],
  });

  renderBottombar([
    { type: 'mini', icon: '🎤', label: '语音', act: 'lv-tip' },
    { type: 'mini', icon: '📷', label: '镜头', act: 'lv-tip' },
    { type: 'spacer' },
    { type: 'primary', label: '离开鱼塘', act: 'leave-fishing', gold: true },
  ]);

  $('#screen-fishing').innerHTML = `
    <div class="split-lr fade-in">
      <div class="split-left" style="padding:10px 14px;">
        <!-- HUD 信息条 -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div class="timer-display" id="fishTimer">⏱ ${mmss(p.time)}</div>
          <div style="font-size:11px;color:var(--text-dim);margin-left:auto;">今日 ${S.dailyFished}/30 · 本塘 ${p.total}/10</div>
        </div>

        <!-- BUFF 条 -->
        <div class="buff-bar" id="buffStrip">${buffStrip()}</div>

        <!-- 水面/游戏场景 -->
        <div class="water-area" id="water">
          <div class="swim-fish" style="top:18%;animation-delay:0s">🐠</div>
          <div class="swim-fish" style="top:46%;animation-delay:1.6s">🐟</div>
          <div class="swim-fish" style="top:68%;animation-delay:3s">🦐</div>
          <div class="bobber" id="bobber">🎣</div>
          <div class="cast-hint" id="castHint">点击水面抛竿 · 浮标抖动时立即提竿</div>
        </div>

        <!-- 操作按钮 -->
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn btn-blue" style="flex:1;" data-act="call-friends">📣 招呼好友共钓</button>
          <button class="btn" style="flex:1;" data-act="cast">🎣 抛竿钓鱼</button>
        </div>
      </div>

      <!-- 右侧钓友列表 -->
      <aside class="split-right panel" style="border-left:none;">
        <div class="panel-head"><span class="ph-title gold"><span class="ph-icon">🎣</span> 本塘钓友</span></div>
        <div class="scroll-area" style="padding:8px;" id="fishers">${fisherList()}</div>
        <div style="padding:10px 12px;font-size:11px;line-height:1.7;color:var(--text-sub);border-top:1px solid var(--divider);">
          · 共可钓 <b style="color:var(--gold)">10 次</b>（自己3/好友7）<br>
          · 好友来钓，农场主返利＝售价×1%<br>
          · 累计 <b style="color:var(--gold)">7 次</b> 触发钓鱼宝箱<br>
          · 多人同钓触发<b style="color:var(--gold)">共钓BUFF</b>
        </div>
      </aside>
    </div>
  `;
  startTimer();
};
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
function startTimer() {
  clearInterval(S.pond.timer);
  S.pond.timer = setInterval(() => {
    S.pond.time--;
    const el = $('#fishTimer'); if (el) el.textContent = '⏱ ' + mmss(S.pond.time);
    if (S.pond.time <= 0) { clearInterval(S.pond.timer); S.pond.open = false; toast('本次鱼塘已自然结束'); go('home'); }
  }, 1000);
}

/* 抛竿 */
function doCast() {
  if (!S.pond.open) { toast('鱼塘未开启'); return; }
  if (S.pond.mine >= 3) { toast('你在本塘的钓鱼次数已用完（自己3次）'); return; }
  if (S.dailyFished >= 30) { toast('今日钓鱼已达上限30次'); return; }
  const bob = $('#bobber'), hint = $('#castHint');
  bob.classList.add('bite'); hint.textContent = '🐟 有鱼咬钩！正在收线…';
  setTimeout(() => {
    bob.classList.remove('bite');
    const f = rollFish();
    S.pond.mine++; S.pond.total++; S.dailyFished++;
    addFish(f);
    showCatch(f);
    afterFishEvents();
    refreshFishHud();
  }, 900);
}
function refreshFishHud() {
  const p = S.pond;
  const hud = $('.hud-times', $('#screen-fishing')) || $('div[class*="margin-left:auto"]', $('#screen-fishing'));
  if (hud && hud.textContent.includes('今日')) hud.textContent = `今日 ${S.dailyFished}/30 · 本塘 ${p.total}/10`;
  const fs = $('#fishers'); if (fs) fs.innerHTML = fisherList();
  const bs = $('#buffStrip'); if (bs) bs.innerHTML = buffStrip();
}

/* 概率掉落 */
function rollFish() {
  const adv = S.pond.type === 'adv';
  let sBonus = S.pond.activeN >= 5 ? 10 : 0;
  const sProb = (adv ? 30 : 10) + sBonus;
  let w;
  if (rand(1, 100) <= sProb) w = rand(4, 6); else w = rand(0, 3);
  if (S.pond.activeN >= 2 && w < 3 && rand(1, 100) <= 30) w = 3;
  const pool = adv
    ? ['red', 'orange', 'orange', 'purple', 'purple', 'blue', 'blue', 'blue', 'green', 'green']
    : ['orange', 'purple', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green', 'green'];
  const q = pick(pool);
  const candidates = FISH.filter(f => f.q === q);
  const fish = pick(candidates);
  let m = 0; const mutProb = S.pond.activeN >= 3 ? 20 : 5;
  if (rand(1, 100) <= mutProb) m = rand(1, 3);
  return { id: fish.id, w, m };
}
function addFish(f) {
  const ex = S.warehouse.find(x => x.id === f.id && x.w === f.w && x.m === f.m);
  if (ex) ex.n++; else S.warehouse.push({ ...f, n: 1 });
  S.caught.add(f.id);
}
function showCatch(f) {
  const fo = f_obj(f.id), q = Q[fo.q];
  const price = fishPrice(f);
  const lucky = fo.id === 1 ? '<div style="color:var(--gold);font-weight:800;margin-top:4px">🍀 好运上钩！</div>' : '';
  modal(`<button class="modal-close" data-close>×</button>
    <div style="font-size:52px;margin-bottom:4px;text-align:center">${fo.emoji || fo.emo}</div>
    <h3 style="color:${q.color};text-align:center;margin-bottom:8px">${fo.name} <span style="font-size:13px;background:${q.color}22;padding:2px 10px;border-radius:6px">${q.name}</span></h3>
    <div style="font-size:12px;color:var(--text-sub);text-align:center;margin-bottom:8px">
      重量 ${WEIGHTS[f.w]} ${f.m ? `· ${MUTATIONS[f.m]} ` : ''}· 预计售价 <b style="color:var(--gold)">🎫 ${price}</b>
    </div>
    ${lucky}
    <button class="btn btn-full btn-lg" style="margin-top:16px" data-close>放入仓库</button>`);
}

/* 钓鱼后事件 */
function afterFishEvents() {
  if (S.pond.total === 7) setTimeout(triggerTreasure, 600);
}
function callFriends() {
  if (!S.pond.open) { toast('请先开启鱼塘'); return; }
  if (S.pond.friend >= 7) { toast('好友钓鱼位已满（7名）'); return; }
  const f = RECRUITS[S.pond.friend];
  S.pond.friend++; S.pond.total++;
  S.pond.activeN = Math.min(1 + S.pond.friend, 5);
  const rebate = rand(20, 90);
  S.coupon += Math.round(rebate * 0.01 * 100) / 1;
  refreshFishHud();
  toast(`📣 <b>${f.name}</b> 来你的鱼塘钓鱼啦！返利 +🎫${Math.max(1, Math.round(rebate * 0.1))}`);
  const n = S.pond.activeN;
  if ([2, 3, 5].includes(n)) {
    const names = { 2: '双纶对弈', 3: '三影垂纶', 5: '五朋钓海' };
    setTimeout(() => toast(`✨ 触发共钓BUFF · <b>${names[n]}</b>（${n}人共钓）`), 700);
  }
  afterFishEvents();
}
function triggerTreasure() {
  const tier = pick(['blue', 'purple', 'gold', 'blue', 'purple']);
  const T = TREASURE[tier]; const reward = rand(T.min, T.max);
  S.coupon += reward;
  modal(`<button class="modal-close" data-close">×</button>
    <div style="font-size:54px;text-align:center">🎁</div>
    <h3 style="color:${T.color};text-align:center;">钓鱼宝箱 · ${T.name}</h3>
    <p style="font-size:13px;color:var(--text-sub);text-align:center;margin:6px 0 14px">本塘累计钓鱼达 7 次触发！所有参与者共享。</p>
    <div style="font-size:22px;font-weight:900;color:var(--gold);text-align:center;">+🎫 ${reward} 兑换券</div>
    <button class="btn btn-full btn-lg" style="margin-top:14px" data-close>领取奖励</button>`);
}

/* ---- 仓库 ---- */
let whSel = null;
renderers.warehouse = () => {
  const expired = S.phase === 'buffer';
  const cells = S.warehouse.map((it, idx) => {
    const fo = f_obj(it.id), q = Q[fo.q];
    return `<div class="wh-cell ${whSel === idx ? 'selected' : ''}" data-act="sel-fish" data-idx="${idx}">
      <div class="emoji">${fo.emoji || fo.emo}</div>
      ${it.n > 1 ? `<div style="position:absolute;top:3px;right:5px;background:var(--red);color:#fff;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700;">×${it.n}</div>` : ''}
      <div class="name">${fo.name}</div>
      <div class="tier tier-${q.cls}">${q.name} · ${WEIGHTS[it.w]}${it.m ? ' 变异' : ''}</div>
    </div>`;
  }).join('');

  let sellHtml = '';
  if (whSel != null && S.warehouse[whSel]) {
    const it = S.warehouse[whSel], fo = f_obj(it.id);
    const unit = expired ? 1 : fishPrice(it);
    sellHtml = `<div style="flex:1;">
      <div style="font-size:12px;color:var(--text-sub)">已选 ${fo.name} ×${it.n}</div>
      <div style="font-weight:700;color:#fff;">单价 ${expired ? '🪙' : '🎫'} ${unit}${expired ? ' (过期价)' : ''} · 总计 ${unit * it.n}</div>
    </div>
    <button class="btn btn-sm" data-act="sell-one">出售1个</button>
    <button class="btn btn-blue btn-sm" data-act="sell-all">全部出售</button>`;
  } else {
    sellHtml = `<div style="flex:1;font-size:12px;color:var(--text-sub)">选择水产后出售，按品阶/重量/变异定价</div>`;
  }

  renderTopbar({
    back: 'home',
    title: '📦 仓库',
    curs: defaultCurs(),
  });
  renderBottombar(null);

  $('#screen-warehouse').innerHTML = `
    <div class="fade-in" style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div style="display:flex;gap:6px;padding:8px 10px;flex-shrink:0;">
        <button class="btn btn-ghost btn-sm">道具</button>
        <button class="btn btn-ghost btn-sm">种子</button>
        <button class="btn btn-ghost btn-sm">装饰</button>
        <button class="btn btn-gold btn-sm" style="background:linear-gradient(135deg,rgba(226,192,116,0.12),rgba(180,150,62,0.06));color:var(--gold);border-color:var(--border-gold);">水产 🐟</button>
      </div>
      <div class="scroll-area">
        ${expired ? `<div class="notice" style="margin:10px 14px;"><span class="n-icon">⚠️</span> <span>缓冲期已结束，鱼获仅可按<b>过期价(1金币)</b>出售。</span></div>` : ''}
        <div class="wh-grid">${cells || '<div style="padding:24px;text-align:center;color:var(--text-dim);">仓库暂无水产</div>'}</div>
      </div>
      <div class="sell-strip">${sellHtml}</div>
    </div>
  `;
};
function sellFish(all) {
  const it = S.warehouse[whSel]; if (!it) return;
  const expired = S.phase === 'buffer';
  const unit = expired ? 1 : fishPrice(it);
  const cnt = all ? it.n : 1;
  if (expired) S.farmCoin += unit * cnt; else S.coupon += unit * cnt;
  it.n -= cnt;
  if (it.n <= 0) { S.warehouse.splice(whSel, 1); whSel = null; }
  toast(`出售成功 +${expired ? '🪙' : '🎫'} ${unit * cnt}`);
  renderers.warehouse();
}

/* ---- 兑换商店 ---- */
renderers.shop = () => {
  const closed = S.phase === 'buffer';
  const grid = GIFTS.map((g, i) => `
    <div class="shop-cell">
      <div class="icon">${g.ic}</div>
      <div class="name">${g.name}</div>
      <div style="font-size:11px;color:var(--text-sub);margin:2px 0">${g.lim}</div>
      <button class="btn btn-sm ${S.coupon >= g.cost ? '' : 'btn-gray'}" style="width:100%;" data-act="redeem" data-i="${i}">🎫 ${g.cost}</button>
    </div>
  `).join('');

  renderTopbar({
    back: 'home',
    title: '🛒 兑换商店',
    curs: [{ icon: '🎫', bg: 'linear-gradient(135deg,#ff9a9a,#ff5d5d)', val: S.coupon }],
  });
  renderBottombar(null);

  $('#screen-shop').innerHTML = `
    <div class="fade-in scroll-area">
      ${closed ? `<div class="notice" style="margin:10px 14px;"><span class="n-icon">ℹ️</span> <span>缓冲期已结束，兑换商店入口关闭（此处为演示展示）。</span></div>` :
        `<div class="notice" style="margin:10px 14px;"><span class="n-icon">🎁</span> <span>用<b>兑换券</b>兑换：小屋装修资源 / 种子 / 亲密度道具 / 元流皮肤 / 农场币</span></div>`
      }
      <div class="shop-grid">${grid}</div>
    </div>
  `;
};
function redeem(i) {
  if (S.phase === 'buffer') { toast('兑换商店已关闭'); return; }
  const g = GIFTS[i];
  if (S.coupon < g.cost) { toast('兑换券不足'); return; }
  S.coupon -= g.cost;
  if (g.name.includes('农场币')) S.farmCoin += 1000;
  toast(`兑换成功：${g.ic} ${g.name}`);
  renderers.shop();
}

/* ---- 水产图鉴 ---- */
renderers.codex = () => {
  const order = ['red', 'orange', 'purple', 'blue', 'green'];
  const sorted = [...FISH].sort((a, b) => order.indexOf(a.q) - order.indexOf(b.q));
  const got = S.caught.size;
  const grid = sorted.map(f => {
    const has = S.caught.has(f.id), q = Q[f.q];
    return `<div class="codex-cell ${has ? '' : 'locked'}" data-act="codex-info" data-id="${f.id}">
      <div class="emoji">${f.emoji || f.emo}</div>
      <div class="name">${has ? f.name : '???'}</div>
      ${has ? '' : `<div style="position:absolute;top:4px;right:4px;font-size:12px;">🔒</div>`}
    </div>`;
  }).join('');

  renderTopbar({
    back: 'activity',
    title: '📖 水产图鉴',
  });
  renderBottombar(null);

  $('#screen-codex').innerHTML = `
    <div class="fade-in scroll-area">
      <div class="notice" style="margin:10px 14px 12px;"><span class="n-icon">📖</span> <span>已收录 <b>${got}/20</b> 种水产。属性：品阶(5) · 重量(7级) · 变异(10种)</span></div>
      <div class="codex-grid">${grid}</div>
    </div>
  `;
};

/* ---- 活动中心 ---- */
renderers.activity = () => {
  const ended = S.phase !== 'open';

  renderTopbar({
    back: 'home',
    title: '🏆 活动中心',
  });
  renderBottombar(null);

  $('#screen-activity').innerHTML = `
    <div class="fade-in split-lr">
      <div class="split-left" style="padding:14px;">
        <div class="kv-banner">
          <div class="kv-deco" style="top:14px;left:18px">🎏</div>
          <div class="kv-deco" style="bottom:16px;right:22px">🐟</div>
          <h1>锦鲤钓鱼节</h1>
          <div class="kv-sub">收菜 · 开塘 · 聚众钓鱼 · 兑好礼</div>
        </div>
        <div class="cd-numbers" id="cd"></div>
        <div class="panel" style="font-size:12px;line-height:1.8;padding:14px;margin-top:4px;">
          <b>活动时间说明</b><br>
          · 活动进行时间：约6周（覆盖2027春节）<br>
          · 兑换缓冲期：结束后额外 1 周<br>
          · 缓冲期结束：道具1:1折算农场币并邮件发放
        </div>
      </div>
      <div class="split-right" style="border-left:1px solid var(--divider);">
        <div class="section-label gold" style="margin:10px 0 8px;padding-left:14px;">玩法入口</div>
        ${ended ? `<div class="notice" style="margin:0 10px 10px;"><span class="n-icon">⏰</span> <span>活动已结束，入口关闭；仓库与商店仍可用（缓冲期）。</span></div>` : ''}
        <div class="entry-list">
          <div class="entry-item" data-act="${ended ? 'pond-ended' : 'open-pond'}">
            <div class="ei-icon" style="background:linear-gradient(135deg,var(--blue-dark),var(--blue-primary));">🎣</div>
            <div class="ei-text"><div class="ei-name">开启鱼塘 · 聚众钓鱼</div><div class="ei-desc">普通池/高级池，招呼好友共钓</div></div>
            <div class="ei-arrow">›</div>
          </div>
          <div class="entry-item" data-go="shop">
            <div class="ei-icon" style="background:linear-gradient(135deg,var(--purple-dim),var(--purple));">🎁</div>
            <div class="ei-text"><div class="ei-name">兑换商店</div><div class="ei-desc">用兑换券兑换皮肤/装修/种子等</div></div>
            <div class="ei-arrow">›</div>
          </div>
          <div class="entry-item" data-go="codex">
            <div class="ei-icon" style="background:linear-gradient(135deg,#3b9dff,#2f7fd6);">📖</div>
            <div class="ei-text"><div class="ei-name">水产图鉴</div><div class="ei-desc">收录全部20种水产</div></div>
            <div class="ei-arrow">›</div>
          </div>
          <div class="entry-item" data-go="moba">
            <div class="ei-icon" style="background:linear-gradient(135deg,#ff8a3c,#ff5d5d);">⚔️</div>
            <div class="ei-text"><div class="ei-name">MOBA关联任务</div><div class="ei-desc">完成对局领免费高级池券</div></div>
            <div class="ei-arrow">›</div>
          </div>
          <div class="entry-item" data-act="records">
            <div class="ei-icon" style="background:linear-gradient(135deg,#3fb950,#2e9440);">📜</div>
            <div class="ei-text"><div class="ei-name">钓鱼记录</div><div class="ei-desc">谁来钓过 · 钓过什么鱼</div></div>
            <div class="ei-arrow">›</div>
          </div>
        </div>
      </div>
    </div>
  `;
  startCountdown();
};

function startCountdown() {
  const el = $('#cd'); if (!el) return;
  const data = S.phase === 'open' ? [12, 8, 42, 15] : S.phase === 'ended' ? [5, 3, 20, 0] : [0, 0, 0, 0];
  const target = S.phase === 'open' ? '活动倒计时' : (S.phase === 'ended' ? '缓冲期倒计时' : '已结束');
  el.innerHTML = `<div style="align-self:center;font-size:11px;color:var(--text-dim);margin-right:4px;">${target}</div>` +
    [['天', data[0]], ['时', data[1]], ['分', data[2]], ['秒', data[3]]].map(([u, v]) =>
      `<div class="cd-block"><b>${String(v).padStart(2, '0')}</b><span>${u}</span></div>`
    ).join('');
}

/* ---- MOBA 任务 ---- */
renderers.moba = () => {
  const advLeft = POOLS.adv.dailyMax - S.used.adv;
  const reached = advLeft <= 0;

  renderTopbar({
    back: 'activity',
    title: '⚔️ MOBA关联任务',
  });
  renderBottombar(null);

  $('#screen-moba').innerHTML = `
    <div class="fade-in scroll-area" style="padding:14px;">
      <div class="panel" style="padding:16px;">
        <div class="entry-item" style="margin:0;">
          <div class="ei-icon" style="width:48px;height:48px;font-size:26px;">⚔️</div>
          <div class="ei-text">
            <div class="ei-name">完成 1 场 5V5 匹配/排位/巅峰赛</div>
            <div class="ei-desc">奖励：免费开高级池券 ×1（当日有效，次日05:00过期）</div>
          </div>
          ${reached ? '<button class="btn btn-gray btn-sm" disabled>已达上限</button>'
            : '<button class="btn btn-sm" data-act="moba-claim">领取</button>'}
        </div>
        <div style="font-size:12px;color:var(--text-sub);line-height:1.8;margin-top:14px;">
          · 当前持有免费券：<b style="color:var(--gold)">×${S.mobaTicket}</b><br>
          · 今日高级池剩余次数：<b style="color:#fff">${advLeft}/3</b><br>
          ${reached ? '· 今日高级池次数已达上限，任务入口关闭' : ''}
        </div>
      </div>
      <div class="panel" style="font-size:12px;line-height:1.8;padding:14px;margin-top:10px;">
        <b>设计目的</b><br>带动 MOBA 主玩法与农场钓鱼联动，每日完成对局可白嫖一次高级池开塘机会。
      </div>
    </div>
  `;
};

function mobaClaim() {
  if (POOLS.adv.dailyMax - S.used.adv <= 0) { toast('今日高级池次数已达上限'); return; }
  S.mobaTicket++;
  toast('🎁 已领取免费高级池券 ×1');
  renderers.moba();
}

function codexInfo(id) {
  const f = f_obj(id), q = Q[f.q];
  if (!S.caught.has(id)) { toast('尚未钓到该水产'); return; }
  modal(`<button class="modal-close" data-close">×</button>
    <div style="font-size:48px;text-align:center">${f.emo}</div>
    <h3 style="color:${q.color};text-align:center;">${f.name} <span style="font-size:13px;background:${q.color}22;padding:2px 10px;border-radius:6px">${q.name}</span></h3>
    <p style="font-size:13px;color:var(--text-sub);text-align:center;margin:10px 0;">${f.desc}</p>
    <button class="btn btn-full btn-lg" style="margin-top:14px;" data-close>关闭</button>`);
}

function showRecords() {
  const rows = RECRUITS.slice(0, 4).map(r => {
    const f = pick(FISH);
    return `<div class="entry-item" style="margin-bottom:6px;">
      <div class="ei-icon" style="background:linear-gradient(135deg,rgba(42,109,184,0.2),rgba(30,74,130,0.12));">${r.emo}</div>
      <div class="ei-text"><div class="ei-name" style="color:#fff">${r.name}</div><div class="ei-desc">钓到 ${f.name}（${pick(WEIGHTS)}）· ${rand(1, 9)}分钟前</div></div>
    </div>`;
  }).join('');
  modal(`<button class="modal-close" data-close">×</button>
    <h3 style="text-align:center;">📜 钓鱼记录</h3>
    <div style="text-align:left;margin-top:12px;">${rows}</div>
    <button class="btn btn-full btn-lg" style="margin-top:14px;" data-close>关闭</button>`);
}

/* ================= 开塘逻辑 ================= */
function confirmOpen(type) {
  const P = POOLS[type], used = S.used[type];
  if (used >= P.dailyMax) { toast('今日次数已用完，次日05:00重置'); return; }
  const price = P.prices[Math.min(used, P.prices.length - 1)];
  const useFree = type === 'adv' && S.mobaTicket > 0;
  if (!useFree) {
    if (type === 'normal' && S.farmCoin < price) { toast('农场币不足'); return; }
    if (type === 'adv' && S.diamond < price) { toast('钻石不足'); return; }
  }
  if (useFree) S.mobaTicket--;
  else if (type === 'normal') S.farmCoin -= price; else S.diamond -= price;
  S.used[type]++;
  clearInterval(S.pond.timer);
  S.pond = { open: true, type, time: 600, total: 0, mine: 0, friend: 0, activeN: 1, timer: null };
  toast(`${useFree ? '使用免费券，' : ''}${P.name}已开启！`);
  go('fishing');
}

function gotoFriend(name) {
  const r = RECRUITS.find(x => x.name === name) || RECRUITS[0];
  clearInterval(S.pond.timer);
  S.pond = { open: true, type: 'adv', time: 300, total: r.fishers, mine: 0, friend: Math.min(r.fishers, 7), activeN: Math.min(1 + r.fishers, 5), timer: null };
  toast(`已前往 ${name} 的鱼塘，加入共钓！`);
  go('fishing');
}

/* ================= 事件委托 ================= */
function bindEvents() {
  document.body.addEventListener('click', e => {
    // 导航
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { go(goBtn.dataset.go); return; }

    // 弹窗关闭
    if (e.target.closest('[data-close]')) { closeModal(); return; }

    // 操作按钮
    const act = e.target.closest('[data-act]'); if (!act) return;
    switch (act.dataset.act) {
      case 'pond-locked': toast(`需农场 Lv.${S.reqLevel} 解锁鱼塘`); break;
      case 'pond-ended': toast('限时玩法已结束'); break;
      case 'open-pond':
        if (S.phase !== 'open') { toast('限时玩法已结束'); break; }
        if (S.farmLevel < S.reqLevel) { toast(`需 Lv.${S.reqLevel}`); break; }
        go('pond'); break;
      case 'confirm-open': confirmOpen(act.dataset.pool); break;
      case 'cast': doCast(); break;
      case 'call-friends': callFriends(); break;
      case 'leave-fishing': clearInterval(S.pond.timer); go('home'); break;
      case 'sel-fish': whSel = +act.dataset.idx; renderers.warehouse(); break;
      case 'sell-one': sellFish(false); break;
      case 'sell-all': sellFish(true); break;
      case 'redeem': redeem(+act.dataset.i); break;
      case 'goto-friend': gotoFriend(act.dataset.name); break;
      case 'quick': sendQuick(act.dataset.w); break;
      case 'lv-tip': toast('功能开发中…'); break;
      case 'codex-info': codexInfo(+act.dataset.id); break;
      case 'moba-claim': mobaClaim(); break;
      case 'records': showRecords(); break;
      case 'goto-social': go('social'); break;
      case 'social-info': toast('查看好友详情…'); break;
    }
  });

  // 标签切换
  document.body.addEventListener('click', e => {
    const pb = e.target.closest('[data-pool]:not([data-act])');
    if (pb && pb.closest('.pool-tabs')) { S.curPool = pb.dataset.pool; renderers.pond(); }

    const ct = e.target.closest('[data-chattab]');
    if (ct) { S.chatTab = ct.dataset.chattab === 'world' ? 'world' : 'all'; renderers.chat(); }

    const hf = e.target.closest('[data-hftab]');
    if (hf) { homeFrTab = hf.dataset.hftab; renderers.home(); }

    const sm = e.target.closest('[data-smtab]');
    if (sm) { socialMainTab = sm.dataset.smtab; renderers.social(); }
  });

  // 水面点击
  document.body.addEventListener('click', e => {
    if (e.target.closest('#water')) doCast();
  });
}

/* ================= 初始化 ================= */
window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  go('home');
});
