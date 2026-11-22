/* Atlas v3 — local-first account relationship manager */
(() => {
  'use strict';

  const KEY = 'atlas.v1';
  // reduced motion: one cached query, and every element.animate() collapses to its end state
  // (the CSS @media rule can't reach WAAPI animations). onfinish/finished still fire.
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => RM.matches;
  const _animate = Element.prototype.animate;
  Element.prototype.animate = function (k, o) {
    if (RM.matches && !(o && o.timeline)) o = typeof o === 'number' ? 0 : { ...o, duration: 0, delay: 0, endDelay: 0 };
    return _animate.call(this, k, o);
  };
  // card skins: the key colour (used for threads, tags, glow) and the gradient the card is painted with
  const SKINS = {
    '#0a84ff': ['深海', '#56c6ff 0%, #0a84ff 42%, #3b2fd0 100%'],
    '#30d158': ['青柠', '#d2f56a 0%, #30d158 48%, #0b7f6a 100%'],
    '#ff9f0a': ['落日', '#ffdf5c 0%, #ff9f0a 42%, #ff3d5a 100%'],
    '#ff375f': ['莓果', '#ff9bb8 0%, #ff375f 46%, #9e1470 100%'],
    '#bf5af2': ['极光', '#ff86dc 0%, #bf5af2 44%, #4636ee 100%'],
    '#64d2ff': ['冰川', '#9df0ff 0%, #4cc3fb 40%, #2a6cf0 100%'],
    '#ff453a': ['珊瑚', '#ffa36b 0%, #ff453a 46%, #c1185f 100%'],
    '#5e5ce6': ['靛蓝', '#9a98ff 0%, #5e5ce6 46%, #1f1b78 100%'],
    '#00c7be': ['海湾', '#8af5d6 0%, #00c7be 44%, #0a62b0 100%'],
    '#3a3a3c': ['曜石', '#76767c 0%, #3a3a3c 46%, #0d0d10 100%'],
  };
  const COLORS = Object.keys(SKINS).slice(0, 10);   // the palette; provider skins are added for login cards
  // 微信 / Apple 登录卡: provider name, default key colour (with its own skin), field label and placeholder
  const LOGIN = {
    wechat: { name: '微信', color: '#07c160', field: '微信号', ph: 'wxid 或自定义微信号' },
    apple: { name: 'Apple 账户', short: 'Apple', color: '#1d1d1f', field: 'Apple ID', ph: 'name@icloud.com 或手机号' },
  };
  SKINS['#07c160'] = ['微信绿', '#7ee8a2 0%, #07c160 46%, #05785a 100%'];
  SKINS['#1d1d1f'] = ['石墨', '#c9ccd3 0%, #6e7079 34%, #2c2c30 68%, #111113 100%'];
  const KINDS = ['email', 'phone', 'login'];
  const provOf = i => i.provider === 'apple' ? 'apple' : 'wechat';
  const typeName = i => i.type === 'login' ? LOGIN[provOf(i)].name : i.type === 'phone' ? '手机号' : '邮箱';
  const skin = c => `linear-gradient(145deg, ${SKINS[c] ? SKINS[c][1] : `color-mix(in srgb, ${c} 70%, #fff) 0%, ${c} 50%, color-mix(in srgb, ${c} 70%, #000) 100%`})`;
  const CATS = ['社交', '购物', '支付金融', '开发', 'AI', '娱乐', '游戏', '出行', '工具', '加密', '其他'];
  // name, domain, category, brand colour
  const PRESETS = [
    ['微信', 'weixin.qq.com', '社交', '#07c160'], ['QQ', 'qq.com', '社交', '#12b7f5'], ['微博', 'weibo.com', '社交', '#e6162d'], ['小红书', 'xiaohongshu.com', '社交', '#ff2442'],
    ['知乎', 'zhihu.com', '社交', '#0066ff'], ['抖音', 'douyin.com', '娱乐', '#fe2c55'], ['哔哩哔哩', 'bilibili.com', '娱乐', '#fb7299'], ['网易云音乐', 'music.163.com', '娱乐', '#e60026'],
    ['淘宝', 'taobao.com', '购物', '#ff5000'], ['京东', 'jd.com', '购物', '#e1251b'], ['拼多多', 'pinduoduo.com', '购物', '#e02e24'], ['闲鱼', 'goofish.com', '购物', '#ffda44'],
    ['美团', 'meituan.com', '出行', '#ffc300'], ['携程', 'ctrip.com', '出行', '#2577e3'], ['12306', '12306.cn', '出行', '#3b6fd8'], ['高德地图', 'amap.com', '出行', '#0091ff'],
    ['支付宝', 'alipay.com', '支付金融', '#1677ff'], ['百度', 'baidu.com', '工具', '#2932e1'], ['GitHub', 'github.com', '开发', '#6e40c9'], ['Gitee', 'gitee.com', '开发', '#c71d23'],
    ['Cloudflare', 'cloudflare.com', '开发', '#f38020'], ['Vercel', 'vercel.com', '开发', '#555555'], ['Google', 'google.com', '工具', '#4285f4'], ['Apple ID', 'apple.com', '工具', '#8e8e93'],
    ['Microsoft', 'microsoft.com', '工具', '#00a4ef'], ['Notion', 'notion.so', '工具', '#6b6b6b'], ['Figma', 'figma.com', '工具', '#a259ff'], ['ChatGPT', 'chatgpt.com', 'AI', '#10a37f'],
    ['Claude', 'claude.ai', 'AI', '#d97757'], ['Gemini', 'gemini.google.com', 'AI', '#4796e3'], ['DeepSeek', 'deepseek.com', 'AI', '#4d6bfe'], ['Kimi', 'kimi.com', 'AI', '#1f1f1f'],
    ['Steam', 'steampowered.com', '游戏', '#1b2838'], ['Epic Games', 'epicgames.com', '游戏', '#313131'], ['米哈游', 'mihoyo.com', '游戏', '#2aa4f4'], ['Discord', 'discord.com', '社交', '#5865f2'],
    ['Telegram', 'telegram.org', '社交', '#26a5e4'], ['X', 'x.com', '社交', '#3a3a3a'], ['Instagram', 'instagram.com', '社交', '#e1306c'], ['Netflix', 'netflix.com', '娱乐', '#e50914'],
    ['Spotify', 'spotify.com', '娱乐', '#1db954'], ['YouTube', 'youtube.com', '娱乐', '#ff0000'], ['Binance', 'binance.com', '加密', '#f0b90b'], ['OKX', 'okx.com', '加密', '#3a3a3a'],
    ['MetaMask', 'metamask.io', '加密', '#f6851b'], ['PayPal', 'paypal.com', '支付金融', '#003087'], ['Amazon', 'amazon.com', '购物', '#ff9900'],
    ['QQ 邮箱', 'mail.qq.com', '工具', '#12b7f5'], ['网易邮箱', 'mail.163.com', '工具', '#d7000f'], ['Outlook', 'outlook.com', '工具', '#0078d4'], ['iCloud', 'icloud.com', '工具', '#3693f3'],
    ['快手', 'kuaishou.com', '娱乐', '#ff4906'], ['豆瓣', 'douban.com', '社交', '#2e963d'], ['腾讯视频', 'v.qq.com', '娱乐', '#ff7f00'], ['爱奇艺', 'iqiyi.com', '娱乐', '#00be06'],
    ['优酷', 'youku.com', '娱乐', '#1ebeff'], ['QQ 音乐', 'y.qq.com', '娱乐', '#31c27c'], ['喜马拉雅', 'ximalaya.com', '娱乐', '#f86442'], ['百度网盘', 'pan.baidu.com', '工具', '#06a7ff'],
    ['阿里云盘', 'alipan.com', '工具', '#637dff'], ['夸克', 'quark.cn', '工具', '#4a5cff'], ['钉钉', 'dingtalk.com', '工具', '#3296fa'], ['飞书', 'feishu.cn', '工具', '#3370ff'],
    ['企业微信', 'work.weixin.qq.com', '工具', '#2b85e4'], ['腾讯会议', 'meeting.tencent.com', '工具', '#006eff'], ['WPS', 'wps.cn', '工具', '#e8463a'], ['饿了么', 'ele.me', '出行', '#0097ff'],
    ['大众点评', 'dianping.com', '出行', '#ff6633'], ['滴滴出行', 'didiglobal.com', '出行', '#ff7e33'], ['飞猪', 'fliggy.com', '出行', '#ffc900'], ['去哪儿', 'qunar.com', '出行', '#00bcd4'],
    ['得物', 'dewu.com', '购物', '#1a1a1a'], ['唯品会', 'vip.com', '购物', '#f10180'], ['云闪付', 'unionpay.com', '支付金融', '#e60012'], ['招商银行', 'cmbchina.com', '支付金融', '#c8152d'],
    ['腾讯云', 'cloud.tencent.com', '开发', '#006eff'], ['阿里云', 'aliyun.com', '开发', '#ff6a00'], ['Hugging Face', 'huggingface.co', '开发', '#ffb000'], ['Docker', 'docker.com', '开发', '#1d63ed'],
    ['npm', 'npmjs.com', '开发', '#cb3837'], ['Cursor', 'cursor.com', 'AI', '#2f2f2f'], ['豆包', 'doubao.com', 'AI', '#3c6cff'], ['通义', 'tongyi.aliyun.com', 'AI', '#615ced'],
    ['智谱清言', 'chatglm.cn', 'AI', '#3859ff'], ['文心一言', 'yiyan.baidu.com', 'AI', '#2932e1'], ['Perplexity', 'perplexity.ai', 'AI', '#20808d'], ['Midjourney', 'midjourney.com', 'AI', '#3a3a3a'],
    ['OpenRouter', 'openrouter.ai', 'AI', '#6467f2'], ['Poe', 'poe.com', 'AI', '#5d5cde'], ['腾讯游戏', 'game.qq.com', '游戏', '#1e7cff'], ['网易游戏', 'game.163.com', '游戏', '#d7000f'],
    ['PlayStation', 'playstation.com', '游戏', '#0070d1'], ['Xbox', 'xbox.com', '游戏', '#107c10'], ['Nintendo', 'nintendo.com', '游戏', '#e60012'], ['TikTok', 'tiktok.com', '娱乐', '#fe2c55'],
    ['Facebook', 'facebook.com', '社交', '#1877f2'], ['WhatsApp', 'whatsapp.com', '社交', '#25d366'], ['Reddit', 'reddit.com', '社交', '#ff4500'], ['LinkedIn', 'linkedin.com', '社交', '#0a66c2'],
    ['Twitch', 'twitch.tv', '娱乐', '#9146ff'], ['Slack', 'slack.com', '工具', '#4a154b'], ['Zoom', 'zoom.us', '工具', '#0b5cff'], ['Dropbox', 'dropbox.com', '工具', '#0061ff'],
    ['Canva', 'canva.com', '工具', '#00c4cc'], ['Coinbase', 'coinbase.com', '加密', '#0052ff'], ['Bybit', 'bybit.com', '加密', '#f7a600'], ['Bitget', 'bitget.com', '加密', '#00f0ff'],
    ['Uber', 'uber.com', '出行', '#2b2b2b'], ['Airbnb', 'airbnb.com', '出行', '#ff385c'], ['Booking', 'booking.com', '出行', '#003580'], ['Visa', 'visa.com', '支付金融', '#1a1f71'],
  ];
  // the ones most people have, shown first in the picker
  // apps the user typed in by hand are remembered and show up in the picker
  const isPreset = n => PRESETS.some(p => p[0].toLowerCase() === n.toLowerCase());
  const readList = k => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  // apps removed from 我添加的 (lowercase names); local only, not synced
  const hiddenApps = () => new Set(readList('atlas.custom.hidden').map(x => String(x).toLowerCase()));
  function myApps() {
    const saved = readList('atlas.custom'), hidden = hiddenApps();
    const out = [], seen = new Set();
    const add = t => { const k = (t[0] || '').toLowerCase(); if (!k || seen.has(k) || hidden.has(k) || isPreset(t[0])) return; seen.add(k); out.push([t[0], t[1] || '', t[2] || '其他', '', customIcon({ icon: t[4] }) || '']); };
    saved.forEach(add); (state.accounts || []).slice().reverse().forEach(a => add([a.name, a.domain, a.category, '', a.icon]));
    return out;
  }
  // adding an app (by hand or from the App Store) brings it back if it had been removed from the list
  function rememberApp(name, domain, cat, icon, unhide = true) {
    if (!name || isPreset(name)) return;
    const k = name.toLowerCase(), hidden = hiddenApps();
    if (hidden.has(k)) { if (!unhide) return; hidden.delete(k); localStorage.setItem('atlas.custom.hidden', JSON.stringify([...hidden])); }
    const saved = readList('atlas.custom').filter(t => (t[0] || '').toLowerCase() !== k);
    saved.unshift(icon ? [name, domain || '', cat || '其他', '', icon] : [name, domain || '', cat || '其他']);
    try { localStorage.setItem('atlas.custom', JSON.stringify(saved.slice(0, 80))); } catch (e) { localStorage.setItem('atlas.custom', JSON.stringify(saved.slice(0, 20))); }
  }
  function forgetApp(name) {
    const k = (name || '').toLowerCase(); if (!k) return;
    localStorage.setItem('atlas.custom', JSON.stringify(readList('atlas.custom').filter(t => (t[0] || '').toLowerCase() !== k)));
    const hidden = hiddenApps(); hidden.add(k); localStorage.setItem('atlas.custom.hidden', JSON.stringify([...hidden].slice(-300)));
  }
  const POPULAR = ['微信', 'QQ', '支付宝', '淘宝', '京东', '拼多多', '抖音', '小红书', '哔哩哔哩', '微博', '美团', '知乎', '网易云音乐', '12306', '百度网盘', 'Apple ID', 'GitHub', 'Google', 'ChatGPT', 'Steam', '豆包', 'DeepSeek', 'Telegram', 'Microsoft'];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const zh = (a, b) => a.localeCompare(b, 'zh-CN');
  const DAY = 864e5;

  // ---------- state ----------
  let state = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } })();
  const ui = { tab: 'home', cat: '全部', privacy: localStorage.getItem('atlas.privacy') === '1', active: 0, kind: KINDS.includes(localStorage.getItem('atlas.kind')) ? localStorage.getItem('atlas.kind') : 'email' };
  // every item carries updatedAt; removed ids become tombstones, so two devices can merge
  const strip = o => { const { updatedAt, ...r } = o; return JSON.stringify(r); };
  let seen = new Map();
  const remember = () => { seen = new Map(); if (state) for (const k of ['identities', 'accounts']) for (const x of state[k]) seen.set(x.id, strip(x)); };
  const save = () => {
    const now = Date.now(); state.deleted = state.deleted || {};
    const live = new Set();
    for (const k of ['identities', 'accounts']) for (const x of state[k]) {
      live.add(x.id);
      if (seen.get(x.id) !== strip(x) || !x.updatedAt) x.updatedAt = now;
      delete state.deleted[x.id];
    }
    for (const id of seen.keys()) if (!live.has(id)) state.deleted[id] = now;
    remember();
    localStorage.setItem(KEY, JSON.stringify(state));
    Sync.schedule();
  };

  function demo() {
    const ids = [
      { id: uid(), type: 'email', value: 'me@gmail.com', label: '主力邮箱', color: COLORS[0], notes: '' },
      { id: uid(), type: 'phone', value: '+86 138 0000 1234', label: '主力手机号', color: COLORS[1], notes: '移动，已实名' },
      { id: uid(), type: 'email', value: 'shopping.fun@qq.com', label: '购物小号', color: COLORS[3], notes: '' },
      { id: uid(), type: 'email', value: 'dev@outlook.com', label: '开发专用', color: COLORS[4], notes: '' },
      { id: uid(), type: 'phone', value: '+86 170 0000 5678', label: '副卡', color: COLORS[2], notes: '', esim: true },
    ];
    ids.push({ id: uid(), type: 'login', provider: 'wechat', value: 'atlas_demo', label: '', color: LOGIN.wechat.color, notes: '', via: ids[1].id },
      { id: uid(), type: 'login', provider: 'apple', value: 'me@icloud.com', label: '', color: LOGIN.apple.color, notes: '', via: ids[1].id });
    const [g, p1, q, o, p2, wx, ap] = ids.map(i => i.id);
    const now = Date.now();
    const mk = (name, domain, category, identityIds, ago, notes = '') => ({ id: uid(), name, domain, category, identityIds, notes, createdAt: now - ago * DAY - Math.random() * 3e6 });
    return {
      demo: true,
      identities: ids,
      accounts: [
        mk('GitHub', 'github.com', '开发', [o, p1], 0, '已开两步验证'), mk('Claude', 'claude.ai', 'AI', [g], 0),
        mk('Cloudflare', 'cloudflare.com', '开发', [o], 1), mk('ChatGPT', 'chatgpt.com', 'AI', [g], 1),
        mk('小红书', 'xiaohongshu.com', '社交', [p2, wx], 3), mk('美团', 'meituan.com', '出行', [wx], 5), mk('拼多多', 'pinduoduo.com', '购物', [wx], 7), mk('Binance', 'binance.com', '加密', [o, p1], 3, '已完成 KYC'),
        mk('淘宝', 'taobao.com', '购物', [q, p1], 9), mk('京东', 'jd.com', '购物', [q, p2], 12),
        mk('微信', 'weixin.qq.com', '社交', [p1], 30), mk('支付宝', 'alipay.com', '支付金融', [p1], 30),
        mk('哔哩哔哩', 'bilibili.com', '娱乐', [p2], 40), mk('Steam', 'steampowered.com', '游戏', [q], 60, '令牌在主力手机上'),
        mk('Apple ID', 'apple.com', '工具', [g, p1], 90), mk('Notion', 'notion.so', '工具', [g], 120), mk('网易云音乐', 'music.163.com', '娱乐', [p2], 150), mk('Spotify', 'spotify.com', '娱乐', [ap], 20),
      ],
    };
  }

  // the wallet shows one kind at a time: emails, phone numbers, or 微信 / Apple login cards
  const deck = () => state.identities.filter(i => i.type === ui.kind);
  const cur = () => deck()[ui.active];
  function setKind(k, focusId) {
    if (k !== ui.kind) { ui.kind = k; localStorage.setItem('atlas.kind', k); }
    const d = deck(); ui.active = focusId ? Math.max(0, d.findIndex(i => i.id === focusId)) : 0;
  }
  // mainland China carrier from the number prefix
  function carrier(v) {
    const d = v.replace(/\D/g, '').replace(/^0086|^86(?=1\d{10}$)/, '');
    if (!/^1\d{10}$/.test(d)) { const m = v.trim().match(/^\+(\d{1,3})/); return m && m[1] !== '86' ? `+${m[1]}` : ''; }
    const p3 = d.slice(0, 3), p4 = d.slice(0, 4);
    if (/^(13[4-9]|147|148|15[0-27-9]|172|178|18[2-478]|195|197|198)$/.test(p3) && p4 !== '1349') return '中国移动';
    if (/^(13[0-2]|145|146|15[56]|16[67]|17[156]|18[56]|196)$/.test(p3)) return '中国联通';
    if (/^(133|1349|149|153|17[347]|18[019]|19[0139])$/.test(p3) || p4 === '1349') return '中国电信';
    if (p3 === '192') return '中国广电';
    return '';
  }
  const CHIP = '<svg class="chip" viewBox="0 0 40 30" aria-hidden="true"><rect x=".5" y=".5" width="39" height="29" rx="6"/><path d="M13 .5v9M27 .5v9M13 20.5v9M27 20.5v9M.5 10h12.5c2 0 2 10 0 10H.5M39.5 10H27c-2 0-2 10 0 10h12.5M13 15h14"/></svg>';
  // an eSIM has no physical card: a quiet outlined tag stands in for the gold chip
  const ESIM = '<span class="esim" aria-label="eSIM">eSIM</span>';
  const isESim = i => i.type === 'phone' && i.esim === true;
  const idById = id => state.identities.find(i => i.id === id);
  const accById = id => state.accounts.find(a => a.id === id);
  const accountsOf = id => state.accounts.filter(a => a.identityIds.includes(id)).sort((a, b) => zh(a.name, b.name));
  // the email / phone a login card is bound to; a dangling or odd reference counts as none
  const viaOf = i => { if (i.type !== 'login' || !i.via) return null; const v = idById(i.via); return v && (v.type === 'email' || v.type === 'phone') ? v : null; };
  const boundTo = id => state.identities.filter(i => i.type === 'login' && i.via === id && viaOf(i));

  function display(i) {
    const v = i.value;
    if (!ui.privacy) return v;
    if (i.type === 'email' || (i.type === 'login' && v.includes('@'))) { const [u, d = ''] = v.split('@'); return u.slice(0, 2) + '•••' + (d ? '@' + d : ''); }
    if (i.type === 'login' && provOf(i) === 'wechat') return [...v].slice(0, 2).join('') + '•••';
    if (i.type !== 'phone' && i.type !== 'login') return v.slice(0, 2) + '•••';
    const digits = v.replace(/\D/g, '');
    return digits.length > 7 ? '••• •••• ' + digits.slice(-4) : '••••';
  }
  const cleanDomain = d => (d || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
  // the account's own icon (uploaded, or from the App Store): a small square data: URL, synced with the data
  const customIcon = a => typeof a?.icon === 'string' && a.icon.length < 400000 && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(a.icon) ? a.icon : null;
  // bundled 192px icons for every preset, so common apps are sharp and load from this site
  const localIcon = a => {
    const d = cleanDomain(a.domain), n = (a.name || '').toLowerCase();
    const p = PRESETS.find(p => (d && (d === p[1] || d.endsWith('.' + p[1]))) || (!d && p[0].toLowerCase() === n));
    return p ? `icons/${p[1]}.png` : null;
  };
  const favSources = d => { d = cleanDomain(d); return d ? [`https://favicon.im/${d}?larger=true`, `https://${d}/apple-touch-icon.png`, `https://${d}/favicon.ico`, `https://www.google.com/s2/favicons?domain=${d}&sz=128`] : []; };
  function brand(a) {
    const d = cleanDomain(a.domain), n = (a.name || '').toLowerCase();
    const p = PRESETS.find(p => (d && (d === p[1] || d.endsWith('.' + p[1]))) || p[0].toLowerCase() === n);
    if (p) return p[3];
    let h = 0; for (const ch of (d || n || '?')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `hsl(${h % 360} 62% 48%)`;
  }

  // ---------- icons ----------
  const ICON = {
    email: '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7.5 8 5.5 8-5.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M10.5 5h3"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 9 15"><path d="M1.5 1.5 7.5 7.5l-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    tick: '<svg class="tick" viewBox="0 0 24 24" style="stroke-width:2.4"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    open: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    login: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg>',
    wechat: '<svg viewBox="0 0 24 24"><path d="M9.5 4C5.4 4 2.5 6.6 2.5 9.8c0 1.8 1 3.4 2.5 4.5l-.6 2.2 2.6-1.4c.8.2 1.6.3 2.5.3h.4"/><path d="M15.3 9.3c-3.4 0-6.1 2.3-6.1 5.1s2.7 5.1 6.1 5.1c.7 0 1.4-.1 2-.3l2.2 1.2-.5-1.9c1.5-.9 2.4-2.4 2.4-4.1 0-2.8-2.7-5.1-6.1-5.1Z"/><circle class="f" cx="7" cy="8.6" r=".9"/><circle class="f" cx="11.4" cy="8.6" r=".9"/><circle class="f" cx="13.4" cy="13.8" r=".8"/><circle class="f" cx="17.2" cy="13.8" r=".8"/></svg>',
    apple: '<svg viewBox="0 0 24 24"><path class="f" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.4-4ZM14 5.3c.7-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3Z"/></svg>',
  };
  const idGlyph = i => i.type === 'login' ? ICON[provOf(i)] : ICON[i.type] || ICON.login;
  const idIcon = (i, size = '') => `<span class="icon ${size}${isESim(i) ? ' esim-ic' : ''}" style="--c:${i.color}">${isESim(i) ? 'eSIM' : idGlyph(i)}</span>`;
  function favIcon(a, size = '') {
    const loc = customIcon(a) || localIcon(a);
    if (loc) return `<span class="icon fav full ${size}"><img alt="" loading="lazy" decoding="async" width="64" height="64" src="${loc}"></span>`;
    const src = favSources(a.domain), letter = esc((a.name || '?').trim().slice(0, 1).toUpperCase());
    const b = brand(a), style = `style="--lc1:color-mix(in srgb,${b} 78%,#fff);--lc2:${b}"`;
    if (!src.length) return `<span class="icon fav letter ${size}" ${style}>${letter}</span>`;
    return `<span class="icon fav ${size}" ${style}><img alt="" loading="lazy" decoding="async" width="64" height="64" src="${src[0]}" data-rest='${JSON.stringify(src.slice(1))}' data-letter="${letter}" onerror="AtlasFav(this)"></span>`;
  }
  window.AtlasFav = img => {
    const rest = JSON.parse(img.dataset.rest || '[]');
    if (rest.length) { img.dataset.rest = JSON.stringify(rest.slice(1)); img.src = rest[0]; return; }
    const box = img.parentElement; if (!box) return; box.classList.add('letter'); box.textContent = img.dataset.letter;
  };
  document.addEventListener('load', e => {
    const im = e.target;
    if (im.tagName === 'IMG' && im.dataset.rest !== undefined && im.naturalWidth && im.naturalWidth < 12) window.AtlasFav(im);
  }, true);
  // blurred "poster" made of the brand colours (and icons, when they load) of a set of accounts
  function poster(accs, n, cls = 'poster') {
    const list = accs.length ? accs : [];
    const tiles = [];
    for (let k = 0; k < n; k++) {
      const a = list[k % Math.max(1, list.length)];
      if (!a) { tiles.push('<b style="--pc:transparent"></b>'); continue; }
      const src = customIcon(a) || localIcon(a) || favSources(a.domain)[0];
      tiles.push(`<b style="--pc:${brand(a)};position:relative">${src && k < list.length ? `<img alt="" decoding="async" width="64" height="64" src="${src}" onerror="this.remove()" style="position:absolute;inset:18%;width:64%;height:64%;object-fit:contain">` : ''}</b>`);
    }
    return `<div class="${cls}" aria-hidden="true">${tiles.join('')}</div>`;
  }
  const maskHandle = h => [...h].slice(0, 1).join('') + '•••';
  // 隐藏号码 also hides usernames everywhere they're shown (not in the edit form)
  const hd = h => ui.privacy ? maskHandle(h) : h;
  const handle = a => a.handle ? `<em class="hd">${esc(hd(a.handle))}</em>` : '';
  const caps = ids => ids.map(idById).filter(Boolean).map(i => `<span class="cap" style="--c:${i.color}"><i></i>${esc(i.label || (i.type === 'login' ? LOGIN[provOf(i)].short || LOGIN[provOf(i)].name : display(i)))}</span>`).join('');

  // ---------- toast (notification banner) ----------
  let toastTimer;
  function toast(msg, action) {
    const t = $('#toast');
    t.innerHTML = `<img class="ti" src="icon.png?v=4" alt=""><span class="tx"><span class="tn">账号星图</span><span class="tt">${esc(msg)}</span></span>${action ? `<button>${esc(action.label)}</button>` : ''}`;
    if (action) t.querySelector('button').onclick = () => { action.fn(); t.classList.remove('show'); };
    t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), action ? 4500 : 2200);
  }
  let undoSnap = null;
  const snap = () => { undoSnap = JSON.stringify(state); };
  const undoToast = msg => toast(msg, { label: '撤销', fn: () => { state = JSON.parse(undoSnap); save(); render(); } });

  // ---------- wallet card ----------
  function walletCard(i, extra = '') {
    const accs = accountsOf(i.id), n = accs.length;
    const stack = accs.slice(0, 4).map(a => favIcon(a)).join('');
    const sim = i.type === 'phone', car = sim ? carrier(i.value) : '';
    const lg = i.type === 'login', via = lg ? viaOf(i) : null;
    const kind = lg ? `${idGlyph(i)}${esc(LOGIN[provOf(i)].name)}${i.label ? `<small class="wc-lbl">${esc(i.label)}</small>` : ''}`
      : `${sim ? (isESim(i) ? ESIM : CHIP) : ICON.email}${esc(i.label || (sim ? '手机号' : '邮箱'))}`;
    const note = lg ? (via ? `绑定 ${via.label || display(via)}` : i.notes || LOGIN[provOf(i)].name)
      : sim ? [car && !(i.notes || '').includes(car.slice(2)) ? car : '', i.notes].filter(Boolean).join(' · ') || '手机号' : i.notes || '邮箱';
    return `<button class="wcard ${sim ? 'sim' : ''}${lg ? ' login lg-' + provOf(i) : ''}" ${extra} data-identity="${i.id}" style="--c:${i.color};--g:${skin(i.color)}">
      ${poster(accs.slice().sort((a, b) => b.createdAt - a.createdAt), 9)}
      <span class="sheen"></span>
      <span class="wc-top"><span class="wc-kind">${kind}</span>
        <span class="wc-count"><b>${n}</b><small>个网站与 App</small></span></span>
      <span class="wc-value">${esc(display(i))}</span>
      <span class="wc-foot"><span class="wc-note">${esc(note)}</span>
        <span class="stack">${n > 4 ? `<span class="more">+${n - 4}</span>` : ''}${stack}</span></span>
    </button>`;
  }
  // order the stack so the first app sits on top (row-reverse)
  const fixStack = root => $$('.stack', root).forEach(s => { const els = [...s.children]; const more = els.find(e => e.classList.contains('more')); const icons = els.filter(e => e !== more); s.innerHTML = ''; if (more) s.append(more); icons.reverse().forEach(e => s.append(e)); });

  // ---------- render ----------
  function renderSummary() {
    const cnt = t => state.identities.filter(i => i.type === t).length, e = cnt('email'), p = cnt('phone'), l = cnt('login'), a = state.accounts.length;
    $('#summary').textContent = state.identities.length || a ? `${e} 个邮箱、${p} 个手机号${l ? `、${l} 个登录账号` : ''}，关联着 ${a} 个网站与 App` : '先添加一个邮箱或手机号';
    $('#sitesSummary').textContent = a ? `共 ${a} 个` : '';
    document.body.classList.toggle('is-empty', !state.identities.length && !a);
    const demoBtn = $('#menu [data-act="demo"]'); if (demoBtn) demoBtn.hidden = Sync.on;
  }

  function renderWallet() {
    const w = $('#wallet');
    const d = deck(), word = { email: '邮箱', phone: '手机号', login: '微信或 Apple 账号' }[ui.kind];
    renderSeg();
    w.innerHTML = d.map(i => walletCard(i)).join('') +
      (state.identities.length ? `<button class="wcard ghost ${ui.kind === 'phone' ? 'sim' : ''}" data-new="identity" data-type="${ui.kind}"><div>${ICON.plus}添加${word}</div></button>`
        : `<button class="wcard ghost first" data-new="identity"><img src="icon.png?v=4" alt=""><b>从一个邮箱或手机号开始</b><span>每张卡片记着它注册、绑定过的网站与 App</span><em>${ICON.plus}添加</em></button>`);
    fixStack(w);
    $('#dots').innerHTML = [...d, 0].map((_, k) => `<i class="${k === ui.active ? 'on' : ''}"></i>`).join('');
    ui.active = Math.min(ui.active, d.length);
    if (geo) geo.ok = false;
    if (ui.tab === 'home') measureCards();
    requestAnimationFrame(() => {
      if (ui.tab !== 'home') return;
      const cards = $$('.wcard', w), c = cards[ui.active];
      if (c) w.scrollLeft = cardX(w, c);
      coverflow();
    });
  }

  function renderSeg() {
    const s = $('#kindSeg'), n = KINDS.map(t => state.identities.filter(i => i.type === t).length);
    s.hidden = !state.identities.length;
    s.style.setProperty('--k', KINDS.indexOf(ui.kind));
    if (s.querySelector('.thumb')) {   // update in place so the thumb slides instead of jumping
      $$('button', s).forEach(btn => btn.classList.toggle('on', btn.dataset.kind === ui.kind));
      $$('b', s).forEach((b, k) => b.textContent = n[k]); return;
    }
    const names = { email: [ICON.email, '邮箱'], phone: [ICON.phone, '手机号'], login: [ICON.login, '登录'] };
    s.innerHTML = '<span class="thumb"></span>' + KINDS.map((t, k) => `<button data-kind="${t}" class="${ui.kind === t ? 'on' : ''}">${names[t][0]}${names[t][1]}<b>${n[k]}</b></button>`).join('');
  }
  function switchKind(k) {
    if (k === ui.kind) return;
    const w = $('#wallet'), dir = KINDS.indexOf(k) > KINDS.indexOf(ui.kind) ? 1 : -1;
    setKind(k); renderWallet(); onActiveChange();
    const th = $('#kindSeg .thumb'); if (th && !calm()) th.animate([{ scale: '1 1' }, { scale: '1.12 .92', offset: .4 }, { scale: '1 1' }], { duration: 420, easing: 'cubic-bezier(.32,.72,0,1)' });
    // animate the cards, not the wallet: a transform on the wallet would change the cards' offsetParent
    $$('.wcard', w).forEach((c, k) => c.animate([{ translate: `${dir * 50}px 0`, opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 520, delay: k * 50, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }));
  }
  const cardX = (w, c) => c.offsetLeft - w.offsetLeft - (w.clientWidth - c.offsetWidth) / 2;
  function centerCard(w, c) { w.scrollTo({ left: cardX(w, c), behavior: 'smooth' }); }
  // Coverflow runs once per frame while the wallet scrolls. Card geometry is measured once per
  // render/resize (geo), so a frame only reads scrollLeft and then writes transforms: no layout
  // thrash, and nothing is written to a card whose pose didn't change.
  let rafCF = 0, geo = null, moving = false, settleT = 0, gridStale = false, cfAnims = [];
  // Where the browser has scroll-driven animations (Chrome/Edge/Android 115+, Safari 26+), each card's pose is a
  // WAAPI animation on a ScrollTimeline of the wallet: rotation, scale, opacity and sheen are then interpolated by
  // the compositor at the display's refresh rate and no JS runs per frame. Elsewhere coverflow() writes the same
  // poses from a rAF. The pose is piecewise linear in scrollLeft, so keyframes at d = +1.6, 0, -1.6 are exact.
  const SCROLL_TL = typeof ScrollTimeline === 'function';
  const pose = d => {
    const ad = Math.min(1.6, Math.abs(d));
    return { t: `perspective(1100px) rotateY(${(Math.max(-1.6, Math.min(1.6, d)) * -16).toFixed(3)}deg) scale(${(1 - ad * .12).toFixed(4)})`, o: (1 - ad * .35).toFixed(4), s: `translateX(${(-60 + d * -120).toFixed(2)}%)` };
  };
  function measureCards() {
    const w = $('#wallet');
    if (ui.tab !== 'home') return (geo = null);
    const cards = $$('.wcard', w), base = w.offsetLeft + w.clientWidth / 2, max = w.scrollWidth - w.clientWidth;
    const next = cards.map(c => ({ c, sheen: c.querySelector('.sheen'), mid: c.offsetLeft + c.offsetWidth / 2 - base, wd: c.offsetWidth || 1, t: '', o: '', s: '' }));
    const same = geo && geo.max === max && geo.length === next.length && geo.every((g, k) => g.c === next[k].c && g.mid === next[k].mid && g.wd === next[k].wd);
    if (same && (geo.tl || !SCROLL_TL)) return;
    geo = next; geo.max = max; geo.tl = false;
    cfAnims.forEach(a => a.cancel()); cfAnims = [];
    if (!SCROLL_TL || max <= 0) return;
    const tl = new ScrollTimeline({ source: w, axis: 'x' });
    const opts = { timeline: tl, fill: 'both', easing: 'linear' };
    for (const g of geo) {
      const xs = [0, max, ...[1.6, 0, -1.6].map(d => g.mid - d * g.wd).filter(x => x > 0 && x < max)].sort((a, b) => a - b);
      const ps = xs.map(x => [x / max, pose((g.mid - x) / g.wd)]);
      g.c.style.transform = ''; g.c.style.opacity = '';
      cfAnims.push(g.c.animate(ps.map(([offset, p]) => ({ offset, transform: p.t, opacity: p.o })), opts));
      if (g.sheen) { g.sheen.style.transform = ''; cfAnims.push(g.sheen.animate([ps[0], ps[ps.length - 1]].map(([offset, p]) => ({ offset, transform: p.s })), opts)); }
    }
    geo.tl = true;
  }
  function coverflow() {
    rafCF = 0;
    if (ui.tab !== 'home') return;
    if (!geo || !geo.ok) { measureCards(); if (!geo) return; geo.ok = true; }
    const x = $('#wallet').scrollLeft;
    let best = 0, bestD = 1e9;
    for (let k = 0; k < geo.length; k++) {
      const g = geo[k], d = (g.mid - x) / g.wd;
      if (!geo.tl) {   // fallback: same pose, written only when it changed
        const p = pose(d);
        if (p.t !== g.t) g.c.style.transform = g.t = p.t;
        if (p.o !== g.o) g.c.style.opacity = g.o = p.o;
        if (g.sheen && p.s !== g.s) g.sheen.style.transform = g.s = p.s;
      }
      if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = k; }
    }
    if (best !== ui.active) { ui.active = best; onActiveChange(moving); }
  }
  function onActiveChange(deferGrid = false) {
    $$('#dots i').forEach((d, k) => d.classList.toggle('on', k === ui.active));
    const i = cur();
    animateGlow(i ? i.color : '#3a3a3c');
    // rebuilding the icon grid mid-swipe costs a long frame; do it once the wallet comes to rest
    if (deferGrid) gridStale = true; else { gridStale = false; renderGrid(); }
  }
  function walletSettled() {
    clearTimeout(settleT); if (!moving) return;
    moving = false; $('#wallet').classList.remove('moving');
    if (gridStale) { gridStale = false; renderGrid(); }
  }
  let glowColor = null;
  function animateGlow(col) {
    const g = $('#glow');
    if (glowColor === col) return; glowColor = col;
    // --accent lives on the glow (its only user): setting it on <html> restyled the whole page
    g.style.setProperty('--accent', col);
    g.animate([{ opacity: .35 }, { opacity: .75 }], { duration: 600, easing: 'ease-out' });
  }

  function renderGrid() {
    const i = cur();
    const g = $('#grid');
    $('#gridTitle').textContent = i ? `${i.label || display(i)}` : '全部网站与 App';
    $('#gridSub').textContent = i ? `${i.type === 'login' ? '用它登录的' : '用它注册或绑定的'} ${accountsOf(i.id).length} 个网站与 App` : '';
    const list = i ? accountsOf(i.id) : state.accounts.slice().sort((a, b) => zh(a.name, b.name));
    // FLIP: remember where each icon was
    const before = {}, live = ui.tab === 'home';
    if (live) $$('.app[data-account]', g).forEach(el => before[el.dataset.account] = el.getBoundingClientRect());
    const more = list.length > 11 ? list.length - 11 : 0;
    const shown = more ? list.slice(0, 11) : list;
    g.innerHTML = shown.map(a => `<button class="app" data-account="${a.id}">${favIcon(a)}<span>${esc(a.handle ? hd(a.handle) : a.name)}</span></button>`).join('') +
      (more ? `<button class="app add" data-identity="${i ? i.id : ''}"><span class="icon more">+${more}</span><span>全部</span></button>` : i ? `<button class="app add" data-new="account" data-preset="${i.id}"><span class="icon">${ICON.plus}</span><span>添加</span></button>` : '') +
      (!list.length && !i ? '<div class="grid-empty">还没有网站，从右上角的 + 开始。</div>' : '');
    if (!live) return;
    let k = 0;
    const els = $$('.app', g), after = els.map(el => before[el.dataset.account] ? el.getBoundingClientRect() : null);   // all reads first
    els.forEach((el, n) => {
      const r0 = before[el.dataset.account];
      if (r0) {
        const r1 = after[n], dx = r0.left - r1.left, dy = r0.top - r1.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.32,.72,0,1)' });
      } else {
        el.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: Math.min(k++, 12) * 22, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'backwards' });
      }
    });
  }

  function dayLabel(t) {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const d = new Date(t); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d0 - d) / DAY);
    if (diff === 0) return ['', '今天', true];
    if (diff === 1) return ['', '昨天', true];
    return [`${d.getMonth() + 1}月`, String(d.getDate()), false];
  }
  function reel(a, meta = '') {
    return `<button class="reel" data-account="${a.id}">
      ${poster([a], 1, 'blur')}${favIcon(a)}
      <span class="reel-main"><span class="reel-title">${esc(a.name)}${handle(a)}</span><span class="caps">${caps(a.identityIds) || '<span class="cap dim">未关联</span>'}</span></span>
      ${meta ? `<span class="reel-meta">${meta}</span>` : ICON.chev}
    </button>`;
  }
  function renderTimeline() {
    const t = $('#timeline');
    const list = state.accounts.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
    if (!list.length) { t.innerHTML = '<div class="grid-empty">添加的网站会按时间出现在这里。</div>'; return; }
    const groups = [];
    list.forEach(a => { const key = new Date(a.createdAt).toDateString(); const g = groups.find(g => g.key === key); g ? g.items.push(a) : groups.push({ key, t: a.createdAt, items: [a] }); });
    t.innerHTML = groups.map(g => { const [m, d, today] = dayLabel(g.t); return `<div class="day"><div class="day-date ${today ? 'today' : ''}"><small>${m}</small><b>${d}</b></div><div class="day-items">${g.items.map(a => reel(a, a.category)).join('')}</div></div>`; }).join('');
  }

  function renderSites() {
    const v = $('#siteList');
    if (!state.accounts.length) { v.innerHTML = `<div class="empty"><h3>还没有网站</h3><p>记下一个网站或 App，选上它用的是哪个邮箱、哪个手机号。</p><button class="btn-filled" data-new="account">添加网站或 App</button></div>`; $('#filters').innerHTML = ''; return; }
    const counts = {};
    state.accounts.forEach(a => counts[a.category] = (counts[a.category] || 0) + 1);
    const cats = CATS.filter(c => counts[c]);
    if (ui.cat !== '全部' && !counts[ui.cat]) ui.cat = '全部';
    $('#filters').innerHTML = ['全部', ...cats].map(c => `<button class="${c === ui.cat ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
    const shown = ui.cat === '全部' ? cats : [ui.cat];
    v.innerHTML = shown.map(c => {
      const list = state.accounts.filter(a => a.category === c).sort((a, b) => zh(a.name, b.name));
      return `<div class="cat-title">${c}<small>${list.length}</small></div><div class="cat-list">${list.map(a => reel(a)).join('')}</div>`;
    }).join('');
    $$('#siteList .reel').forEach((el, k) => el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: Math.min(k, 10) * 25, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }));
  }

  let dataVer = 0;   // bumps on every full render; the map rebuilds only when this (or its width) changed
  function render() {
    dataVer++;
    renderSummary(); renderWallet(); renderGrid(); renderTimeline(); renderSites();
    $('#menu [data-act="privacy"] span').textContent = ui.privacy ? '显示完整号码' : '隐藏号码';
    if (ui.tab === 'graph') Graph.rebuild(); else Graph.prebuild();
  }

  // ---------- appearance ----------
  function setTheme(t, from) {
    const root = document.documentElement;
    const apply = () => { if (t === 'light') root.dataset.theme = 'light'; else delete root.dataset.theme; localStorage.setItem('atlas.theme', t); paintTheme(); };
    // new theme spreads out as a circle from the button that was tapped
    if (from && document.startViewTransition && !calm()) {
      const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(apply);
      vt.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 620, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
      return;
    }
    root.classList.add('theming'); apply();
    setTimeout(() => root.classList.remove('theming'), 450);
  }
  // small tactile motion for the round top buttons
  const MOTION = {
    addBtn: [[{ transform: 'none' }, { transform: 'rotate(90deg) scale(.72)', offset: .45 }, { transform: 'rotate(180deg)' }], 560],
    openSearch: [[{ transform: 'none' }, { transform: 'rotate(-20deg) scale(1.2) translate(-1px,-1px)', offset: .4 }, { transform: 'none' }], 560],
    themeBtn: [[{ transform: 'none' }, { transform: 'scale(.8)', offset: .35 }, { transform: 'none' }], 520]
  };
  function tapFx(b) {
    if (calm()) return;
    // same ring as before, started with WAAPI on ::after instead of class + forced reflow (void offsetWidth)
    const rc = document.documentElement.dataset.theme === 'light' ? '0,122,255' : '255,255,255', ra = rc[0] === '0' ? .3 : .45;
    b.animate([{ opacity: .9, boxShadow: `0 0 0 0 rgba(${rc},${ra})` }, { opacity: 0, boxShadow: `0 0 0 11px rgba(${rc},0)` }], { duration: 600, easing: 'cubic-bezier(.2,.8,.3,1)', pseudoElement: '::after' });
    const m = MOTION[b.id], ease = 'cubic-bezier(.34,1.45,.64,1)';
    if (m) (b.id === 'themeBtn' ? b : b.querySelector('svg')).animate(m[0], { duration: m[1], easing: ease });
    if (b.id === 'menuBtn') b.querySelectorAll('circle').forEach((c, k) => c.animate([{ transform: 'none' }, { transform: 'translateY(-3.5px)', offset: .4 }, { transform: 'none' }], { duration: 420, delay: k * 60, easing: ease }));
  }
  // inside the iOS app shell (ios/main.swift) the page talks to native for the status bar and file export
  const native = window.webkit?.messageHandlers?.atlas || null;
  function paintTheme() {
    const light = document.documentElement.dataset.theme === 'light';
    $('meta[name="theme-color"]').content = light ? '#f2f2f7' : '#000000';
    const b = $('#themeBtn'); if (b) b.setAttribute('aria-label', light ? '切换到深色' : '切换到浅色');
    native?.postMessage({ theme: light ? 'light' : 'dark' });
  }

  // ---------- tabs ----------
  const TABS = ['home', 'sites', 'graph'];
  function setTab(tab) {
    if (tab === ui.tab) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const from = TABS.indexOf(ui.tab); ui.tab = tab;
    const idx = TABS.indexOf(tab), th = $('#tabThumb');
    $$('#tabbar button').forEach((b, k) => b.classList.toggle('active', k === idx));
    th.style.transform = `translateX(${idx * 100}%)`;
    if (!calm()) th.animate([{ scale: '1 1' }, { scale: `${1 + .16 * Math.abs(idx - from)} 1.14`, offset: .35 }, { scale: '.97 .96', offset: .7 }, { scale: '1 1' }], { duration: 620, easing: 'cubic-bezier(.32,.72,0,1)' });
    $$('.view').forEach(v => { const on = v.dataset.view === tab; v.classList.toggle('active', on); v.classList.toggle('from-r', on && idx > from); v.classList.toggle('from-l', on && idx < from); });
    $('#topTitle').textContent = { home: '账号', sites: '网站与 App', graph: '关系图' }[tab];
    scrollTo(0, 0);
    // first paint of the tab change goes out before the map is (re)built, so the two never share a frame
    if (tab === 'graph') requestAnimationFrame(() => { if (ui.tab === 'graph') Graph.start(); }); else Graph.stop();
    if (tab === 'home') { if (geo) geo.ok = false; if (!rafCF) rafCF = requestAnimationFrame(coverflow); if (gridStale) { gridStale = false; renderGrid(); } }
  }

  // ---------- sheet ----------
  const sheet = $('#sheet'), inner = $('#sheetInner');
  let sheetCtx = null;
  function openSheet(html, ctx = null) {
    const wasOpen = sheet.classList.contains('open');
    sheetCtx = ctx;
    inner.innerHTML = html;
    fixStack(inner);
    inner.classList.add('enter'); clearTimeout(inner._en); inner._en = setTimeout(() => inner.classList.remove('enter'), 700);
    if (wasOpen) {
      inner.animate([{ opacity: 0, transform: 'translateX(18px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.32,.72,0,1)' });
    } else {
      sheet.style.transform = '';
      requestAnimationFrame(() => { sheet.classList.add('open'); $('#scrim').classList.add('show'); });
    }
    lockScroll(true);
  }
  // freeze the page under a sheet so iOS can't rubber-band it out of place
  let lockY = null;
  function lockScroll(on) {
    const b = document.body;
    if (on && lockY === null) { lockY = scrollY; Object.assign(b.style, { position: 'fixed', top: -lockY + 'px', left: '0', right: '0', overflow: 'hidden' }); }
    else if (!on && lockY !== null) { Object.assign(b.style, { position: '', top: '', left: '', right: '', overflow: '' }); scrollTo(0, lockY); lockY = null; }
  }
  function closeSheet() {
    sheet.classList.remove('open'); $('#scrim').classList.remove('show'); sheet.style.transform = '';
    lockScroll(false); sheetCtx = null;
  }
  function refreshSheet() {
    if (!sheetCtx) return;
    if (sheetCtx.kind === 'identity') idById(sheetCtx.id) ? showIdentity(sheetCtx.id) : closeSheet();
    if (sheetCtx.kind === 'account') accById(sheetCtx.id) ? showAccount(sheetCtx.id) : closeSheet();
  }
  (() => {
    let y0 = null, x0 = 0, dy = 0;
    sheet.addEventListener('touchstart', e => {
      const body = $('.sheet-body', sheet);
      if (innerWidth >= 700 || (body && body.scrollTop > 0 && !e.target.closest('.sheet-bar,.grabber'))) return;
      if (e.target.closest('input,textarea,.suggest,.ord-h')) return;
      y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = 0; sheet.classList.add('dragging');
    }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      if (y0 === null) return;
      const raw = e.touches[0].clientY - y0;
      if (!dy && (raw < 0 || Math.abs(e.touches[0].clientX - x0) > Math.abs(raw))) { y0 = null; sheet.classList.remove('dragging'); return; }   // scrolling up: let the list scroll
      e.preventDefault();
      dy = Math.max(0, raw);
      if (!sheet._raf) sheet._raf = requestAnimationFrame(() => { sheet._raf = 0; if (y0 !== null) sheet.style.transform = `translateY(${dy}px)`; });
    }, { passive: false });
    $('#scrim').addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    sheet.addEventListener('touchend', () => {
      if (y0 === null) return;
      sheet.classList.remove('dragging'); y0 = null; cancelAnimationFrame(sheet._raf); sheet._raf = 0;
      if (dy > 110) closeSheet(); else sheet.style.transform = '';
    });
  })();

  if (window.visualViewport) {
    const vv = visualViewport;
    const fit = () => {
      if (innerWidth >= 700) { sheet.style.bottom = ''; sheet.style.maxHeight = ''; return; }
      const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
      sheet.style.bottom = kb > 80 ? kb + 'px' : '';
      sheet.style.maxHeight = kb > 80 ? (vv.height - 8) + 'px' : '';
    };
    vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
  }
  document.addEventListener('focusin', e => { if (e.target.closest('.sheet') && /INPUT|TEXTAREA/.test(e.target.tagName)) setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300); });

  const bar = (left, title, right, rightAttr = '') => `<div class="sheet-bar"><button data-sheet-left>${left}</button><span class="t">${title}</span><button ${rightAttr}>${right}</button></div>`;
  const closeX = `<div class="sheet-bar float"><button class="x" data-close aria-label="关闭">${ICON.x}</button></div>`;

  function showIdentity(id) {
    const i = idById(id); if (!i) return;
    const accs = accountsOf(id), lg = i.type === 'login', via = viaOf(i), bound = lg ? [] : boundTo(id);
    // sites that sign in with a 微信 / Apple card bound to this number or address
    const direct = new Set(accs.map(a => a.id));
    const indirect = bound.map(b => [b, accountsOf(b.id).filter(a => !direct.has(a.id))]).filter(([, l]) => l.length);
    const idCell = (x, title) => `<button class="cell" data-identity="${x.id}">${idIcon(x)}<span class="cell-main"><span class="cell-title">${esc(title)}</span><span class="cell-sub">${esc(x.label ? x.label + ' · ' + display(x) : display(x))}</span></span>${ICON.chev}</button>`;
    openSheet(`${closeX}
      <div class="sheet-body">
        <div class="cine idcine" style="--c:${i.color};--g:${skin(i.color)}">
          <div class="id-aura"></div>
          ${walletCard(i, 'tabindex="-1" data-static')}
        </div>
        <div class="actions">
          <button class="action" data-copy="${esc(i.value)}">${ICON.copy}复制</button>
          <button class="action" data-edit-identity="${i.id}">${ICON.edit}编辑</button>
          <button class="action destructive" data-del-identity="${i.id}">${ICON.trash}删除</button>
        </div>
        ${i.notes ? `<div class="sec-title">备注</div><div class="notes">${esc(i.notes)}</div>` : ''}
        ${via ? `<div class="sec-title">绑定</div><div class="group">${idCell(via, `${typeName(via)} ${via.label || display(via)}`)}</div>` : ''}
        ${bound.length ? `<div class="sec-title">绑定了这个号的登录账号</div><div class="group">${bound.map(b => idCell(b, `${LOGIN[provOf(b)].name} 绑定了这个号`)).join('')}</div>` : ''}
        <div class="sec-title">${lg ? `用它登录的 ${accs.length} 个网站与 App` : `用它注册或绑定的 ${accs.length} 个网站与 App`}</div>
        <div class="cat-list" style="padding:0">${accs.map(a => reel(a)).join('')}
          <button class="reel" data-new="account" data-preset="${i.id}" style="color:var(--tint)"><span class="icon" style="background:rgba(255,255,255,.08);color:var(--tint)">${ICON.plus}</span><span class="reel-main"><span class="reel-title" style="font-weight:500">添加网站或 App</span></span></button>
        </div>
        ${indirect.map(([b, l]) => `<div class="sec-title">通过${esc(LOGIN[provOf(b)].short || LOGIN[provOf(b)].name)}登录 · ${l.length} 个（间接）</div><div class="cat-list indirect" style="padding:0">${l.map(a => reel(a)).join('')}</div>`).join('')}
      </div>`, { kind: 'identity', id });
  }

  function showAccount(id) {
    const a = accById(id); if (!a) return;
    const ids = a.identityIds.map(idById).filter(Boolean);
    const d = cleanDomain(a.domain);
    openSheet(`${closeX}
      <div class="sheet-body">
        <div class="cine">
          ${poster([a, a, a, a], 4, 'backdrop')}
          ${favIcon(a, 'lg')}
          <h2>${esc(a.name)}</h2>${a.handle ? `<p class="acc-handle">${esc(hd(a.handle))}</p>` : ''}
          <div class="caps"><span class="cap dim">${esc(a.category)}</span>${d ? `<span class="cap dim">${esc(d)}</span>` : ''}</div>
        </div>
        <div class="actions">
          ${d ? `<a class="action" href="https://${esc(d)}" target="_blank" rel="noopener">${ICON.open}打开网站</a>` : `<button class="action" disabled style="opacity:.35">${ICON.open}打开网站</button>`}
          <button class="action" data-edit-account="${a.id}">${ICON.edit}编辑</button>
          <button class="action destructive" data-del-account="${a.id}">${ICON.trash}删除</button>
        </div>
        <div class="sec-title">注册或绑定用的</div>
        <div class="group">${ids.map(i => `<button class="cell" data-identity="${i.id}">${idIcon(i)}<span class="cell-main"><span class="cell-title">${esc(display(i))}</span>${i.label ? `<span class="cell-sub">${esc(i.label)}</span>` : ''}</span>${ICON.chev}</button>`).join('') || '<div class="cell" style="color:var(--secondary)">还没有选择邮箱或手机号</div>'}</div>
        ${a.notes ? `<div class="sec-title">备注</div><div class="notes">${esc(a.notes)}</div>` : ''}
        <p class="hint" style="margin-top:16px">添加于 ${new Date(a.createdAt || Date.now()).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>`, { kind: 'account', id });
  }

  // ---------- forms ----------
  function identityForm(existing, presetType) {
    const startType = KINDS.includes(presetType) ? presetType : 'email';
    const i = existing || { type: startType, value: '', label: '', color: startType === 'login' ? LOGIN.wechat.color : COLORS[state.identities.length % COLORS.length], notes: '' };
    let type = KINDS.includes(i.type) ? i.type : 'email', color = i.color, esim = i.esim === true, provider = provOf(i), via = viaOf(i)?.id || '';
    // a colour the user picked stays; otherwise a login card wears its provider's colour
    let touched = !!existing && !(i.type === 'login' && i.color === LOGIN[provider].color);
    const PH = { email: ['地址', 'name@example.com', 'email'], phone: ['号码', '+86 138 0000 0000', 'tel'] };
    const ph = () => type === 'login' ? [LOGIN[provider].field, LOGIN[provider].ph, provider === 'apple' ? 'email' : 'text'] : PH[type];
    const palette = () => { const p = type === 'login' ? [LOGIN.wechat.color, LOGIN.apple.color, ...COLORS] : [...COLORS]; if (!p.includes(color)) p.unshift(color); return p; };
    const colorsHtml = () => palette().map(c => `<button class="color ${c === color ? 'active' : ''}" style="--c:${c};--g:${skin(c)}" data-c="${c}" aria-label="${SKINS[c] ? SKINS[c][0] : c}"><span>${SKINS[c] ? SKINS[c][0] : ''}</span></button>`).join('');
    const viaHtml = () => { const opts = state.identities.filter(x => (x.type === 'email' || x.type === 'phone') && x.id !== existing?.id);
      return `<button class="check-cell ${via ? '' : 'on'}" data-via=""><i style="background:var(--tertiary)"></i><span class="cell-main"><span class="cell-title">不绑定</span></span>${ICON.tick}</button>` +
        opts.map(x => `<button class="check-cell ${via === x.id ? 'on' : ''}" data-via="${x.id}" style="--c:${x.color}"><i></i><span class="cell-main"><span class="cell-title">${esc(x.label || display(x))}</span><span class="cell-sub">${esc(typeName(x))}${x.label ? ' · ' + esc(display(x)) : ''}</span></span>${ICON.tick}</button>`).join(''); };
    const [l0, p0, m0] = ph();
    openSheet(`${bar('取消', existing ? '编辑' : '新身份', existing ? '保存' : '添加', 'id="saveIdentity"')}
      <div class="sheet-body form">
        <div class="preview" id="preview"></div>
        <div class="seg-inline three" id="typeSeg" style="--k:${KINDS.indexOf(type)}"><span class="thumb"></span><button data-v="email">邮箱</button><button data-v="phone">手机号</button><button data-v="login">登录</button></div>
        <div id="provBox" ${type === 'login' ? '' : 'hidden'}><div class="prov-pills" id="provPills"><button data-p="wechat" class="${provider === 'wechat' ? 'on' : ''}">${ICON.wechat}微信</button><button data-p="apple" class="${provider === 'apple' ? 'on' : ''}">${ICON.apple}Apple</button></div></div>
        <div class="group" style="margin-top:16px">
          <div class="field" id="valueField"><label id="valueLabel">${l0}</label><input id="fValue" value="${esc(i.value)}" inputmode="${m0}" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${p0}"></div>
          <div class="field"><label>标签</label><input id="fLabel" value="${esc(i.label)}" placeholder="主力、小号、工作…"></div>
        </div>
        <div id="esimBox" ${type === 'phone' ? '' : 'hidden'}>
          <div class="group" style="margin-top:16px"><label class="field switch-row"><span>eSIM</span><input type="checkbox" class="switch" id="fEsim" ${esim ? 'checked' : ''}></label></div>
          <p class="hint">eSIM 没有实体卡，换手机时记得转移。</p>
        </div>
        <div id="viaBox" ${type === 'login' ? '' : 'hidden'}>
          <div class="sec-title">绑定的手机号/邮箱</div>
          <div class="group" id="viaPicks">${viaHtml()}</div>
          <p class="hint">很多 App 支持用它登录，记录在这里，换手机号时能看出受影响的网站。</p>
        </div>
        <div class="sec-title">卡面</div>
        <div class="group"><div class="colors" id="colors">${colorsHtml()}</div></div>
        <div class="sec-title">备注</div>
        <div class="group"><div class="field stack"><textarea id="fNotes" placeholder="运营商、是否实名、找回方式">${esc(i.notes || '')}</textarea></div></div>
        <p class="hint">不要在这里填写密码。</p>
      </div>`, { kind: 'form' });
    setTimeout(() => {
      const preview = () => {
        const tmp = { id: existing?.id || '_new', type, value: $('#fValue').value.trim() || ph()[1].split(' 或')[0], label: $('#fLabel').value.trim(), color, notes: $('#fNotes').value.trim(), ...(type === 'phone' && esim ? { esim: true } : {}), ...(type === 'login' ? { provider, ...(via ? { via } : {}) } : {}) };
        const html = walletCard(tmp, 'tabindex="-1" data-static');
        const box = $('#preview'); box.innerHTML = html; fixStack(box);
      };
      const wireColors = () => $$('#colors .color').forEach(b => b.onclick = () => { color = b.dataset.c; touched = true; $$('#colors .color').forEach(x => x.classList.toggle('active', x === b)); preview(); });
      const repaint = () => {
        $('#typeSeg').style.setProperty('--k', KINDS.indexOf(type));
        $('#esimBox').hidden = type !== 'phone'; $('#provBox').hidden = $('#viaBox').hidden = type !== 'login';
        $$('#provPills button').forEach(b => b.classList.toggle('on', b.dataset.p === provider));
        if (!touched) color = type === 'login' ? LOGIN[provider].color : (existing && existing.type !== 'login' ? existing.color : COLORS[state.identities.length % COLORS.length]);
        $('#colors').innerHTML = colorsHtml(); wireColors();
        const [lb, p, m] = ph(); $('#valueLabel').textContent = lb; const f = $('#fValue'); f.placeholder = p; f.inputMode = m;
        preview();
      };
      preview(); wireColors();
      ['#fValue', '#fLabel', '#fNotes'].forEach(s => $(s).addEventListener('input', preview));
      $$('#typeSeg button').forEach(b => b.onclick = () => { type = b.dataset.v; repaint(); });
      $$('#provPills button').forEach(b => b.onclick = () => { provider = b.dataset.p; repaint(); });
      $('#viaPicks').onclick = e => { const b = e.target.closest('[data-via]'); if (!b) return; via = b.dataset.via; $$('#viaPicks .check-cell').forEach(x => x.classList.toggle('on', x === b)); preview(); };
      $('#fEsim').onchange = e => { esim = e.target.checked; preview(); };
      $('#saveIdentity').onclick = () => {
        const value = $('#fValue').value.trim();
        const isMail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), digits = v => v.replace(/\D/g, '').length >= 5;
        const ok = type === 'email' ? isMail(value) : type === 'phone' ? digits(value) : provider === 'wechat' ? value.length >= 1 : isMail(value) || digits(value);
        if (!ok) {
          const f = $('#valueField'); f.classList.remove('invalid'); void f.offsetWidth; f.classList.add('invalid'); $('#fValue').focus();
          toast(type === 'email' ? '邮箱地址格式不对' : type === 'phone' ? '手机号至少要 5 位数字' : provider === 'wechat' ? '填一下微信号' : 'Apple ID 是邮箱或手机号'); return;
        }
        if (state.identities.some(x => x.id !== existing?.id && x.type === type && (type !== 'login' || provOf(x) === provider) && x.value.toLowerCase() === value.toLowerCase())) { toast('这个身份已经添加过了'); return; }
        const data = { type, value, label: $('#fLabel').value.trim(), color, notes: $('#fNotes').value.trim() };
        if (type === 'phone' && esim) data.esim = true;
        if (type === 'login') { data.provider = provider; if (via && idById(via)) data.via = via; }
        let id;
        if (existing) {
          Object.assign(existing, data);
          if (!data.esim) delete existing.esim; if (!data.provider) delete existing.provider; if (!data.via) delete existing.via;
          id = existing.id;
        } else { id = uid(); state.identities.push({ id, ...data }); }
        setKind(type, id); save(); render(); showIdentity(id); toast(existing ? '已保存' : '已添加');
      };
      if (!existing) $('#fValue').focus();
    }, 0);
  }

  // ---------- custom icons ----------
  // any image → center-cropped 128×128 data: URL; PNG, or JPEG when the PNG is over ~24 KB
  async function makeIcon(blob) {
    let img;
    try { img = await createImageBitmap(blob); }
    catch { img = await new Promise((ok, no) => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => { URL.revokeObjectURL(u); no(); }; im.src = u; }); }
    const w = img.width, h = img.height, side = Math.min(w, h); if (!side) throw 0;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, 128, 128);
    img.close?.();
    const png = c.toDataURL('image/png');
    if ((png.length - 22) * 3 / 4 <= 24 * 1024) return png;
    const j = document.createElement('canvas'); j.width = j.height = 128;
    const jg = j.getContext('2d'); jg.fillStyle = '#fff'; jg.fillRect(0, 0, 128, 128); jg.drawImage(c, 0, 0);   // JPEG has no transparency
    return j.toDataURL('image/jpeg', 0.85);
  }
  // App Store search (iTunes Search API: free, no key, CORS *)
  const storeName = t => {
    t = (t || '').trim();
    // "Name - slogan" first; else the first bare dash that isn't inside a word like "Wi-Fi"
    let k = t.search(/\s[-–—]\s/);
    if (k < 0) for (let n = 0; n < t.length; n++) {
      if (!'-–—'.includes(t[n])) continue;
      if (t[n] === '-' && /[A-Za-z0-9]/.test(t[n - 1] || '') && /[A-Za-z0-9]/.test(t[n + 1] || '')) continue;
      k = n; break;
    }
    const head = k > 0 ? t.slice(0, k).trim() : '';
    return head.length >= 2 ? head : t;
  };
  const GENRE = { 'Social Networking': '社交', 'Shopping': '购物', 'Finance': '支付金融', 'Developer Tools': '开发', 'Games': '游戏', 'Entertainment': '娱乐', 'Music': '娱乐', 'Video': '娱乐', 'Photo & Video': '娱乐', 'Travel': '出行', 'Navigation': '出行',
    '社交': '社交', '社交网络': '社交', '购物': '购物', '财务': '支付金融', '财经': '支付金融', '开发工具': '开发', '游戏': '游戏', '娱乐': '娱乐', '音乐': '娱乐', '摄影与录像': '娱乐', '旅游': '出行', '旅行': '出行', '导航': '出行' };
  const storeCat = r => { for (const g of [r.primaryGenreName, ...(r.genres || [])]) if (GENRE[g]) return GENRE[g]; return '工具'; };
  const storeArt = r => r.artworkUrl512 || (r.artworkUrl100 || '').replace(/100x100/, '256x256');
  async function storeSearch(q) {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=cn&entity=software&limit=8`);
    if (!r.ok) throw 0;
    return ((await r.json()).results || []).filter(x => x.trackName && (x.artworkUrl100 || x.artworkUrl512));
  }
  async function storeIcon(url) {
    if (!/^https:\/\/[a-z0-9.-]+\.mzstatic\.com\//.test(url)) throw 0;
    const r = await fetch(url, { mode: 'cors' }); if (!r.ok) throw 0;
    return makeIcon(await r.blob());
  }

  // 选择身份: emails and phone numbers, then 微信 / Apple in their own 第三方登录 group
  function idPicksHtml(sel, title) {
    const cell = i => `<button class="check-cell ${sel.has(i.id) ? 'on' : ''}" data-id="${i.id}" style="--c:${i.color}">${i.type === 'login' ? `<span class="lg-glyph lg-${provOf(i)}" style="--g:${skin(i.color)}">${idGlyph(i)}</span>` : '<i></i>'}<span class="cell-main"><span class="cell-title">${esc(i.type === 'login' ? (i.label ? `${LOGIN[provOf(i)].name} · ${i.label}` : LOGIN[provOf(i)].name) : i.label || display(i))}</span>${i.type === 'login' || i.label ? `<span class="cell-sub">${esc(display(i))}</span>` : ''}</span>${ICON.tick}</button>`;
    const base = state.identities.filter(i => i.type === 'email' || i.type === 'phone'), lg = state.identities.filter(i => i.type === 'login');
    return (base.length ? `<div class="sec-title">${title}</div><div class="group id-picks" id="idPicks">${base.map(cell).join('')}</div>` : '') +
      (lg.length ? `<div class="sec-title">第三方登录</div><div class="group id-picks" id="idPicksLogin">${lg.map(cell).join('')}</div>` : '');
  }
  const wirePicks = sel => $$('.id-picks .check-cell').forEach(b => b.onclick = () => { const id = b.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); b.classList.toggle('on'); });

  function accountForm(existing, presetId, presetName = '') {
    if (!state.identities.length) { identityForm(); toast('先添加一个邮箱或手机号'); return; }
    const a = existing || { name: presetName, domain: '', category: '其他', identityIds: presetId ? [presetId] : [], notes: '' };
    const sel = new Set(a.identityIds);
    let cat = a.category, icon = customIcon(a) || '', iconSeq = 0;
    openSheet(`${bar('取消', existing ? '编辑' : '新网站或 App', existing ? '保存' : '添加', 'id="saveAccount"')}
      <div class="sheet-body form">
        <div class="form-hero" id="aHero"></div>
        <input type="file" id="iconFile" accept="image/*" hidden>
        <div class="group">
          <div class="field" id="nameField"><label>名称</label><input id="aName" value="${esc(a.name)}" placeholder="GitHub、淘宝、微信…" autocomplete="off"></div>
          <div class="suggest" id="suggest"></div>
          <div class="field"><label>账号名</label><input id="aHandle" value="${esc(a.handle || '')}" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="选填，用户名、昵称或 UID"></div>
          <div class="field"><label>网址</label><input id="aDomain" value="${esc(a.domain)}" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="选填，用来显示图标"></div>
        </div>
        <p class="hint dup" id="dupHint" hidden></p>
        ${idPicksHtml(sel, '用哪个邮箱或手机号注册、绑定的')}
        <p class="hint">可以多选，比如用邮箱注册、再绑定手机号；用微信或 Apple 登录的，选下面的登录账号。</p>
        <div class="sec-title">分类</div>
        <div class="group"><div class="cats" id="catPicks">${CATS.map(c => `<button class="${c === cat ? 'active' : ''}" data-c="${c}">${c}</button>`).join('')}</div></div>
        <div class="sec-title">备注</div>
        <div class="group"><div class="field stack"><textarea id="aNotes" placeholder="是否开了两步验证、用户名、会员到期日">${esc(a.notes || '')}</textarea></div></div>
        <p class="hint">不要在这里填写密码。</p>
      </div>`, { kind: 'form' });
    setTimeout(() => {
      const setCat = c => { cat = c; $$('#catPicks button').forEach(x => x.classList.toggle('active', x.dataset.c === c)); };
      $$('#catPicks button').forEach(b => b.onclick = () => setCat(b.dataset.c));
      wirePicks(sel);
      const hero = () => {
        const name = $('#aName').value.trim(), dom = cleanDomain($('#aDomain').value);
        const key = name + '|' + dom + '|' + icon.length + icon.slice(-24); const h = $('#aHero'); if (h.dataset.k === key) return; h.dataset.k = key;
        const fake = { name: name || '?', domain: dom, icon };
        h.style.setProperty('--pc', name || icon ? brand(fake) : 'transparent');
        h.innerHTML = `<button class="hero-icon" id="heroIcon" aria-label="更换图标">${name || icon ? favIcon(fake, 'lg') : `<span class="icon lg" style="background:rgba(255,255,255,.08);color:var(--tertiary)">${ICON.plus}</span>`}<i class="hero-edit">${ICON.edit}</i></button><b>${esc(name || '新网站或 App')}</b>
          <div class="icon-menu" id="iconMenu"><button data-im="pick"><span>从相册选择</span><svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17.5 5-4.5 4 3.5 3-2.5 4 3.5"/></svg></button>${icon ? `<button data-im="reset"><span>使用默认图标</span><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg></button>` : ''}</div>`;
        $('#heroIcon').onclick = e => { e.stopPropagation(); $('#iconMenu').classList.toggle('open'); };
        $$('#iconMenu button').forEach(b => b.onclick = e => {
          e.stopPropagation(); $('#iconMenu').classList.remove('open');
          if (b.dataset.im === 'pick') $('#iconFile').click(); else setIcon('');
        });
        const dup = name && state.accounts.find(x => x !== existing && x.name.toLowerCase() === name.toLowerCase());
        const dh = $('#dupHint');
        if (dup) { dh.hidden = false; dh.innerHTML = `已经记录过 ${esc(dup.name)}${dup.handle ? `（${esc(dup.handle)}）` : ''}。是另一个账号的话，填个账号名区分。`; } else dh.hidden = true;
      };
      const setIcon = v => { iconSeq++; icon = v || ''; hero(); };
      document.addEventListener('click', function off(e) { const m = $('#iconMenu'); if (!m) return document.removeEventListener('click', off, true); if (!e.target.closest('#iconMenu,#heroIcon')) m.classList.remove('open'); }, true);
      $('#iconFile').onchange = async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        const seq = ++iconSeq;
        try { const v = await makeIcon(f); if (seq === iconSeq) setIcon(v); } catch { toast('这张图片读不了，换一张试试'); }
      };
      hero();
      const applyPreset = p => { $('#aName').value = p[0]; $('#aDomain').value = p[1]; setCat(p[2]); store = []; storeQ = ''; $('#suggest').innerHTML = ''; setIcon(p[4] || ''); };
      const applyStore = r => {
        $('#aName').value = storeName(r.trackName);
        const host = cleanDomain(r.sellerUrl || ''); if (host) $('#aDomain').value = host;
        setCat(storeCat(r)); store = []; storeQ = ''; $('#suggest').innerHTML = '';
        const seq = ++iconSeq;
        // show the small artwork right away, then swap in the downscaled copy that gets saved
        icon = ''; hero();
        const h = $('#heroIcon .icon'); if (h) h.outerHTML = `<span class="icon fav full lg"><img alt="" width="64" height="64" src="${esc(r.artworkUrl100 || storeArt(r))}"></span>`;
        storeIcon(storeArt(r)).catch(() => storeIcon(r.artworkUrl100)).then(v => { if (seq === iconSeq) setIcon(v); }).catch(() => { if (seq === iconSeq) { $('#aHero').dataset.k = ''; hero(); } });
      };
      let store = [], storeQ = '', storeSeq = 0, storeT;
      const suggest = () => {
        const raw = $('#aName').value.trim(), q = raw.toLowerCase();
        const ALL = [...PRESETS, ...myApps()];
        const exact = ALL.find(p => p[0].toLowerCase() === q);
        if (exact) { if (!$('#aDomain').value) $('#aDomain').value = exact[1]; setCat(exact[2]); hero(); }
        const list = q && !exact ? ALL.filter(p => p[0].toLowerCase().includes(q) || p[1].includes(q)).slice(0, 8) : [];
        const shown = new Set(list.map(p => p[0].toLowerCase())), seen = new Set();
        const apps = q && !exact && storeQ === q ? store.filter(r => { const n = storeName(r.trackName).toLowerCase(); if (shown.has(n) || shown.has(r.trackName.toLowerCase()) || seen.has(r.trackId)) return false; seen.add(r.trackId); return true; }) : [];
        $('#suggest').innerHTML = list.map(p => `<button data-k="${ALL.indexOf(p)}">${favIcon({ name: p[0], domain: p[1], icon: p[4] })}${esc(p[0])}</button>`).join('') +
          (apps.length ? `<span class="suggest-h">App Store</span>` + apps.map(r => `<button data-s="${store.indexOf(r)}"><span class="icon fav full"><img alt="" loading="lazy" decoding="async" width="64" height="64" src="${esc(r.artworkUrl100 || storeArt(r))}"></span>${esc(storeName(r.trackName))}</button>`).join('') : '');
        $$('#suggest button').forEach(b => b.onclick = () => b.dataset.s !== undefined ? applyStore(store[b.dataset.s]) : applyPreset(ALL[b.dataset.k]));
        // ask the App Store too (debounced; a newer query wins; offline just means presets only)
        clearTimeout(storeT);
        if (q && !exact && storeQ !== q) {
          const seq = ++storeSeq;
          storeT = setTimeout(() => storeSearch(raw).then(res => { if (seq !== storeSeq || !$('#suggest')) return; store = res; storeQ = q; suggest(); }).catch(() => {}), 350);
        } else if (!q || exact) storeSeq++;
      };
      $('#aName').addEventListener('input', () => { suggest(); hero(); });
      $('#aDomain').addEventListener('input', hero);
      if (presetName) suggest();
      $('#saveAccount').onclick = () => {
        const name = $('#aName').value.trim();
        if (!name) { const f = $('#nameField'); f.classList.remove('invalid'); void f.offsetWidth; f.classList.add('invalid'); $('#aName').focus(); toast('填一下名称'); return; }
        const data = { name, handle: $('#aHandle').value.trim(), domain: cleanDomain($('#aDomain').value), category: cat, identityIds: [...sel], notes: $('#aNotes').value.trim() };
        if (icon) data.icon = icon;   // no key at all when there's no custom icon, for older clients
        let id; rememberApp(data.name, data.domain, data.category, data.icon, !existing || existing.name.toLowerCase() !== name.toLowerCase());
        if (existing) { Object.assign(existing, data); if (!icon) delete existing.icon; id = existing.id; } else { id = uid(); state.accounts.push({ id, createdAt: Date.now(), ...data }); }
        save(); render(); showAccount(id); toast(existing ? '已保存' : `已添加 ${name}`);
      };
      if (!existing && !presetName && matchMedia('(hover:hover)').matches) $('#aName').focus({ preventScroll: true });
    }, 0);
  }

  // ---------- add by picking: tap the apps you use, then say which email or number ----------
  function pickApps(presetId, query = '') {
    if (!state.identities.length) { identityForm(); toast('先添加一个邮箱或手机号'); return; }
    const ALL = [...PRESETS, ...myApps()], MINE = PRESETS.length;
    const chosen = new Set(), handles = {}; let cat = '常用', q = query, open = -1;
    const have = name => state.accounts.filter(x => x.name.toLowerCase() === name.toLowerCase()).length;
    let told = false;
    const gone = new Set(), mine = () => ALL.slice(MINE).some((p, i) => !gone.has(MINE + i));
    const cats = () => ['常用', ...(mine() ? ['我添加的'] : []), ...CATS.filter(c => ALL.some((p, i) => p[2] === c && !gone.has(i)))];
    const catsHtml = () => cats().map(c => `<button data-pc="${c}" class="${c === cat ? 'active' : ''}">${c}</button>`).join('');
    openSheet(`<div class="sheet-bar"><button data-close>取消</button><span class="t" id="pkTitle">选择网站或 App</span><button id="pkNext" disabled>下一步</button></div>
      <div class="pick-head">
        <div class="spot-field pk-field"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg><input id="pkQ" placeholder="搜索，或直接输入名字" value="${esc(q)}" autocomplete="off" enterkeyhint="search"></div>
        <div class="filters pk-cats" id="pkCats">${catsHtml()}</div>
      </div>
      <div class="sheet-body"><div class="pick-grid" id="pkGrid"></div></div>`, { kind: 'form' });
    const draw = () => {
      const ql = q.trim().toLowerCase();
      let list = ql ? ALL.filter(p => p[0].toLowerCase().includes(ql) || p[1].includes(ql))
        : cat === '常用' ? POPULAR.slice(0, 12).map(n => PRESETS.find(p => p[0] === n)).filter(Boolean)
        : cat === '我添加的' ? ALL.slice(MINE) : ALL.filter(p => p[2] === cat);
      list = list.filter(p => !gone.has(ALL.indexOf(p)));
      menuOff();
      $('#pkCats').style.display = ql ? 'none' : '';
      const exact = ql && ALL.some(p => p[0].toLowerCase() === ql);
      $('#pkGrid').innerHTML = list.map(p => { const k = ALL.indexOf(p), h = have(p[0]); return `<button class="pk ${chosen.has(k) ? 'on' : ''} ${h ? 'had' : ''}" data-pk="${k}">${favIcon({ name: p[0], domain: p[1], icon: p[4] })}<span>${esc(p[0])}</span>${sub(k, h)}<i class="pk-tick">${ICON.check}</i></button>`; }).join('') +
        (ql && !exact ? `<button class="pk custom" data-pk-custom="${esc(q.trim())}"><span class="icon">${ICON.plus}</span><span>添加“${esc(q.trim())}”</span></button>` : '') +
        (!ql ? `<button class="pk custom" data-pk-custom=""><span class="icon">${ICON.edit}</span><span>手动添加</span></button>` : '');
      if (open >= 0) { const t = $(`#pkGrid [data-pk="${open}"]`); t ? expand(t, false) : (open = -1); }
    };
    const sub = (k, h) => handles[k] ? `<small class="hd-on">@${esc(handles[k])}</small>` : h ? `<small>已记 ${h} 个</small>` : '';
    const paintSub = (tile, k) => { const html = sub(k, have(ALL[k][0])); tile.querySelector('small')?.remove(); if (html) tile.querySelector('span:not(.icon)').insertAdjacentHTML('afterend', html); };
    // tapping a tile opens a small drawer under its row for the username
    // the drawer opens/closes without animating height: it is revealed with clip-path + opacity and the
    // rows under it slide by its height with transforms (FLIP), so no frame re-lays-out the grid
    const rowsBelow = x => {
      const grid = x.parentElement, cs = getComputedStyle(grid), cols = cs.gridTemplateColumns.split(' ').length;
      const shift = x.offsetHeight + parseFloat(getComputedStyle(x).marginTop) + parseFloat(cs.rowGap || 0);
      const out = []; for (let t = x.nextElementSibling; t && out.length < cols * 8; t = t.nextElementSibling) out.push(t);   // ~the rows on screen
      return { shift, out };
    };
    const shut = (anim = true) => {
      const x = $('#pkExp'); if (!x) return; x.removeAttribute('id');
      $$('#pkGrid .pk.open').forEach(t => t.classList.remove('open'));
      if (!anim) return x.remove();
      const { shift, out } = rowsBelow(x), ease = 'cubic-bezier(.4,0,.2,1)';
      const slides = out.map(t => t.animate([{ transform: 'none' }, { transform: `translateY(${-shift}px)` }], { duration: 260, easing: ease, fill: 'forwards' }));
      x.animate([{ opacity: 1, clipPath: 'inset(0 0 0 0)' }, { opacity: 0, clipPath: 'inset(0 0 100% 0)' }], { duration: 260, easing: ease, fill: 'forwards' })
        .onfinish = () => { x.remove(); slides.forEach(a => a.cancel()); };
    };
    const expand = (tile, anim = true) => {
      const grid = $('#pkGrid'), k = +tile.dataset.pk, p = ALL[k];
      $('#pkExp')?.remove();
      $$('#pkGrid .pk.open').forEach(t => t.classList.remove('open')); tile.classList.add('open');
      const tiles = [...grid.children].filter(t => !t.classList.contains('pk-exp')), i = tiles.indexOf(tile);
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const end = tiles[Math.min(Math.ceil((i + 1) / cols) * cols, tiles.length) - 1];
      const n = have(p[0]);
      const x = document.createElement('div'); x.id = 'pkExp'; x.className = 'pk-exp';
      x.style.setProperty('--ax', (tile.offsetLeft + tile.offsetWidth / 2) + 'px');
      x.innerHTML = `<div class="pk-exp-in">${favIcon({ name: p[0], domain: p[1], icon: p[4] })}<div class="pk-exp-f"><label>${esc(p[0])} 账号名</label><input id="pkHd" value="${esc(handles[k] || '')}" placeholder="${n ? `第 ${n + 1} 个账号，填用户名区分` : '用户名、昵称或 UID，选填'}" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"></div><button class="pk-exp-x" id="pkHdOk">好</button></div>`;
      end.after(x);
      const inp = $('#pkHd');
      inp.oninput = () => { const v = inp.value.trim(); v ? handles[k] = v : delete handles[k]; paintSub(tile, k); };
      const done = () => { inp.blur(); open = -1; shut(); };
      inp.onkeydown = e => { if (e.key === 'Enter') done(); };
      $('#pkHdOk').onclick = e => { e.stopPropagation(); done(); };
      if (anim) {
        const { shift, out } = rowsBelow(x), ease = 'cubic-bezier(.2,.9,.25,1)';
        out.forEach(t => t.animate([{ transform: `translateY(${-shift}px)` }, { transform: 'none' }], { duration: 380, easing: ease }));
        x.animate([{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }], { duration: 380, easing: ease });
        x.firstChild.animate([{ transform: 'translateY(-10px) scale(.97)' }, { transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.34,1.3,.64,1)' });
        setTimeout(() => { const body = $('.sheet-body', sheet); if (!body || !x.isConnected) return; const r = x.getBoundingClientRect(), br = body.getBoundingClientRect(); if (r.bottom > br.bottom - 8) body.scrollBy({ top: r.bottom - br.bottom + 24, behavior: 'smooth' }); }, 200);
      }
    };
    // long-press (or right-click) one of your own apps to take it off the list
    const menuOff = () => { const m = $('#pkMenu'); if (!m) return; m.id = ''; m.classList.remove('open'); setTimeout(() => m.remove(), 250); };
    const menuFor = tile => {
      const k = +tile.dataset.pk; if (k < MINE || gone.has(k)) return;
      menuOff(); navigator.vibrate?.(8);
      const n = have(ALL[k][0]), r = tile.getBoundingClientRect(), m = document.createElement('div');
      m.className = 'icon-menu pk-menu'; m.id = 'pkMenu';
      m.innerHTML = `${n ? '<p>只会从这个列表移除，已记录的账号不受影响。</p>' : ''}<button class="destructive" data-rm><span>从列表移除</span><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7"/></svg></button>`;
      m.style.left = Math.min(Math.max(r.left + r.width / 2, 122), innerWidth - 122) + 'px';
      document.body.appendChild(m);
      const below = r.bottom + 8 + m.offsetHeight < innerHeight - 8;
      m.style.top = (below ? r.bottom + 8 : r.top - 8 - m.offsetHeight) + 'px'; m.style.transformOrigin = below ? '50% 0' : '50% 100%';
      tile.animate([{ transform: 'scale(.92)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.34,1.45,.64,1)' });
      requestAnimationFrame(() => m.classList.add('open'));
      m.querySelector('[data-rm]').onclick = e => { e.stopPropagation(); menuOff(); removeApp(k); };
    };
    const removeApp = k => {
      forgetApp(ALL[k][0]); gone.add(k);
      if (chosen.has(k)) { chosen.delete(k); delete handles[k]; sync(); }
      if (open === k) open = -1;
      shut(false);
      const grid = $('#pkGrid'), tile = $(`#pkGrid [data-pk="${k}"]`);
      const after = () => {
        if (!mine() && cat === '我添加的') {   // nothing left of yours: the tab goes and 常用 takes over
          cat = '常用'; $('#pkCats').innerHTML = catsHtml(); draw();
          grid.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.25,1)' });
          return;
        }
        if (!mine()) $('#pkCats').innerHTML = catsHtml();
        const tiles = [...grid.children], first = new Map(tiles.map(t => [t, t.getBoundingClientRect()]));
        tile?.remove();
        tiles.forEach(t => { if (!t.isConnected) return; const a = first.get(t), b = t.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
          if (dx || dy) t.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.25,1)' }); });
      };
      if (!tile) return after();
      tile.style.pointerEvents = 'none';
      tile.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.5)' }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).onfinish = after;
    };
    const sync = () => {
      const n = chosen.size, b = $('#pkNext');
      b.disabled = !n; b.textContent = n ? `下一步（${n}）` : '下一步';
      $('#pkTitle').textContent = n ? `已选 ${n} 个` : '选择网站或 App';
    };
    setTimeout(() => {
      draw();
      $('#pkQ').addEventListener('input', e => { q = e.target.value; draw(); });
      $('#pkCats').onclick = e => { const b = e.target.closest('[data-pc]'); if (!b) return; cat = b.dataset.pc; $$('#pkCats button').forEach(x => x.classList.toggle('active', x === b)); draw(); $('.sheet-body', sheet).scrollTop = 0; };
      let press, pressAt, pressed = false;
      const grid = $('#pkGrid'), cancelPress = () => { clearTimeout(press); press = 0; };
      grid.addEventListener('pointerdown', e => {
        cancelPress(); pressed = false; if (e.button > 0) return;
        const b = e.target.closest('[data-pk]'); if (!b || +b.dataset.pk < MINE) return;
        pressAt = [e.clientX, e.clientY];
        press = setTimeout(() => { press = 0; pressed = true; menuFor(b); }, 500);
      });
      grid.addEventListener('pointermove', e => { if (press && Math.hypot(e.clientX - pressAt[0], e.clientY - pressAt[1]) > 10) cancelPress(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => grid.addEventListener(t, cancelPress));
      grid.addEventListener('contextmenu', e => {
        const b = e.target.closest('[data-pk]'); if (!b || +b.dataset.pk < MINE) return;
        e.preventDefault(); if (pressed && $('#pkMenu')) return; cancelPress(); menuFor(b);
      });
      const offMenu = e => { if (!$('#pkGrid')) { document.removeEventListener('pointerdown', offMenu, true); return; } if (!e.target.closest('#pkMenu')) menuOff(); };
      document.addEventListener('pointerdown', offMenu, true);
      $('.sheet-body', sheet).addEventListener('scroll', menuOff, { passive: true });
      $('#pkGrid').onclick = e => {
        if (pressed) { pressed = false; return; }   // the long-press already opened the menu
        const c = e.target.closest('[data-pk-custom]');
        if (c) return accountForm(null, presetId, c.dataset.pkCustom);
        const b = e.target.closest('[data-pk]'); if (!b) return;
        const k = +b.dataset.pk, h = have(ALL[k][0]);
        if (chosen.has(k) && open !== k) { open = k; expand(b); return; }   // selected but closed: reopen its drawer
        if (h && !chosen.has(k) && !told) { told = true; toast(`再记一个 ${ALL[k][0]} 账号，填个账号名区分`); }
        if (chosen.has(k)) { chosen.delete(k); delete handles[k]; open = -1; shut(); paintSub(b, k); }
        else { chosen.add(k); open = k; expand(b); }
        b.classList.toggle('on'); if (b.classList.contains('on')) b.animate([{ transform: 'scale(.86)' }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.34,1.45,.64,1)' });
        sync();
      };
      $('#pkNext').onclick = () => { if (!chosen.size) return; const ks = [...chosen]; pickIdentities(ks.map(k => ALL[k]), presetId, q, ks.map(k => handles[k] || '')); };
      if (q) $('#pkQ').focus();
    }, 0);
  }

  function pickIdentities(picks, presetId, q, hds = []) {
    const sel = new Set(presetId && idById(presetId) ? [presetId] : cur() ? [cur().id] : []);
    const fakes = picks.map(p => ({ name: p[0], domain: p[1], icon: p[4] }));
    openSheet(`<div class="sheet-bar"><button id="pkBack">返回</button><span class="t">用哪个注册的</span><button id="pkSave">添加</button></div>
      <div class="sheet-body form">
        <div class="form-hero" style="--pc:${brand(fakes[0])}"><span class="pk-stack">${fakes.slice(0, 5).map(f => favIcon(f, 'lg')).join('')}</span><b>${picks.length === 1 ? esc(picks[0][0]) : `${esc(picks[0][0])} 等 ${picks.length} 个`}</b></div>
        ${idPicksHtml(sel, '用哪个邮箱或手机号注册、绑定的')}
        <p class="hint">可以多选，比如用邮箱注册、再绑定了手机号；用微信或 Apple 登录的，选下面的登录账号。</p>
        <div class="sec-title">账号名</div>
        <div class="group">${picks.map((p, k) => { const n = state.accounts.filter(x => x.name.toLowerCase() === p[0].toLowerCase()).length; return `<div class="field hd-field">${favIcon(fakes[k])}<input data-hd="${k}" value="${esc(hds[k] || '')}" placeholder="${n ? `第 ${n + 1} 个${esc(p[0])}账号，填用户名区分` : `${esc(p[0])}的用户名或昵称（选填）`}" autocapitalize="off" autocorrect="off" spellcheck="false"></div>`; }).join('')}</div>
        <p class="hint">同一个网站有好几个账号时，靠它区分。</p>
      </div>`, { kind: 'form' });
    setTimeout(() => {
      wirePicks(sel);
      $('#pkBack').onclick = () => pickApps(presetId, q);
      $('#pkSave').onclick = () => {
        const now = Date.now(), made = picks.map((p, k) => ({ id: uid(), createdAt: now + k, name: p[0], handle: ($(`[data-hd="${k}"]`)?.value || '').trim(), domain: p[1], category: p[2], identityIds: [...sel], notes: '', ...(p[4] ? { icon: p[4] } : {}) }));
        state.accounts.push(...made); save(); render();
        if (made.length === 1) showAccount(made[0].id); else if (sel.size === 1) showIdentity([...sel][0]); else closeSheet();
        toast(made.length === 1 ? `已添加 ${made[0].name}` : `已添加 ${made.length} 个`);
      };
    }, 0);
  }

  function confirmSheet(title, text, label, fn) {
    openSheet(`<div class="sheet-body"><div class="alert"><h3>${esc(title)}</h3><p>${text}</p></div>
      <div class="alert-actions"><button class="destructive" id="cOk">${esc(label)}</button><button data-close>取消</button></div></div>`, { kind: 'confirm' });
    setTimeout(() => { $('#cOk').onclick = () => { closeSheet(); fn(); }; }, 0);
  }

  // ---------- card order ----------
  function orderSheet() {
    if (!state.identities.length) return toast('还没有邮箱或手机号');
    const kinds = [['email', '邮箱'], ['phone', '手机号'], ['login', '登录']].filter(([k]) => state.identities.some(i => i.type === k));
    kinds.sort((a, b) => (b[0] === ui.kind) - (a[0] === ui.kind));
    const row = i => `<div class="ord" data-oid="${i.id}">
        <span class="ord-sw ${i.type === 'phone' ? 'sim' : ''}" style="--c:${i.color};--g:${skin(i.color)}">${isESim(i) ? '<b class="esim-t">eSIM</b>' : idGlyph(i)}</span>
        <span class="ord-t"><b>${esc(i.label || display(i))}</b>${i.label ? `<small>${esc(display(i))}</small>` : ''}</span>
        <button class="ord-h" aria-label="拖动排序，可用上下方向键"><svg viewBox="0 0 24 24"><path d="M5 8h14M5 12h14M5 16h14"/></svg></button>
      </div>`;
    openSheet(`${bar('取消', '卡片顺序', '完成', 'id="saveOrder"')}
      <div class="sheet-body">
        <p class="hint" style="margin:2px 4px 0">按住右侧把手上下拖动。排在第一位的卡会在卡包里最先出现。</p>
        ${kinds.map(([k, n]) => `<div class="sec-title">${n}</div><div class="group ord-list" data-kind="${k}">${state.identities.filter(i => i.type === k).map(row).join('')}</div>`).join('')}
      </div>`, { kind: 'order' });
    setTimeout(() => {
      $$('.ord-list').forEach(dragList);
      $('#saveOrder').onclick = () => {
        const rank = new Map();
        $$('.ord-list').forEach(l => $$('.ord', l).forEach((r, k) => rank.set(r.dataset.oid, k)));
        const front = cur()?.id;
        const next = state.identities.map(i => ({ ...i, order: rank.get(i.id) ?? i.order }));
        const seq = a => a.map(i => i.id).join();
        const changed = seq(state.identities.filter(i => rank.has(i.id)).sort((a, b) => a.type.localeCompare(b.type) || rank.get(a.id) - rank.get(b.id))) !== seq(['email', 'login', 'phone'].flatMap(t => state.identities.filter(i => i.type === t))) ;
        closeSheet();
        if (!changed) return;
        snap();
        state.identities = next.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
        save(); setKind(ui.kind, front); render(); undoToast('顺序已更新');
      };
    }, 0);
  }
  function dragList(list) {
    const rows = () => $$('.ord', list);
    const move = (r, to) => {   // keyboard / programmatic move with a small FLIP
      const rs = rows(), from = rs.indexOf(r); to = Math.max(0, Math.min(rs.length - 1, to)); if (to === from) return;
      const before = new Map(rs.map(x => [x, x.getBoundingClientRect().top]));
      to > from ? rs[to].after(r) : rs[to].before(r);
      if (!calm()) rows().forEach(x => { const d = before.get(x) - x.getBoundingClientRect().top; if (d) x.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.32,.72,0,1)' }); });
    };
    list.addEventListener('keydown', e => {
      const h = e.target.closest('.ord-h'); if (!h || !/ArrowUp|ArrowDown/.test(e.key)) return;
      e.preventDefault(); const r = h.closest('.ord'); move(r, rows().indexOf(r) + (e.key === 'ArrowUp' ? -1 : 1)); h.focus();
    });
    let busy = false;   // a drag or its settle is in progress; a second finger can't start another
    list.addEventListener('pointerdown', e => {
      const h = e.target.closest('.ord-h'); if (!h || e.button > 0 || busy) return;
      e.preventDefault(); busy = true;
      const r = h.closest('.ord'), rs = rows(), from = rs.indexOf(r);
      // real slot positions (rows can differ in height: with or without a second line)
      const tops = rs.map(x => x.offsetTop), hts = rs.map(x => x.offsetHeight), H = hts[from], y0 = e.clientY;
      const minDy = tops[0] - tops[from], maxDy = tops[rs.length - 1] + hts[rs.length - 1] - H - tops[from];
      const slotDy = t => t > from ? tops[t] + hts[t] - H - tops[from] : tops[t] - tops[from];
      let to = from, dy = 0, raf = 0;
      h.setPointerCapture(e.pointerId);
      list.classList.add('sorting'); r.classList.add('lift');
      const paint = () => { raf = 0; r.style.transform = `translate3d(0,${dy}px,0)`; };
      const mv = ev => {
        dy = Math.max(minDy, Math.min(maxDy, ev.clientY - y0));
        if (!raf) raf = requestAnimationFrame(paint);   // one write per frame, however fast the pointer reports
        const mid = tops[from] + dy + H / 2;
        let n = from;
        for (let k = from + 1; k < rs.length; k++) if (mid > tops[k] + hts[k] / 2) n = k;
        for (let k = from - 1; k >= 0; k--) if (mid < tops[k] + hts[k] / 2) n = k;
        if (n === to) return; to = n;
        if (navigator.vibrate) try { navigator.vibrate(4); } catch {}
        rs.forEach((x, k) => { if (x === r) return; const s = k > from && k <= to ? -H : k < from && k >= to ? H : 0; x.style.transform = s ? `translate3d(0,${s}px,0)` : ''; });
      };
      const up = () => {
        h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        // settle the lifted row into its slot, then commit the DOM order in one frame with transitions off,
        // so no row animates back from its old offset after it has moved in the DOM
        r.classList.remove('lift');
        r.style.transform = `translate3d(0,${slotDy(to)}px,0)`;
        const commit = () => {
          list.classList.add('ord-commit');
          rs.forEach(x => x.style.transform = '');
          if (to !== from) to > from ? rs[to].after(r) : rs[to].before(r);
          void list.offsetHeight;
          list.classList.remove('ord-commit', 'sorting');
          busy = false;
        };
        if (calm()) return commit();
        let done = false;
        const onEnd = ev => { if (ev.target === r && ev.propertyName === 'transform') fin(); };
        const fin = () => { if (done) return; done = true; r.removeEventListener('transitionend', onEnd); commit(); };
        r.addEventListener('transitionend', onEnd);
        setTimeout(fin, 320);
      };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
  }

  // ---------- spotlight ----------
  let spotItems = [], spotSel = -1;
  function openSpot() { $('#spotLayer').classList.add('show'); const i = $('#spotInput'); i.value = ''; renderSpot(''); setTimeout(() => i.focus(), 60); }
  const closeSpot = () => { $('#spotLayer').classList.remove('show'); $('#spotInput').blur(); };
  function hl(text, q) {
    const s = String(text); if (!q) return esc(s);
    const k = s.toLowerCase().indexOf(q.toLowerCase());
    return k < 0 ? esc(s) : esc(s.slice(0, k)) + '<mark>' + esc(s.slice(k, k + q.length)) + '</mark>' + esc(s.slice(k + q.length));
  }
  function renderSpot(q) {
    q = q.trim(); const ql = q.toLowerCase(), qd = q.replace(/\D/g, '');
    const accs = q ? state.accounts.filter(a => a.name.toLowerCase().includes(ql) || (a.domain || '').includes(ql) || (a.handle || '').toLowerCase().includes(ql)).slice(0, 8) : [];
    const ids = q ? state.identities.filter(i => i.value.toLowerCase().includes(ql) || (i.label || '').toLowerCase().includes(ql) || (qd.length >= 3 && i.value.replace(/\D/g, '').includes(qd))).slice(0, 6) : [];
    spotItems = [...accs.map(a => ['account', a.id]), ...ids.map(i => ['identity', i.id])]; spotSel = spotItems.length ? 0 : -1;
    const box = $('#spotResults');
    if (!q) { box.innerHTML = `<div class="spot-empty">输入网站名，看它用的是哪个邮箱。<br>输入邮箱或号码，看它绑定了哪些 App。</div>`; return; }
    if (!spotItems.length) { box.innerHTML = `<div class="spot-empty">没有找到“${esc(q)}”<br><button class="btn-filled" data-quick="${esc(q)}">添加“${esc(q)}”</button></div>`; return; }
    box.innerHTML =
      (accs.length ? `<div class="sec-title">网站与 App</div>${accs.map(a => reel(a).replace(`<span class="reel-title">${esc(a.name)}`, `<span class="reel-title">${hl(a.name, q)}`)).join('')}` : '') +
      (ids.length ? `<div class="sec-title">邮箱、手机号与登录账号</div><div class="group">${ids.map(i => `<button class="cell" data-identity="${i.id}">${idIcon(i)}<span class="cell-main"><span class="cell-title">${ui.privacy ? esc(display(i)) : hl(i.value, q)}</span><span class="cell-sub">${esc(i.label || '')}${i.label ? '，' : ''}${accountsOf(i.id).length} 个网站与 App</span></span>${ICON.chev}</button>`).join('')}</div>` : '');
    markSpot();
    $$('#spotResults .reel, #spotResults .cell').forEach((el, k) => el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: k * 20, easing: 'ease-out', fill: 'backwards' }));
  }
  function markSpot() { $$('#spotResults .reel, #spotResults .cell').forEach((c, k) => c.classList.toggle('sel', k === spotSel)); }

  // ---------- import / export ----------
  function exportData() {
    if (native) { native.postMessage({ file: `账号备份-${new Date().toISOString().slice(0, 10)}.json`, text: JSON.stringify({ app: 'atlas', version: 1, exportedAt: new Date().toISOString(), identities: state.identities, accounts: state.accounts }, null, 2) }); return; }
    const blob = new Blob([JSON.stringify({ app: 'atlas', version: 1, exportedAt: new Date().toISOString(), identities: state.identities, accounts: state.accounts }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `账号备份-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500); toast('备份已导出');
  }
  function importData(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!Array.isArray(d.identities) || !Array.isArray(d.accounts)) throw 0;
        snap(); state = { identities: d.identities, accounts: d.accounts }; save(); render();
        undoToast(`已导入 ${d.identities.length} 个身份和 ${d.accounts.length} 个网站`);
      } catch { toast('这不是 Atlas 的备份文件'); }
    };
    r.readAsText(file);
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const menu = $('#menu');
    if (!e.target.closest('#menu,#menuBtn')) menu.classList.remove('open');
    const t = e.target.closest('button,a,[data-account],[data-identity]'); if (!t) return;
    const d = t.dataset;
    if (t.classList.contains('round')) tapFx(t);
    if (t.id === 'menuBtn') return menu.classList.toggle('open');
    if (t.id === 'addBtn') return setTimeout(() => !state.identities.length ? identityForm() : pickApps(ui.tab === 'home' ? cur()?.id : null), calm() ? 0 : 110);
    if (d.kind) return switchKind(d.kind);
    if (t.id === 'gridAdd') return pickApps(cur()?.id);
    if (t.id === 'openSearch') return setTimeout(openSpot, calm() ? 0 : 110);
    if (t.id === 'spotCancel') return closeSpot();
    if (d.act) {
      menu.classList.remove('open');
      if (d.act === 'privacy') { ui.privacy = !ui.privacy; localStorage.setItem('atlas.privacy', ui.privacy ? '1' : '0'); render(); refreshSheet(); toast(ui.privacy ? '号码已隐藏' : '号码已显示'); }
      if (d.act === 'theme') setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', t);
      if (d.act === 'sync') syncSheet();
      if (d.act === 'order') orderSheet();
      if (d.act === 'export') exportData();
      if (d.act === 'import') $('#fileInput').click();
      if (d.act === 'download') window.open('https://github.com/Ckxkx/account-atlas/releases/latest', '_blank', 'noopener');
      if (d.act === 'demo') { snap(); state = demo(); save(); setKind('email'); render(); undoToast('已载入示例'); }
      if (d.act === 'wipe') confirmSheet('清空全部数据？', Sync.on ? '所有邮箱、手机号和网站记录都会删除，开了同步的其他设备也会一起清空。建议先导出备份。' : '所有邮箱、手机号和网站记录都会从这台设备上删除。建议先导出备份。', '清空全部数据', () => { snap(); state = { identities: [], accounts: [] }; save(); render(); undoToast('已清空'); });
      return;
    }
    if (t.closest('#tabbar')) return setTab(d.tab);
    if (d.cat) { ui.cat = d.cat; renderSites(); return; }
    if (d.close !== undefined || d.sheetLeft !== undefined) {
      if (d.sheetLeft !== undefined && !t.textContent.trim()) return;
      return closeSheet();
    }
    if (d.new === 'identity') return identityForm(null, d.type);
    if (d.new === 'account') return pickApps(d.preset);
    if (d.quick !== undefined) { closeSpot(); return pickApps(null, d.quick); }
    if (d.copy) { navigator.clipboard?.writeText(d.copy).then(() => toast('已复制'), () => toast('复制失败')); return; }
    if (d.editIdentity) return identityForm(idById(d.editIdentity));
    if (d.editAccount) return accountForm(accById(d.editAccount));
    if (d.delIdentity) {
      const i = idById(d.delIdentity), n = accountsOf(i.id).length;
      return confirmSheet(`删除 ${display(i)}？`, n ? `它会从 ${n} 个网站与 App 的记录里移除，这些网站本身会保留。` : '删除后几秒内可以撤销。', '删除', () => {
        snap(); state.identities = state.identities.filter(x => x.id !== i.id); state.accounts.forEach(a => a.identityIds = a.identityIds.filter(x => x !== i.id)); state.identities.forEach(x => { if (x.via === i.id) delete x.via; }); save(); render(); undoToast('已删除');
      });
    }
    if (d.delAccount) {
      const a = accById(d.delAccount);
      return confirmSheet(`删除 ${a.name}？`, '只删除这条记录，不影响你在那个网站上的账号。', '删除', () => { snap(); state.accounts = state.accounts.filter(x => x.id !== a.id); save(); render(); undoToast('已删除'); });
    }
    if (d.account) { if ($('#spotLayer').classList.contains('show')) closeSpot(); return showAccount(d.account); }
    if (d.identity) {
      if ($('#spotLayer').classList.contains('show')) closeSpot();
      // tapping a side card in the wallet brings it to the front first
      const w = t.closest('#wallet');
      if (w) { const k = $$('.wcard', w).indexOf(t); if (k !== ui.active) { centerCard(w, t); return; } }
      return showIdentity(d.identity);
    }
  });

  $('#scrim').onclick = closeSheet;
  $('#fileInput').onchange = e => { const f = e.target.files[0]; if (f) importData(f); e.target.value = ''; };
  $('#spotInput').addEventListener('input', e => renderSpot(e.target.value));
  $('#spotInput').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && spotItems.length) { spotSel = Math.min(spotItems.length - 1, spotSel + 1); markSpot(); e.preventDefault(); }
    if (e.key === 'ArrowUp' && spotItems.length) { spotSel = Math.max(0, spotSel - 1); markSpot(); e.preventDefault(); }
    if (e.key === 'Enter') { const it = spotItems[spotSel]; if (it) { closeSpot(); it[0] === 'account' ? showAccount(it[1]) : showIdentity(it[1]); } else $('[data-quick]')?.click(); }
  });
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSpot(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); openSpot(); }
    else if (e.key === 'Escape') { if ($('#spotLayer').classList.contains('show')) closeSpot(); else closeSheet(); $('#menu').classList.remove('open'); }
    else if (!typing && ui.tab === 'home' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const w = $('#wallet'), cards = $$('.wcard', w), c = cards[Math.max(0, Math.min(cards.length - 1, ui.active + (e.key === 'ArrowRight' ? 1 : -1)))];
      if (c) centerCard(w, c);
    }
  });
  {
    const w = $('#wallet');
    // will-change only while the cards are moving; scrollend (or 140 ms of quiet) ends it
    w.addEventListener('scroll', () => {
      if (!moving) { moving = true; w.classList.add('moving'); }
      clearTimeout(settleT); settleT = setTimeout(walletSettled, 140);
      if (!rafCF) rafCF = requestAnimationFrame(coverflow);
    }, { passive: true });
    w.addEventListener('scrollend', walletSettled, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(() => { if (geo) geo.ok = false; if (!rafCF) rafCF = requestAnimationFrame(coverflow); }).observe(w);
  }
  const top = $('#top');
  let topOn = false, rafTop = 0;
  addEventListener('scroll', () => {
    if (rafTop) return;
    rafTop = requestAnimationFrame(() => { rafTop = 0; const on = scrollY > 30; if (on !== topOn) top.classList.toggle('scrolled', topOn = on); });
  }, { passive: true });
  addEventListener('resize', () => { Graph.resize(); if (geo) geo.ok = false; if (!rafCF) rafCF = requestAnimationFrame(coverflow); });

  // ---------- relationship map: identities on the left, apps on the right, threads between ----------
  const Graph = (() => {
    let sel = null, running = false, drawn = false, built = '', pre = 0;
    const ROW = 54;
    function layout() {
      const TR = t => KINDS.indexOf(t);
      const ids = state.identities.filter(i => TR(i.type) >= 0).sort((p, q) => TR(p.type) - TR(q.type));
      const idx = id => ids.findIndex(i => i.id === id);
      const first = a => { const ks = a.identityIds.map(idx).filter(k => k >= 0); return ks.length ? Math.min(...ks) : 1e3; };
      const apps = state.accounts.slice().sort((a, b) => first(a) - first(b) || b.identityIds.length - a.identityIds.length || zh(a.name, b.name));
      const ay = {}; apps.forEach((a, k) => ay[a.id] = k * ROW + ROW / 2);
      const H = Math.max(apps.length * ROW, ids.length * 78, 120);
      // each card sits at the middle of its apps, then nudge apart so cards never overlap
      let pos = ids.map(i => { const ys = accountsOf(i.id).map(a => ay[a.id]); return { i, y: ys.length ? ys.reduce((s, v) => s + v, 0) / ys.length : H }; });
      // emails first, then phone numbers, then login cards, with a small label above each group
      pos.sort((p, q) => TR(p.i.type) - TR(q.i.type) || p.y - q.y);
      const GAP = 78, half = 33, LBL = 30;
      const brk = new Set(pos.map((p, k) => k && p.i.type !== pos[k - 1].i.type ? k : -1).filter(k => k > 0));
      const minY = []; pos.forEach((p, k) => minY[k] = k ? minY[k - 1] + GAP + (brk.has(k) ? LBL : 0) : half + LBL);
      for (let k = 0; k < pos.length; k++) pos[k].y = Math.max(pos[k].y, minY[k]);
      const over = pos.length ? pos[pos.length - 1].y - (H - half) : 0;
      if (over > 0) for (let k = pos.length - 1; k >= 0; k--) { pos[k].y = Math.min(pos[k].y, k === pos.length - 1 ? H - half : pos[k + 1].y - GAP - (brk.has(k + 1) ? LBL : 0)); pos[k].y = Math.max(pos[k].y, minY[k]); }
      // the group label can push cards past the app column, so grow the box to fit them
      const H2 = Math.max(H, pos.length ? pos[pos.length - 1].y + half : 0);
      return { apps, ay, pos, H: H2, brk };
    }
    function render() {
      const box = $('#mapBox'); if (!box) return;
      const n = state.accounts.length, multi = state.accounts.filter(a => a.identityIds.length > 1).length;
      $('#graphSummary').textContent = n ? `${state.identities.length} 个身份，${n} 个网站与 App` + (multi ? `，${multi} 个绑了不止一个` : '') : '';
      if (!state.identities.length || !n) { box.innerHTML = `<div class="empty"><h3>还没有可以连线的</h3><p>添加一个邮箱或手机号，再给它记几个网站，这里就会连起来。</p><button class="btn-filled" data-new="${state.identities.length ? 'account' : 'identity'}">${state.identities.length ? '添加网站或 App' : '添加邮箱或手机号'}</button></div>`; return; }
      const { apps, ay, pos, H, brk } = layout();
      const W = box.clientWidth || 350, L = Math.min(150, Math.round(W * .38)), R = L + Math.max(56, Math.round(W * .17));
      const paths = [];
      for (const p of pos) for (const a of accountsOf(p.i.id)) {
        const y1 = p.y, y2 = ay[a.id], mx = (L + R) / 2;
        paths.push(`<path data-i="${p.i.id}" data-a="${a.id}" style="--c:${p.i.color}" d="M${L} ${y1.toFixed(1)}C${mx} ${y1.toFixed(1)} ${mx} ${y2.toFixed(1)} ${R - 6} ${y2.toFixed(1)}"/>`);
      }
      box.style.height = H + 'px';
      box.innerHTML = `<svg class="threads" viewBox="0 0 ${W} ${H}" style="width:${W}px;height:${H}px" aria-hidden="true">${paths.join('')}</svg>
        ${pos.map((p, k) => (k === 0 || brk.has(k)) ? `<span class="mgroup" style="top:${p.y - 31 - 24}px;width:${L}px">${p.i.type === 'phone' ? ICON.phone + '手机号' : p.i.type === 'login' ? ICON.login + '登录' : ICON.email + '邮箱'}</span>` : '').join('')}
        ${pos.map(p => { const c = accountsOf(p.i.id).length; return `<button class="mcard" data-map-identity="${p.i.id}" style="top:${p.y - 31}px;width:${L}px;--c:${p.i.color};--g:${skin(p.i.color)}"><span class="mk">${idGlyph(p.i)}<b>${c}</b></span><span class="mv">${esc(p.i.label || display(p.i))}</span>${p.i.label ? `<span class="ms">${esc(display(p.i))}</span>` : ''}</button>`; }).join('')}
        ${apps.map(a => `<button class="mapp ${a.identityIds.length ? '' : 'loose'}" data-account="${a.id}" style="top:${ay[a.id] - ROW / 2}px;left:${R}px">${favIcon(a)}<span class="mn">${esc(a.name)}${handle(a)}</span>${a.identityIds.length > 1 ? `<span class="mdots">${a.identityIds.map(idById).filter(Boolean).map(i => `<i style="--c:${i.color}"></i>`).join('')}</span>` : ''}</button>`).join('')}`;
      built = dataVer + ':' + W;
      apply(); if (running) draw();
    }
    // lengths are measured once per path (geometry only) and cached for revisits
    function draw() {
      if (drawn) return; drawn = true;
      // wait two frames so the tab is actually visible (content-visibility) before the threads start drawing
      const ps = $$('#mapBox .threads path');
      ps.forEach(p => { const len = p._len || (p._len = Math.ceil(p.getTotalLength()) + 2); p.style.strokeDasharray = `${len}px ${len}px`; p.style.strokeDashoffset = `${len}px`; });   // hidden until the draw starts, no flash
      requestAnimationFrame(() => requestAnimationFrame(() => { ps.forEach((p, k) => { const len = p._len; p.style.strokeDasharray = p.style.strokeDashoffset = ''; if (!running) return; p.animate([{ strokeDasharray: `${len}px ${len}px`, strokeDashoffset: `${len}px` }, { strokeDasharray: `${len}px ${len}px`, strokeDashoffset: '0px' }], { duration: 700, delay: 60 + Math.min(k, 20) * 18, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }); }); }));
    }
    function apply() {
      const box = $('#mapBox'); if (!box) return;
      box.classList.toggle('focus', !!sel);
      const linked = new Set(sel ? accountsOf(sel).map(a => a.id) : []);
      $$('.threads path', box).forEach(p => p.classList.toggle('on', p.dataset.i === sel));
      $$('.mcard', box).forEach(c => c.classList.toggle('on', c.dataset.mapIdentity === sel));
      $$('.mapp', box).forEach(c => c.classList.toggle('on', linked.has(c.dataset.account)));
    }
    document.addEventListener('click', e => {
      if (ui.tab !== 'graph' || e.target.closest('.sheet,.menu,#tabbar,.top')) return;
      const c = e.target.closest('[data-map-identity]');
      if (c) { const id = c.dataset.mapIdentity; if (sel === id) showIdentity(id); else { sel = id; apply(); } return; }
      if (!e.target.closest('.mapp') && sel) { sel = null; apply(); }
    });
    let rz;
    return {
      // coming back to an unchanged map reuses its DOM and only replays the thread draw-in
      start() {
        running = true; drawn = false; sel = null;
        const box = $('#mapBox');
        if (box && built && built === dataVer + ':' + (box.clientWidth || 350)) { apply(); draw(); } else render();
      },
      stop() { running = false; },
      // build the map while the browser is idle and the tab is hidden, so the first visit only plays the draw-in
      prebuild() {
        clearTimeout(pre); const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
        pre = setTimeout(() => idle(() => { const box = $('#mapBox'); if (!running && box && built !== dataVer + ':' + (box.clientWidth || 350)) render(); }, { timeout: 2000 }), 400);
      },
      rebuild() { if (running) render(); },
      resize() { if (running) { clearTimeout(rz); rz = setTimeout(render, 120); } },
    };
  })();

  // ---------- end-to-end encrypted sync (Gitee or GitHub private gist) ----------
  const Sync = (() => {
    const CONF = 'atlas.sync', FILE = 'atlas.enc.json', DESC = '账号星图 · 加密数据（只有同步密码能解开）';
    const enc = new TextEncoder(), dec = new TextDecoder();
    const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
    const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    let conf = (() => { try { return JSON.parse(localStorage.getItem(CONF)); } catch { return null; } })();
    let key = null, timer = null, busy = false, again = false;
    const status = { state: conf ? 'idle' : 'off', at: conf?.at || 0, err: '' };
    const listeners = new Set(); const emit = () => listeners.forEach(f => f());

    async function derive(pass, salt) {
      const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    }
    async function seal(obj) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
      return JSON.stringify({ v: 1, salt: conf.salt, iv: b64(iv), ct: b64(ct), at: Date.now() });
    }
    async function open(text, k = key) {
      const box = JSON.parse(text);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, k, unb64(box.ct));
      return JSON.parse(dec.decode(pt));
    }
    // Two homes for the encrypted file: Gitee (reachable in mainland China without a proxy) or GitHub.
    const HOSTS = {
      gitee: { base: 'https://gitee.com/api/v5', name: 'Gitee' },
      github: { base: 'https://api.github.com', name: 'GitHub' },
    };
    async function gh(path, opt = {}, token = conf?.token, prov = conf?.provider || 'github') {
      const h = HOSTS[prov]; let url = h.base + path, init = { method: opt.method || 'GET', cache: 'no-store', headers: {} };
      if (prov === 'gitee') {
        if (init.method === 'GET') url += (url.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token);
        else { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify({ access_token: token, ...JSON.parse(opt.body || '{}') }); }
      } else {
        init.headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) };
        if (opt.body) init.body = opt.body;
      }
      let r;
      try { r = await fetch(url, init); }
      catch { throw new Error(navigator.onLine === false ? '没有网络，联网后会自动同步' : `连不上 ${h.name}` + (prov === 'github' ? '，国内网络建议改用 Gitee' : '')); }
      if (r.status === 401) throw new Error('令牌无效或已过期');
      if (r.status === 403 || r.status === 404) throw new Error(prov === 'gitee' ? '令牌没有 gists 权限' : '令牌没有 gist 权限');
      if (!r.ok) throw new Error(h.name + ' 返回 ' + r.status);
      return r.json();
    }
    async function readGist(id, token, prov) {
      const g = await gh('/gists/' + id, {}, token, prov);
      const f = g.files && g.files[FILE]; if (!f) return null;
      return f.truncated || f.content == null ? (await fetch(f.raw_url)).text() : f.content;
    }
    function merge(a, b) {
      const del = { ...(a.deleted || {}) };
      for (const [id, t] of Object.entries(b.deleted || {})) del[id] = Math.max(del[id] || 0, t);
      const out = { identities: [], accounts: [], deleted: del };
      for (const k of ['identities', 'accounts']) {
        const map = new Map();
        for (const x of [...a[k], ...b[k]]) { const cur = map.get(x.id); if (!cur || (x.updatedAt || 0) > (cur.updatedAt || 0)) map.set(x.id, x); }
        out[k] = [...map.values()].filter(x => !(del[x.id] >= (x.updatedAt || 0)));
      }
      for (const id of Object.keys(del)) if (out.identities.some(x => x.id === id) || out.accounts.some(x => x.id === id)) delete del[id];
      out.identities.sort((x, y) => (x.order ?? 1e9) - (y.order ?? 1e9));
      // drop links to identities that no longer exist
      const ids = new Set(out.identities.map(i => i.id));
      out.accounts.forEach(x => { x.identityIds = x.identityIds.filter(i => ids.has(i)); });
      // forget tombstones older than 90 days
      const old = Date.now() - 90 * DAY; for (const [id, t] of Object.entries(del)) if (t < old) delete del[id];
      return out;
    }
    const same = (a, b) => JSON.stringify([a.identities, a.accounts]) === JSON.stringify([b.identities, b.accounts]);

    async function run() {
      if (!conf || !key) return;
      if (busy) { again = true; return; }
      busy = true; status.state = 'syncing'; emit();
      try {
        const text = await readGist(conf.gistId);
        const remote = text ? await open(text) : { identities: [], accounts: [], deleted: {} };
        const merged = merge(state, remote);
        if (!same(merged, state) || JSON.stringify(merged.deleted) !== JSON.stringify(state.deleted || {})) {
          const before = JSON.stringify([state.identities, state.accounts]);
          state = merged; remember(); localStorage.setItem(KEY, JSON.stringify(state));
          if (before !== JSON.stringify([state.identities, state.accounts])) { ui.active = Math.min(ui.active, deck().length); render(); refreshSheet(); }
        }
        if (!text || !same(merged, remote) || JSON.stringify(merged.deleted) !== JSON.stringify(remote.deleted || {}))
          await gh('/gists/' + conf.gistId, { method: 'PATCH', body: JSON.stringify({ description: DESC, files: { [FILE]: { content: await seal(merged) } } }) });
        status.state = 'idle'; status.err = ''; status.at = conf.at = Date.now(); localStorage.setItem(CONF, JSON.stringify(conf));
      } catch (e) {
        status.state = 'error'; status.err = navigator.onLine === false ? '没有网络，联网后会自动同步' : (e.message || '同步失败');
      }
      busy = false; emit();
      if (again) { again = false; run(); }
    }

    return {
      get on() { return !!conf; }, status, listeners,
      async init() {
        if (!conf) return;
        try { key = await crypto.subtle.importKey('raw', unb64(conf.key), 'AES-GCM', true, ['encrypt', 'decrypt']); run(); }
        catch { status.state = 'error'; status.err = '本机的同步信息损坏，请重新开启'; emit(); }
        document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
        addEventListener('online', run);
      },
      schedule() { if (!conf || !key) return; clearTimeout(timer); timer = setTimeout(run, 1200); },
      now: run,
      get provider() { return conf?.provider || 'github'; },
      async enable(token, pass, prov = 'gitee') {
        token = token.trim();
        const gists = await gh('/gists?per_page=100', {}, token, prov);
        let g = gists.find(x => x.files && x.files[FILE]);
        let remote = null, salt;
        if (g) {
          const text = await readGist(g.id, token, prov); const box = JSON.parse(text);
          salt = box.salt;
          const k = await derive(pass, unb64(salt));
          try { remote = await open(text, k); } catch { throw new Error('同步密码不对（和第一次设置的不一样）'); }
          key = k;
        } else {
          salt = b64(crypto.getRandomValues(new Uint8Array(16)));
          key = await derive(pass, unb64(salt));
        }
        conf = { provider: prov, token, salt, key: b64(await crypto.subtle.exportKey('raw', key)), gistId: g ? g.id : null, at: 0 };
        if (remote && state.demo) { state = { identities: [], accounts: [], deleted: {} }; remember(); }
        if (!g) {
          const local = state.demo ? { identities: [], accounts: [], deleted: {} } : state;
          if (state.demo) { state = local; remember(); }
          const made = await gh('/gists', { method: 'POST', body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content: await seal(local) } } }) }, token, prov);
          conf.gistId = made.id;
        }
        delete state.demo;
        localStorage.setItem(CONF, JSON.stringify(conf));
        status.state = 'idle'; emit();
        document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
        await run(); render();
        return !!g;
      },
      disable() { conf = null; key = null; localStorage.removeItem(CONF); status.state = 'off'; emit(); },
    };
  })();

  const ago = t => { if (!t) return ''; const s = (Date.now() - t) / 1e3; return s < 60 ? '刚刚' : s < 3600 ? Math.floor(s / 60) + ' 分钟前' : s < 86400 ? Math.floor(s / 3600) + ' 小时前' : new Date(t).toLocaleDateString('zh-CN'); };
  function syncLine() {
    const st = Sync.status;
    if (!Sync.on) return '未开启';
    if (st.state === 'syncing') return '正在同步…';
    if (st.state === 'error') return st.err;
    return '已同步 · ' + ago(st.at);
  }
  function syncSheet() {
    const cloud = '<svg viewBox="0 0 24 24"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9a4 4 0 0 1-.5 9H7Z"/></svg>';
    if (Sync.on) {
      openSheet(`${closeX}<div class="sheet-body form">
        <div class="form-hero sync-hero" style="--pc:#0a84ff"><img src="icon.png?v=4" class="icon lg" alt=""><b>加密同步已开启</b><p class="sync-state ${Sync.status.state}" id="syncState">${esc(syncLine())}</p></div>
        <div class="group">
          <button class="cell" id="syncNow"><span class="cell-main"><span class="cell-title tint">立即同步</span></span></button>
        </div>
        <p class="hint">数据在这台设备上用你的同步密码加密，再存进你 ${Sync.provider === 'gitee' ? 'Gitee' : 'GitHub'} 账号里的一个私密代码片段。平台和任何人都只能看到乱码。在另一台设备上打开“同步”，选同一个平台，填同一个令牌和同步密码，就会自动合并。</p>
        <div class="group"><button class="cell" id="syncOff"><span class="cell-main"><span class="cell-title destructive-text">在这台设备上关闭同步</span></span></button></div>
        <p class="hint">关闭只影响这台设备，云端的加密数据和本机数据都会保留。</p>
      </div>`, { kind: 'sync' });
      setTimeout(() => {
        $('#syncNow').onclick = () => Sync.now();
        $('#syncOff').onclick = () => { Sync.disable(); closeSheet(); render(); toast('已在这台设备上关闭同步'); };
      }, 0);
      return;
    }
    openSheet(`${bar('取消', '加密同步', '开启', 'id="syncGo"')}<div class="sheet-body form">
      <div class="form-hero sync-hero" style="--pc:#0a84ff"><span class="icon lg sync-ic">${cloud}</span><b>在你的所有设备上同步</b><p class="sync-sub">端到端加密，只有你的同步密码能解开</p></div>
      <div class="sec-title">存放在哪里</div>
      <div class="seg prov-seg" id="provSeg"><button class="on" data-p="gitee">Gitee · 国内直连</button><button data-p="github">GitHub</button></div>
      <div class="sec-title" id="tokTitle">Gitee 私人令牌</div>
      <div class="group"><div class="field" id="tokField"><input id="sTok" type="password" placeholder="32 位私人令牌" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></div></div>
      <p class="hint" id="tokHint"></p>
      <div class="sec-title">同步密码</div>
      <div class="group"><div class="field" id="pwField"><input id="sPw" type="password" placeholder="至少 8 位，所有设备填同一个" autocomplete="new-password"></div></div>
      <p class="hint">同步密码不会上传，也没法找回。忘了它，云端数据就打不开了，本机数据不受影响。</p>
    </div>`, { kind: 'form' });
    const PROV = {
      gitee: { title: 'Gitee 私人令牌', ph: '32 位私人令牌', ok: t => /^[0-9a-f]{32}$/i.test(t),
        hint: '只需要勾选 gists 权限。<a href="https://gitee.com/profile/personal_access_tokens/new" target="_blank" rel="noopener">在 Gitee 创建一个</a>，国内网络不用代理也能同步。' },
      github: { title: 'GitHub 令牌', ph: 'ghp_… 或 github_pat_…', ok: t => /^(ghp_|github_pat_|gho_)\w{20,}/.test(t),
        hint: '只需要 gist 权限。<a href="https://github.com/settings/tokens/new?scopes=gist&description=%E8%B4%A6%E5%8F%B7%E6%98%9F%E5%9B%BE%E5%90%8C%E6%AD%A5" target="_blank" rel="noopener">在 GitHub 创建一个</a>，有效期选“无期限”最省心。国内网络可能需要代理。' },
    };
    let prov = 'gitee';
    const paintProv = () => {
      const P = PROV[prov];
      $$('#provSeg button').forEach(b => b.classList.toggle('on', b.dataset.p === prov));
      $('#tokTitle').textContent = P.title; $('#sTok').placeholder = P.ph; $('#tokHint').innerHTML = P.hint;
    };
    setTimeout(() => {
      paintProv();
      $$('#provSeg button').forEach(b => b.onclick = () => { prov = b.dataset.p; paintProv(); });
      $('#syncGo').onclick = async () => {
        const tok = $('#sTok').value, pw = $('#sPw').value;
        const shake = id => { const f = $(id); f.classList.remove('invalid'); void f.offsetWidth; f.classList.add('invalid'); };
        if (!PROV[prov].ok(tok.trim())) { shake('#tokField'); toast('令牌格式不对'); return; }
        if (pw.length < 8) { shake('#pwField'); toast('同步密码至少 8 位'); return; }
        const btn = $('#syncGo'); btn.disabled = true; btn.textContent = '连接中…';
        try { const found = await Sync.enable(tok, pw, prov); closeSheet(); toast(found ? '已连接，数据已合并' : '同步已开启'); }
        catch (e) { btn.disabled = false; btn.textContent = '开启'; toast(e.message || '连接失败'); }
      };
    }, 0);
  }
  Sync.listeners.add(() => {
    const el = $('#syncState'); if (el) { el.textContent = syncLine(); el.className = 'sync-state ' + Sync.status.state; }
    const m = $('#menu [data-act="sync"] small'); if (m) m.textContent = syncLine();
    const f = $('#footnote'); if (f) f.textContent = Sync.on ? '已开启端到端加密同步。不记录任何密码。' : '数据只保存在这台设备的浏览器里，不记录任何密码。想在多台设备上用，可以开启加密同步。';
  });

  // ---------- boot ----------
  if (state) remember();
  if (!state) {
    state = demo(); save();
    setTimeout(() => toast('这是示例数据', { label: '清空', fn: () => { state = { identities: [], accounts: [] }; save(); render(); } }), 1400);
  }
  if (!state.identities.some(i => i.type === ui.kind)) { const t = state.identities.find(i => KINDS.includes(i.type)); if (t) ui.kind = t.type; }

  paintTheme(); render(); Sync.init(); Sync.listeners.forEach(f => f());
  const first = cur();
  $('#glow').style.setProperty('--accent', first ? first.color : '#3a3a3c'); glowColor = first ? first.color : '#3a3a3c';
  // one orchestrated entrance: the cards deal in from the right
  const W = $('#wallet'); W.style.scrollSnapType = 'none';
  const deal = $$('#wallet .wcard').map((c, k) => c.animate([{ translate: '60px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 800, delay: 80 + k * 70, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }).finished);
  Promise.allSettled(deal).then(() => { W.style.scrollSnapType = ''; const c = $$('.wcard', W)[ui.active]; if (c && ui.tab === 'home') W.scrollLeft = cardX(W, c); if (geo) geo.ok = false; coverflow(); });
})();
