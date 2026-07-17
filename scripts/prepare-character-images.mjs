// raw-characters/ 폴더의 원본 캐릭터 사진들을 모두 고정 크기(610x840)로
// 리사이즈해서 public/characters/ 에 PNG로 저장합니다.
//
// 사용법:
//   1. npm install --save-dev sharp   (최초 1회)
//   2. raw-characters/ 폴더에 원본 이미지를 넣기 (파일명이 곧 캐릭터 id가 됩니다)
//   3. npm run prepare-characters
//   4. src/config/characters.js 에 새 항목 추가
//      { id: '파일이름', name: '표시할 이름', image: '/characters/파일이름.png', ... }
//
// 크기는 610x840으로 고정되어 있습니다(public/characters/에 들어가는 모든 사진이 항상 이
// 크기여야 하므로, 이미지 개수와 무관하게 매번 동일한 결과가 나옵니다). 크기를 바꾸고
// 싶으면 아래 TARGET_WIDTH/TARGET_HEIGHT 값만 수정하면 됩니다.

import { readdir, mkdir } from 'node:fs/promises'
import { extname, basename, join } from 'node:path'
import sharp from 'sharp'

const SRC_DIR = new URL('../raw-characters/', import.meta.url).pathname
const OUT_DIR = new URL('../public/characters/', import.meta.url).pathname
const VALID_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const TARGET_WIDTH = 610
const TARGET_HEIGHT = 840

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const files = (await readdir(SRC_DIR)).filter((f) => VALID_EXT.has(extname(f).toLowerCase()))
  if (files.length === 0) {
    console.log('raw-characters/ 에 이미지가 없습니다. 원본 사진을 먼저 넣어주세요.')
    return
  }

  console.log(`${files.length}장을 ${TARGET_WIDTH}x${TARGET_HEIGHT}로 리사이즈합니다.`)

  await Promise.all(
    files.map(async (file) => {
      const id = basename(file, extname(file))
      const outPath = join(OUT_DIR, `${id}.png`)
      await sharp(join(SRC_DIR, file))
        .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover', position: 'attention' })
        .png()
        .toFile(outPath)
      console.log(`저장됨: ${outPath}`)
    }),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
