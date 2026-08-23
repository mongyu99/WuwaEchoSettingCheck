// raw-banners/ 폴더의 원본 배너 이미지를 WebP로 변환해서 public/banners/ 에 저장합니다.
// 캐릭터/무기 아이콘과 달리 정사각형으로 자르지 않고 원본 비율을 그대로 유지하되, 폭이
// TARGET_MAX_WIDTH보다 크면 줄여서 파일 용량(원본 PNG는 수 MB대)을 크게 낮춥니다.
//
// 사용법:
//   1. npm install --save-dev sharp   (최초 1회, 이미 설치돼 있으면 생략)
//   2. raw-banners/ 폴더에 원본 배너 이미지 넣기 (파일명이 곧 버전 id — config/versionBanner.js의 image 경로)
//   3. npm run prepare-banners

import { readdir, mkdir } from 'node:fs/promises'
import { extname, basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SRC_DIR = fileURLToPath(new URL('../raw-banners/', import.meta.url))
const OUT_DIR = fileURLToPath(new URL('../public/banners/', import.meta.url))
const VALID_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const TARGET_MAX_WIDTH = 1600

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const files = (await readdir(SRC_DIR)).filter((f) => VALID_EXT.has(extname(f).toLowerCase()))
  if (files.length === 0) {
    console.log('raw-banners/ 에 이미지가 없습니다. 원본 배너를 먼저 넣어주세요.')
    return
  }

  console.log(`${files.length}장을 최대 폭 ${TARGET_MAX_WIDTH}px WebP로 변환합니다.`)

  await Promise.all(
    files.map(async (file) => {
      const id = basename(file, extname(file))
      const outPath = join(OUT_DIR, `${id}.webp`)
      await sharp(join(SRC_DIR, file))
        .resize({ width: TARGET_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outPath)
      console.log(`저장됨: ${outPath}`)
    }),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
