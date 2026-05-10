import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const sqlite = new SQLiteConnection(CapacitorSQLite)
let dbInstance: any = null

function getPlatform(): 'web' | 'native' {
  const platform = (window as any).Capacitor?.getPlatform?.() || 'web'
  return platform === 'web' ? 'web' : 'native'
}

// ---------- 预置演示数据 ----------

// 演示视频 1：乾隆盛世
const DEMO_1_ID = 'demo-qianlong-shengshi'
const DEMO_1_TITLE = '乾隆盛世'
const DEMO_1_URL = './videos/demo_video.mp4'

const DEMO_1_ANALYSIS = JSON.stringify({
  characters: [
    { name: '乾隆皇帝', description: '清朝第六位皇帝，在位期间文治武功达到顶峰，晚年好大喜功，六下江南' },
    { name: '和珅', description: '乾隆朝权臣，官至文华殿大学士，历史上著名的大贪官，精通满汉蒙藏四种语言' },
    { name: '纪晓岚', description: '著名学者、文学家，《四库全书》总纂官，以机敏善辩闻名' },
    { name: '刘墉', description: '乾隆朝重臣，官至体仁阁大学士，以清廉刚正和书法造诣著称' },
  ],
  plotSummary: '本片以乾隆在位中后期为背景，展现了康乾盛世的最后辉煌与隐忧。乾隆晚年六次南巡，耗费巨大国力；和珅权倾朝野，贪腐成风；而西方工业革命正在兴起，大清帝国的闭关锁国政策埋下了近代衰落的种子。影片通过宫廷政治、文化繁荣与社会矛盾三条线索，呈现了一个盛世表象下的复杂时代。',
  timeline: [
    { time: '00:01:30', event: '乾隆在乾清宫接受万国来朝，彰显天朝上国威仪' },
    { time: '00:03:45', event: '和珅向乾隆进献《四库全书》样书，得到皇帝嘉许' },
    { time: '00:06:20', event: '纪晓岚在翰林院与和珅发生激烈辩论，揭露官场积弊' },
    { time: '00:09:10', event: '乾隆第六次南巡，江南百姓夹道欢迎，国库却日益空虚' },
    { time: '00:12:00', event: '英国马戛尔尼使团访华，请求通商被拒，中西文明擦肩而过' },
  ],
  relationships: [
    { from: '乾隆皇帝', to: '和珅', relation: '宠信与依附' },
    { from: '乾隆皇帝', to: '纪晓岚', relation: '赏识与直言' },
    { from: '和珅', to: '纪晓岚', relation: '政敌与智斗' },
    { from: '刘墉', to: '和珅', relation: '清廉与贪腐的对立' },
  ],
  storyline: [
    {
      phase: '第一幕：盛世开篇',
      summary: '影片以乾隆四十五年万寿庆典开篇，万国来朝的壮观场面展现了帝国的巅峰荣光。紫禁城内的庆典、各地进贡的奇珍异宝，以及乾隆接见外国使节的场景，营造出一片繁荣昌盛的氛围。',
      highlights: ['乾清宫万国朝贺', '《四库全书》编纂启动', '乾隆皇帝赐宴群臣'],
      mood: '庄严辉煌',
    },
    {
      phase: '第二幕：暗流涌动',
      summary: '盛世表象之下，和珅开始大肆敛财，买官卖官、贪污纳贿已成常态。纪晓岚试图通过编纂《四库全书》保存文化火种，却在文字狱的阴影下如履薄冰。刘墉屡屡上奏弹劾和珅，却都被皇帝轻轻放过。',
      highlights: ['和珅贪腐网络成型', '文字狱迫害文人', '刘墉弹劾被驳回'],
      mood: '紧张压抑',
    },
    {
      phase: '第三幕：南巡挥霍',
      summary: '乾隆第六次南巡成为影片高潮之一。表面上江南风光无限、百姓安居乐业，实际上沿途地方官员强征民夫、拆房铺路，国库为此耗费白银两千余万两。南巡的奢华与民间的疾苦形成强烈对比。',
      highlights: ['江南风光与百姓疾苦', '地方官强征民夫', '国库空虚的隐患'],
      mood: '奢靡悲凉',
    },
    {
      phase: '第四幕：文明碰撞',
      summary: '英国马戛尔尼使团携先进工业礼物访华，请求平等通商。乾隆以天朝上国自居，拒绝一切条件，错失了与世界接轨的最后机会。这一历史转折点的描绘，为盛世的落幕埋下了伏笔。',
      highlights: ['马戛尔尼献工业革命成果', '乾隆拒绝通商请求', '中西文明擦肩而过'],
      mood: '惋惜沉重',
    },
    {
      phase: '第五幕：余晖落幕',
      summary: '影片尾声，年迈的乾隆传位嘉庆，和珅被抄家赐死，查抄家产折合白银八亿两。盛世余晖散去，帝国的根基已在不知不觉中动摇。最后一个镜头定格在紫禁城的黄昏，暗示着一个时代的终结。',
      highlights: ['乾隆禅位嘉庆', '和珅被赐死抄家', '紫禁城黄昏余晖'],
      mood: '苍伤感怀',
    },
  ],
  theme: {
    primary: '#8B1A1A',
    secondary: '#2C1810',
    accent: '#C9A84C',
    surface: '#1E1210',
    text: '#F5E6D3',
    textMuted: '#A08B7A',
    bubbleUser: '#8B1A1A',
    bubbleAi: '#3D2820',
    tagBg: '#3D2820',
    tagText: '#C9A84C',
    mood: '宫廷典雅',
  },
})

// 演示视频 2：陈涉世家
const DEMO_2_ID = 'demo-chen-she-shi-jia'
const DEMO_2_TITLE = '陈涉世家'
const DEMO_2_URL = './videos/chen_she_shi_jia.mp4'

const DEMO_2_ANALYSIS = JSON.stringify({
  characters: [
    { name: '陈胜', description: '雇农出身，胸怀大志，发动大泽乡起义，建立张楚政权，喊出"王侯将相宁有种乎"的千古名言' },
    { name: '吴广', description: '陈胜挚友，一同被征发戍边，大泽乡起义的核心领袖之一，后被部将所杀' },
    { name: '秦二世胡亥', description: '秦始皇幼子，靠赵高篡改遗诏即位，残暴昏庸，横征暴敛，加速秦朝灭亡' },
    { name: '扶苏', description: '秦始皇长子，仁厚贤能，因劝谏始皇被派往上郡监蒙恬军，后被逼自杀' },
  ],
  plotSummary: '本片以《史记·陈涉世家》为蓝本，再现秦末农民大起义的历史画卷。陈胜、吴广在大泽乡揭竿而起，喊出"王侯将相宁有种乎"的千古名言，点燃了推翻秦朝暴政的燎原之火。影片从陈胜少时佣耕立下鸿鹄之志，到大泽乡遇雨起义，再到建立张楚政权、最终兵败身亡，完整呈现了中国历史上第一次大规模农民起义的全过程。',
  timeline: [
    { time: '00:01:00', event: '陈胜少时佣耕，对同伴说"燕雀安知鸿鹄之志哉"' },
    { time: '00:03:30', event: '大泽乡遇大雨，戍卒无法按期抵达渔阳，按秦律当斩' },
    { time: '00:05:45', event: '陈胜吴广篝火狐鸣、鱼腹藏书，发动大泽乡起义' },
    { time: '00:08:20', event: '起义军攻占陈县，建立张楚政权，陈胜称王' },
    { time: '00:11:00', event: '秦将章邯率骊山刑徒反扑，起义军节节败退' },
    { time: '00:13:30', event: '陈胜被车夫庄贾杀害，起义最终失败，但星火已燎原' },
  ],
  relationships: [
    { from: '陈胜', to: '吴广', relation: '生死与共的战友' },
    { from: '陈胜', to: '秦二世胡亥', relation: '反抗与暴政的对立' },
    { from: '陈胜', to: '扶苏', relation: '借其名号召天下' },
    { from: '吴广', to: '陈胜', relation: '忠心辅佐' },
  ],
  storyline: [
    {
      phase: '第一幕：鸿鹄之志',
      summary: '影片开篇展现陈胜少年时代佣耕于田垄之间的场景。面对同伴的嘲笑，他发出"燕雀安知鸿鹄之志哉"的感慨。这一段落通过质朴的农家生活和陈胜不甘平庸的眼神，奠定了全片的史诗基调。',
      highlights: ['田间佣耕劳作', '"燕雀安知鸿鹄之志"', '同伴嘲笑与不屑'],
      mood: '隐忍蓄力',
    },
    {
      phase: '第二幕：大泽惊雷',
      summary: '秦二世元年七月，陈胜吴广等九百戍卒被征发渔阳，途中在大泽乡遇大雨阻断道路。按照严苛的秦法，误期当斩。在生死存亡之际，陈胜吴广决定揭竿而起，用篝火狐鸣和鱼腹丹书制造舆论，点燃了反秦的烽火。',
      highlights: ['大泽乡暴雨阻路', '篝火狐鸣造舆论', '揭竿而起反暴秦'],
      mood: '激昂悲壮',
    },
    {
      phase: '第三幕：燎原之火',
      summary: '大泽乡起义如星星之火迅速燎原。陈胜率义军势如破竹，攻占蕲县、铚县、酂县、苦县、柘县、谯县等地，所至之处百姓纷纷响应。起义军斩木为兵、揭竿为旗，浩浩荡荡向陈县进发，反秦浪潮席卷关东大地。',
      highlights: ['斩木为兵揭竿为旗', '百姓纷纷响应', '义军势如破竹'],
      mood: '热血沸腾',
    },
    {
      phase: '第四幕：张楚立国',
      summary: '起义军攻占陈县后，当地父老豪杰劝陈胜称王。陈胜立国号为"张楚"，意为"张大楚国"。这是中国历史上第一个由农民建立的政权。影片通过盛大的立国大典和六国旧贵族纷纷来投的场面，展现了起义事业的巅峰时刻。',
      highlights: ['陈县父老劝进', '张楚政权建立', '六国旧贵族来投'],
      mood: '辉煌壮阔',
    },
    {
      phase: '第五幕：英雄末路',
      summary: '秦将章邯率骊山刑徒和奴产子组成的军队反扑，起义军内部矛盾也逐渐暴露。吴广被部将田臧杀害，陈胜在撤退途中被自己的车夫庄贾刺杀。起义虽然失败，但"天下苦秦久矣"的怒火已被点燃，项羽、刘邦随即接过了反秦的大旗。',
      highlights: ['章邯率刑徒反扑', '吴广被害', '陈胜遇刺星火不灭'],
      mood: '悲壮苍劲',
    },
  ],
  theme: {
    primary: '#8B2500',
    secondary: '#1A0F0A',
    accent: '#C4953A',
    surface: '#1E1510',
    text: '#F0E6D8',
    textMuted: '#9A8B7A',
    bubbleUser: '#8B2500',
    bubbleAi: '#2D2018',
    tagBg: '#2D2018',
    tagText: '#C4953A',
    mood: '史诗悲壮',
  },
})

async function seedSingleVideo(
  db: any,
  id: string,
  title: string,
  url: string,
  analysis: string
) {
  try {
    const res = await db.query('SELECT id FROM videos WHERE id = ?', [id])
    if (res.values && res.values.length > 0) {
      console.log(`[DB] Demo video "${title}" already exists, skip seeding`)
      return
    }

    await db.run(
      'INSERT INTO videos (id, title, url, status, analysis_json) VALUES (?, ?, ?, ?, ?)',
      [id, title, url, 'completed', analysis]
    )
    console.log(`[DB] Demo video "${title}" seeded successfully`)
  } catch (err) {
    console.error(`[DB] Seed demo video "${title}" failed:`, err)
  }
}

async function seedDemoVideos(db: any) {
  await seedSingleVideo(db, DEMO_1_ID, DEMO_1_TITLE, DEMO_1_URL, DEMO_1_ANALYSIS)
  await seedSingleVideo(db, DEMO_2_ID, DEMO_2_TITLE, DEMO_2_URL, DEMO_2_ANALYSIS)
}
// ----------------------------------

export async function initDB() {
  if (dbInstance) return dbInstance

  const platform = getPlatform()
  console.log(`[DB] Platform: ${platform}`)

  try {
    if (platform === 'web') {
      const jeep = document.querySelector('jeep-sqlite')
      if (!jeep) {
        console.warn('[DB] jeep-sqlite not found in DOM')
        throw new Error('jeep-sqlite element not found')
      }
      await customElements.whenDefined('jeep-sqlite')
      await new Promise(resolve => setTimeout(resolve, 100))
      await sqlite.initWebStore()
    }

    const db = await sqlite.createConnection('reelmind', false, 'no-encryption', 1, false)
    await db.open()

    await db.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT,
        url TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        analysis_json TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );
    `)

    // 自动插入预置演示视频
    await seedDemoVideos(db)

    dbInstance = db
    console.log('[DB] SQLite initialized successfully')
    return db

  } catch (err) {
    console.error('[DB] SQLite init failed:', err)
    throw err
  }
}

export async function getDB() {
  if (!dbInstance) {
    await initDB()
  }
  return dbInstance
}
