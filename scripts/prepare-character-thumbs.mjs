// public/characters/*.webp(610x840 원본)로 작은 얼굴 썸네일을 만들어 public/characters/thumb/ 에 저장합니다.
// 캐릭터 고르기 창·추천 목록처럼 얼굴을 작게(28~56px) 보여 주는 곳은 이 썸네일을 씁니다(한 장 ~130KB → 수 KB).
//
// 사용법: npm run prepare-character-thumbs
// 관리자 화면에서 새 캐릭터 이미지를 올린 뒤에도 한 번 돌려 주세요(없으면 화면이 원본으로 대신 보여 줍니다).
// 위쪽(얼굴)을 남기도록 위 기준으로 잘라 정사각형에 가깝게 만듭니다.

import { readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SRC_DIR = fileURLToPath(new URL('../public/characters/', import.meta.url))
const OUT_DIR = join(SRC_DIR, 'thumb')
const SIZE = 128 // 56px 칸을 2배 화면(레티나)까지 선명하게

sharp.cache(false)

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith('.webp'))
  let total = 0
  for (const file of files) {
    const out = await sharp(join(SRC_DIR, file))
      .resize(SIZE, SIZE, { fit: 'cover', position: 'top' })
      .webp({ quality: 75 })
      .toFile(join(OUT_DIR, file))
    total += out.size ?? 0
  }
  console.log(`썸네일 ${files.length}장 저장 (총 ${(total / 1024).toFixed(0)}KB) → ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
