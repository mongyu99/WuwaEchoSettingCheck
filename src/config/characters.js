import { catalog } from './catalog'

export const ELEMENTS = ['응결', '용융', '전도', '기류', '회절', '인멸']

// 속성 이름 글씨에 쓰는 색입니다(캐릭터 카드/스탯 페이지에서 어느 속성인지 한눈에 구분하도록).
export const ELEMENT_COLORS = {
  기류: '#44c4a3',
  응결: '#4fb4cf',
  전도: '#c154c7',
  용융: '#d45772',
  회절: '#b7a835',
  인멸: '#be4981',
}

// 캐릭터 목록은 DB(chara_info)에서 받아옵니다. weaponType이 빈 문자열이면 무기 카탈로그 전체를 허용합니다.
export const CHARACTERS = catalog.characters
