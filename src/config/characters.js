/**
 * 캐릭터 선택 화면에 쓰는 데이터입니다.
 *
 * image가 null인 캐릭터는 사진이 아직 없어서 이니셜 아바타로 대체 표시됩니다. 나중에 사진을
 * 추가하려면 raw-characters/ 에 원본을 넣고 `npm run prepare-characters` 실행 후, 여기 해당
 * 캐릭터의 image 값을 '/characters/파일이름.png' 로 채우면 됩니다.
 *
 * element(속성)는 현재 전부 '회절'로 임시 지정되어 있습니다 — 실제 속성을 알려주시면 정확히
 * 맞춰드릴게요. rarity는 4 또는 5(성급)입니다.
 */
export const ELEMENTS = ['응결', '용융', '전도', '기류', '회절', '인멸']

export const CHARACTERS = [
  { id: "산화", name: "산화", rarity: 4, element: "회절", image: null, initials: "산화", color: "#6ee7f9" },
  { id: "설지", name: "설지", rarity: 4, element: "회절", image: null, initials: "설지", color: "#a78bfa" },
  { id: "유호", name: "유호", rarity: 4, element: "회절", image: null, initials: "유호", color: "#fb923c" },
  { id: "치샤", name: "치샤", rarity: 4, element: "회절", image: null, initials: "치샤", color: "#34d399" },
  { id: "모르테피", name: "모르테피", rarity: 4, element: "회절", image: null, initials: "모르", color: "#f87171" },
  { id: "연무", name: "연무", rarity: 4, element: "회절", image: null, initials: "연무", color: "#38bdf8" },
  { id: "루미", name: "루미", rarity: 4, element: "회절", image: null, initials: "루미", color: "#fbbf24" },
  { id: "복링", name: "복링", rarity: 4, element: "회절", image: null, initials: "복링", color: "#c084fc" },
  { id: "양양", name: "양양", rarity: 4, element: "회절", image: null, initials: "양양", color: "#4ade80" },
  { id: "알토", name: "알토", rarity: 4, element: "회절", image: null, initials: "알토", color: "#f472b6" },
  { id: "도기", name: "도기", rarity: 4, element: "회절", image: null, initials: "도기", color: "#6ee7f9" },
  { id: "단근", name: "단근", rarity: 4, element: "회절", image: null, initials: "단근", color: "#a78bfa" },
  { id: "능양", name: "능양", rarity: 5, element: "회절", image: null, initials: "능양", color: "#fb923c" },
  { id: "절지", name: "절지", rarity: 5, element: "회절", image: null, initials: "절지", color: "#34d399" },
  { id: "카를로타", name: "카를로타", rarity: 5, element: "회절", image: null, initials: "카를", color: "#f87171" },
  { id: "루실라", name: "루실라", rarity: 5, element: "회절", image: null, initials: "루실", color: "#38bdf8" },
  { id: "히유키", name: "히유키", rarity: 5, element: "회절", image: null, initials: "히유", color: "#fbbf24" },
  { id: "수수", name: "수수", rarity: 5, element: "회절", image: null, initials: "수수", color: "#c084fc" },
  { id: "앙코", name: "앙코", rarity: 5, element: "회절", image: null, initials: "앙코", color: "#4ade80" },
  { id: "장리", name: "장리", rarity: 5, element: "회절", image: null, initials: "장리", color: "#f472b6" },
  { id: "브렌트", name: "브렌트", rarity: 5, element: "회절", image: null, initials: "브렌", color: "#6ee7f9" },
  { id: "루파", name: "루파", rarity: 5, element: "회절", image: null, initials: "루파", color: "#a78bfa" },
  { id: "갈브레나", name: "갈브레나", rarity: 5, element: "회절", image: null, initials: "갈브", color: "#fb923c" },
  { id: "모니에", name: "모니에", rarity: 5, element: "회절", image: null, initials: "모니", color: "#34d399" },
  { id: "에이메스", name: "에이메스", rarity: 5, element: "용융", weaponType: "직검", image: "/characters/에이메스.png", initials: "에이", color: "#f87171" },
  { id: "deni", name: "데니아", rarity: 5, element: "회절", image: "/characters/deni.png", initials: "데니", color: "#38bdf8" },
  { id: "카카루", name: "카카루", rarity: 5, element: "회절", image: null, initials: "카카", color: "#fbbf24" },
  { id: "음림", name: "음림", rarity: 5, element: "회절", image: null, initials: "음림", color: "#c084fc" },
  { id: "상리요", name: "상리요", rarity: 5, element: "회절", image: null, initials: "상리", color: "#4ade80" },
  { id: "아우구스타", name: "아우구스타", rarity: 5, element: "회절", image: null, initials: "아우", color: "#f472b6" },
  { id: "레베카", name: "레베카", rarity: 5, element: "회절", image: null, initials: "레베", color: "#6ee7f9" },
  { id: "방랑자·전도", name: "방랑자·전도", rarity: 5, element: "회절", image: null, initials: "방랑", color: "#a78bfa" },
  { id: "기염", name: "기염", rarity: 5, element: "회절", image: null, initials: "기염", color: "#fb923c" },
  { id: "감심", name: "감심", rarity: 5, element: "회절", image: null, initials: "감심", color: "#34d399" },
  { id: "샤콘", name: "샤콘", rarity: 5, element: "회절", image: null, initials: "샤콘", color: "#f87171" },
  { id: "방랑자·기류", name: "방랑자·기류", rarity: 5, element: "회절", image: null, initials: "방랑", color: "#38bdf8" },
  { id: "카르티시아", name: "카르티시아", rarity: 5, element: "회절", image: null, initials: "카르", color: "#fbbf24" },
  { id: "유노", name: "유노", rarity: 5, element: "회절", image: null, initials: "유노", color: "#c084fc" },
  { id: "구원", name: "구원", rarity: 5, element: "회절", image: null, initials: "구원", color: "#4ade80" },
  { id: "시그리카", name: "시그리카", rarity: 5, element: "회절", image: null, initials: "시그", color: "#f472b6" },
  { id: "벨리나", name: "벨리나", rarity: 5, element: "회절", image: null, initials: "벨리", color: "#6ee7f9" },
  { id: "방랑자·회절", name: "방랑자·회절", rarity: 5, element: "회절", image: null, initials: "방랑", color: "#a78bfa" },
  { id: "금희", name: "금희", rarity: 5, element: "회절", image: null, initials: "금희", color: "#fb923c" },
  { id: "파수인", name: "파수인", rarity: 5, element: "회절", image: null, initials: "파수", color: "#34d399" },
  { id: "페비", name: "페비", rarity: 5, element: "회절", image: null, initials: "페비", color: "#f87171" },
  { id: "젠니", name: "젠니", rarity: 5, element: "회절", image: null, initials: "젠니", color: "#38bdf8" },
  { id: "린네", name: "린네", rarity: 5, element: "회절", image: null, initials: "린네", color: "#fbbf24" },
  { id: "루크·헤르센", name: "루크·헤르센", rarity: 5, element: "회절", image: null, initials: "루크", color: "#c084fc" },
  { id: "루시", name: "루시", rarity: 5, element: "회절", image: null, initials: "루시", color: "#4ade80" },
  { id: "카멜리아", name: "카멜리아", rarity: 5, element: "회절", image: null, initials: "카멜", color: "#f472b6" },
  { id: "방랑자·인멸", name: "방랑자·인멸", rarity: 5, element: "회절", image: null, initials: "방랑", color: "#6ee7f9" },
  { id: "로코코", name: "로코코", rarity: 5, element: "회절", image: null, initials: "로코", color: "#a78bfa" },
  { id: "칸타렐라", name: "칸타렐라", rarity: 5, element: "회절", image: null, initials: "칸타", color: "#fb923c" },
  { id: "플로로", name: "플로로", rarity: 5, element: "회절", image: null, initials: "플로", color: "#34d399" },
  { id: "치사", name: "치사", rarity: 5, element: "회절", image: null, initials: "치사", color: "#f87171" },
  { id: "yangyang", name: "양양·현령", rarity: 5, element: "회절", image: "/characters/yangyang.png", initials: "양양", color: "#38bdf8" },
]
