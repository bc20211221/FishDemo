/* ============ 策划案数据（源自 iWiki 4021195691） ============ */

// 品阶配色
const Q = {
  red:    {name:'红', cls:'q-red',    color:'#ff5d5d'},
  orange: {name:'橙', cls:'q-orange', color:'#ff9f43'},
  purple: {name:'紫', cls:'q-purple', color:'#a371f7'},
  blue:   {name:'蓝', cls:'q-blue',   color:'#3b9dff'},
  green:  {name:'绿', cls:'q-green',   color:'#3fb950'},
};

// 重量等级（7级）
const WEIGHTS = ['小金','C','B','A','S','SS','大金'];
// 变异（复用作物：颜色 / 材质 / 巨大化）
const MUTATIONS = ['','颜色变异','材质变异','巨大化变异'];

// 20 种水产
const FISH = [
  {id:1,  name:'好运锦鲤',   q:'red',    emo:'🎏', desc:'原型锦鲤。红金鳞片，尾鳍像飘带，钓起时有"好运上钩"表现'},
  {id:2,  name:'庄周梦鱼',   q:'orange', emo:'🦋', desc:'原型鲲。庄周梦境意象，鱼鳍像蝶翼，游动带梦境涟漪'},
  {id:3,  name:'司空震电鳗', q:'orange', emo:'⚡', desc:'原型电鳗。雷电纹路，咬钩时水面出现电光波纹'},
  {id:4,  name:'鲁班机关蟹', q:'purple', emo:'🦀', desc:'原型帝王蟹。机关木甲外壳，蟹腿机械感强'},
  {id:5,  name:'海月水母',   q:'purple', emo:'🎐', desc:'原型水母。海月幻境元素，透明伞盖中有镜面倒影'},
  {id:6,  name:'韩信枪尾虾', q:'purple', emo:'🦐', desc:'原型枪虾。虾尾像长枪，弹跳动作干脆利落'},
  {id:7,  name:'灯笼鱼',     q:'blue',   emo:'🏮', desc:'原型深海灯笼鱼。头灯变红灯笼，夜间池塘发红光'},
  {id:8,  name:'舞龙虾',     q:'blue',   emo:'🐉', desc:'原型龙虾。头部带龙头帽，钳子带绒球，身批龙鳞衣'},
  {id:9,  name:'酸菜鱼',     q:'blue',   emo:'🥬', desc:'原型草鱼。黄绿色酸菜配色，头顶一片酸菜叶'},
  {id:10, name:'松鼠桂鱼',   q:'blue',   emo:'🐿️', desc:'原型桂鱼。鱼鳍炸开像松鼠尾，造型夸张'},
  {id:11, name:'椒盐皮皮虾', q:'blue',   emo:'🦞', desc:'原型皮皮虾。外壳带盐晶颗粒'},
  {id:12, name:'小丑鱼',     q:'green',  emo:'🐠', desc:'就是这个动物原来的样子'},
  {id:13, name:'章鱼',       q:'green',  emo:'🐙', desc:'就是这个动物原来的样子'},
  {id:14, name:'河豚',       q:'green',  emo:'🐡', desc:'就是这个动物原来的样子'},
  {id:15, name:'石斑鱼',     q:'green',  emo:'🐟', desc:'就是这个动物原来的样子'},
  {id:16, name:'寄居蟹',     q:'green',  emo:'🦀', desc:'就是这个动物原来的样子'},
  {id:17, name:'鲈鱼',       q:'green',  emo:'🐟', desc:'就是这个动物原来的样子'},
  {id:18, name:'巴浪鱼',     q:'green',  emo:'🐟', desc:'就是这个动物原来的样子'},
  {id:19, name:'鲶鱼',       q:'green',  emo:'🐟', desc:'就是这个动物原来的样子'},
  {id:20, name:'泥鳅',       q:'green',  emo:'🐍', desc:'就是这个动物原来的样子'},
];

// 鱼池配置
const POOLS = {
  normal:{name:'普通池', cur:'farm', curName:'农场币', curIcon:'🪙', sProb:'10%',
          prices:[200,300,450], dailyMax:3, hero:'🐟', color:'#2f9e8f'},
  adv:   {name:'高级池', cur:'diamond', curName:'钻石', curIcon:'💎', sProb:'30%',
          prices:[30,50,80], dailyMax:3, hero:'✨', color:'#7d4ce0'},
};

// 招募列表（开启高级池的好友）
const RECRUITS = [
  {name:'阿白爱种菜', lv:38, emo:'🧑‍🌾', left:'8分20秒', fishers:4},
  {name:'橘猫钓鱼大师', lv:52, emo:'🐱', left:'5分02秒', fishers:6},
  {name:'峡谷农夫', lv:41, emo:'👨‍🌾', left:'9分11秒', fishers:2},
  {name:'锦鲤附体', lv:60, emo:'🎏', left:'2分45秒', fishers:7},
  {name:'稻香居士', lv:27, emo:'🌾', left:'6分30秒', fishers:3},
];

// 农场世界频道消息
const CHAT_MSGS = [
  {name:'橘猫钓鱼大师', g:'♂', lv:52, t:'我家高级池开了，快来钓！手慢无～', ava:'🐱'},
  {name:'阿白爱种菜',   g:'♀', lv:38, t:'菜熟的拉我！互相收一波呀', ava:'🧑‍🌾'},
  {name:'锦鲤附体',     g:'♂', lv:60, t:'刚钓到一条SS级好运锦鲤，红光满屏！', ava:'🎏'},
  {name:'稻香居士',     g:'♀', lv:27, t:'求种菜搭子，长期稳定在线那种', ava:'🌾'},
  {name:'峡谷农夫',     g:'♂', lv:41, t:'有高倍率的灵宝商人吗？', ava:'👨‍🌾'},
];

// 农场快捷语
const QUICK_WORDS = ['来钓鱼了!','菜熟的拉我!','有高倍率的灵宝商人吗？','我的菜成熟了!','互相祝福','快来看我的英雄变异','我有巨大化的作物','求种菜搭子'];

// 兑换商店奖励
const GIFTS = [
  {name:'小屋装修·锦鲤喷泉', ic:'⛲', cost:1200, lim:'限购 1'},
  {name:'稀有种子礼包',     ic:'🌱', cost:300,  lim:'每周限 5'},
  {name:'亲密度道具·心意卡', ic:'💝', cost:200,  lim:'每周限 10'},
  {name:'元流皮肤·锦鲤限定', ic:'👘', cost:5000, lim:'限购 1'},
  {name:'农场币 ×1000',      ic:'🪙', cost:500,  lim:'每日限 3'},
  {name:'高级鱼饵礼盒',     ic:'🎣', cost:800,  lim:'每周限 2'},
];

// 共钓 BUFF 规则
const COFISH_BUFF = {
  2:['双纶对弈：重量A级以上鱼概率 +30%'],
  3:['三影垂纶：A级以上 +30%','变异鱼 +20%'],
  5:['五朋钓海：A级以上 +30%','变异鱼 +20%','S品阶以上 +10%'],
};

// 宝箱品阶
const TREASURE = {
  blue:  {name:'蓝宝箱', color:'#3b9dff', min:50,  max:120},
  purple:{name:'紫宝箱', color:'#a371f7', min:120, max:300},
  gold:  {name:'金宝箱', color:'#ffd86b', min:300, max:888},
};
