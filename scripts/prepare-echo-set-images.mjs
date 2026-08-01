// raw-echo-sets/ 폴더의 원본 에코 세트 아이콘들을 모두 정사각형(256x256)으로 리사이즈해서
// public/echo-sets/ 에 WebP로 저장합니다(scripts/prepare-weapon-images.mjs와 동일한 방식).
//
// 사용법:
//   1. npm install --save-dev sharp   (최초 1회, 이미 설치돼 있으면 생략)
//   2. raw-echo-sets/ 폴더에 원본 아이콘 넣기 (파일명이 곧 세트 id — config/echoSets.js의 ECHO_SETS 키)
//   3. npm run prepare-echo-sets
//
// 크기를 바꾸고 싶으면 아래 TARGET_SIZE 값만 수정하면 됩니다.

import { readdir, mkdir } from 'node:fs/promises'
import { extname, basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SRC_DIR = fileURLToPath(new URL('../raw-echo-sets/', import.meta.url))
const OUT_DIR = fileURLToPath(new URL('../public/echo-sets/', import.meta.url))
const VALID_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const TARGET_SIZE = 256

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const files = (await readdir(SRC_DIR)).filter((f) => VALID_EXT.has(extname(f).toLowerCase()))
  if (files.length === 0) {
    console.log('raw-echo-sets/ 에 이미지가 없습니다. 원본 아이콘을 먼저 넣어주세요.')
    return
  }

  console.log(`${files.length}장을 ${TARGET_SIZE}x${TARGET_SIZE}로 리사이즈합니다.`)

  await Promise.all(
    files.map(async (file) => {
      const id = basename(file, extname(file))
      const outPath = join(OUT_DIR, `${id}.webp`)
      await sharp(join(SRC_DIR, file))
        .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover', position: 'attention' })
        .webp({ quality: 82 })
        .toFile(outPath)
      console.log(`저장됨: ${outPath}`)
    }),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
