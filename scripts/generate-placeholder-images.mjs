// 카탈로그(에코 세트/메인 에코/무기)에는 있지만 public/ 밑에 아이콘 파일이 아직 없는 id에 대해,
// 투명한 1x1 자리표시자 이미지를 만들어줍니다. 실제 이미지가 생기면 같은 파일명으로 덮어쓰면 됩니다.
//
// 사용법: node scripts/generate-placeholder-images.mjs [echo-sets|main-echoes|weapons ...]
//   인자 없이 실행하면 세 카탈로그 전부 처리합니다.

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import sharp from 'sharp'
import { ECHO_SETS } from '../src/config/echoSets.js'
import { MAIN_ECHOES } from '../src/config/mainEchoes.js'
import { WEAPONS } from '../src/config/weapons.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

// ext는 각 카탈로그의 defineXxx가 실제로 아이콘 경로에 쓰는 확장자와 반드시 같아야 합니다
// (echoSets.js/mainEchoes.js/weapons.js 전부 .webp로 바꿔둔 상태).
const CATALOGS = {
  'echo-sets': { ids: Object.keys(ECHO_SETS), dir: join(ROOT, 'public/echo-sets'), ext: 'webp' },
  'main-echoes': { ids: Object.keys(MAIN_ECHOES), dir: join(ROOT, 'public/main-echoes'), ext: 'webp' },
  weapons: { ids: Object.keys(WEAPONS), dir: join(ROOT, 'public/weapons'), ext: 'webp' },
}

const blankBufferCache = {}
async function blankBuffer(ext) {
  if (!blankBufferCache[ext]) {
    const img = sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    blankBufferCache[ext] = await (ext === 'webp' ? img.webp() : img.png()).toBuffer()
  }
  return blankBufferCache[ext]
}

async function fillCatalog(name) {
  const catalog = CATALOGS[name]
  if (!catalog) {
    console.log(`알 수 없는 카탈로그: ${name} (echo-sets | main-echoes | weapons)`)
    return
  }
  await mkdir(catalog.dir, { recursive: true })
  const blank = await blankBuffer(catalog.ext)

  let created = 0
  for (const id of catalog.ids) {
    const filePath = join(catalog.dir, `${id}.${catalog.ext}`)
    if (existsSync(filePath)) continue
    await writeFile(filePath, blank)
    created++
  }
  console.log(`${name}: ${created}개 자리표시자 생성 (총 ${catalog.ids.length}개 중)`)
}

const targets = process.argv.slice(2)
const names = targets.length > 0 ? targets : Object.keys(CATALOGS)
for (const name of names) {
  await fillCatalog(name)
}
