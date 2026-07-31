/**
 * 캐릭터 선택 화면에 쓰는 데이터입니다.
 *
 * weaponType은 이 캐릭터가 착용 가능한 무기 타입입니다(config/weapons.js의 WEAPONS 항목 type과
 * 정확히 같아야 함: 대검/직검/권총/권갑/증폭기). StatsPage가 이 값으로 무기 선택지를 그 타입만
 * 남도록 좁힙니다. 빈 문자열이면 아직 확인 전이라는 뜻이라 무기 카탈로그 전체를 허용합니다.
 */
export const ELEMENTS = ['응결', '용융', '전도', '기류', '회절', '인멸']

export const CHARACTERS = [
  // 기류
  { id: "jiyan", name: "기염", rarity: 5, element: "기류", weaponType: "대검", image: "/characters/jiyan.webp" },
  { id: "ciaccona", name: "샤콘", rarity: 5, element: "기류", weaponType: "권총", image: "/characters/ciaccona.webp" },
  { id: "cartethyia", name: "카르티시아", rarity: 5, element: "기류", weaponType: "직검", image: "/characters/cartethyia.webp" },
  { id: "rover_aero", name: "방랑자·기류", rarity: 5, element: "기류", weaponType: "직검", image: "/characters/rover.webp" },
  { id: "iuno", name: "유노", rarity: 5, element: "기류", weaponType: "권갑", image: "/characters/iuno.webp" },
  { id: "qiuyuan", name: "구원", rarity: 5, element: "기류", weaponType: "직검", image: "/characters/qiuyuan.webp" },
  { id: "sigrika", name: "시그리카", rarity: 5, element: "기류", weaponType: "권갑", image: "/characters/sigrika.webp" },
  // 기류

  // 용융
  { id: "encore", name: "앙코", rarity: 5, element: "용융", weaponType: "증폭기", image: "/characters/encore.webp" },
  { id: "changli", name: "장리", rarity: 5, element: "용융", weaponType: "직검", image: "/characters/changli.webp" },
  { id: "brant", name: "브렌트", rarity: 5, element: "용융", weaponType: "직검", image: "/characters/brant.webp" },
  { id: "lupa", name: "루파", rarity: 5, element: "용융", weaponType: "대검", image: "/characters/lupa.webp" },
  { id: "galbrena", name: "갈브레나", rarity: 5, element: "용융", weaponType: "권총", image: "/characters/galbrena.webp" },
  { id: "mornye", name: "모니에", rarity: 5, element: "용융", weaponType: "대검", image: "/characters/mornye.webp" },
  { id: "aemeath", name: "에이메스", rarity: 5, element: "용융", weaponType: "직검", image: "/characters/aemeath.webp", initials: "에이메스", color: "#f87171" },
  { id: "denia", name: "데니아", rarity: 5, element: "회절", weaponType: "증폭기", image: "/characters/denia.webp", initials: "데니", color: "#38bdf8" },
  // 용융

  // 응결
  { id: "zhezhi", name: "절지", rarity: 5, element: "응결", weaponType: "증폭기", image: "/characters/zhezhi.webp" },
  { id: "carlotta", name: "카를로타", rarity: 5, element: "응결", weaponType: "권총", image: "/characters/carlotta.webp" },
  { id: "lingyang", name: "능양", rarity: 5, element: "응결", weaponType: "권갑", image: "/characters/lingyang.webp" },
  { id: "hiyuki", name: "히유키", rarity: 5, element: "응결", weaponType: "직검", image: "/characters/hiyuki.webp" },
  { id: "lucilla", name: "루실라", rarity: 5, element: "응결", weaponType: "증폭기", image: "/characters/lucilla.webp" },
  { id: "suisui", name: "수수", rarity: 5, element: "응결", weaponType: "증폭기", image: "/characters/suisui.webp" },
  // 응결

  // 전도
  { id: "yinlin", name: "음림", rarity: 5, element: "전도", weaponType: "증폭기", image: "/characters/yinlin.webp" },
  { id: "calcharo", name: "카카루", rarity: 5, element: "전도", weaponType: "대검", image: "/characters/calcharo.webp" },
  { id: "xiangli_yao", name: "상리요", rarity: 5, element: "전도", weaponType: "권갑", image: "/characters/xiangli_yao.webp" },
  { id: "augusta", name: "아우구스타", rarity: 5, element: "전도", weaponType: "대검", image: "/characters/augusta.webp" },
  { id: "rebecca", name: "레베카", rarity: 5, element: "전도", weaponType: "권총", image: "/characters/rebecca.webp" },
  { id: "rover_electro", name: "방랑자·전도", rarity: 5, element: "전도", weaponType: "직검", image: "/characters/rover.webp" },
  // 전도

  // 인멸
  { id: "rover_havoc", name: "방랑자·인멸", rarity: 5, element: "인멸", weaponType: "직검", image: "/characters/rover.webp" },
  { id: "camellya", name: "카멜리아", rarity: 5, element: "인멸", weaponType: "직검", image: "/characters/camellya.webp" },
  { id: "roccia", name: "로코코", rarity: 5, element: "인멸", weaponType: "권갑", image: "/characters/roccia.webp" },
  { id: "cantarella", name: "칸타렐라", rarity: 5, element: "인멸", weaponType: "증폭기", image: "/characters/cantarella.webp" },
  { id: "phrolova", name: "플로로", rarity: 5, element: "인멸", weaponType: "증폭기", image: "/characters/phrolova.webp" },
  { id: "chisa", name: "치사", rarity: 5, element: "인멸", weaponType: "대검", image: "/characters/chisa.webp" },
  { id: "Yangyang_Xuanling", name: "양양·현령", rarity: 5, element: "회절", weaponType: "", image: "/characters/yangyang_xuanling.webp", initials: "양양", color: "#38bdf8" },
  // 인멸

  // 회절
  { id: "rover_spectro", name: "방랑자·회절", rarity: 5, element: "회절", weaponType: "직검", image: "/characters/rover.webp" },
  { id: "verina", name: "벨리나", rarity: 5, element: "회절", weaponType: "증폭기", image: "/characters/verina.webp" },
  { id: "jinhsi", name: "금희", rarity: 5, element: "회절", weaponType: "대검", image: "/characters/jinhsi.webp" },
  { id: "shorekeeper", name: "파수인", rarity: 5, element: "회절", weaponType: "증폭기", image: "/characters/shorekeeper.webp" },
  { id: "phoebe", name: "페비", rarity: 5, element: "회절", weaponType: "증폭기", image: "/characters/phoebe.webp" },
  { id: "zeni", name: "젠니", rarity: 5, element: "회절", weaponType: "권갑", image: "/characters/zeni.webp" },
  { id: "lynae", name: "린네", rarity: 5, element: "회절", weaponType: "권총", image: "/characters/lynae.webp" },
  { id: "luuk_herssen", name: "루크·헤르센", rarity: 5, element: "회절", weaponType: "권갑", image: "/characters/luuk_herssen.webp" },
  { id: "lucy", name: "루시", rarity: 5, element: "회절", weaponType: "권총", image: "/characters/lucy.webp" },
  // 회절
]
