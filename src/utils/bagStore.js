// 에코 가방 정리 결과를 브라우저 IndexedDB에 저장합니다. 에코가 수천 개라 localStorage(5MB, 통째로 다시 쓰기)보다
// 한 줄씩 추가할 수 있는 IndexedDB가 맞습니다. 새로고침하거나 탭이 닫혀도 이어서 할 수 있습니다.
const DB_NAME = 'wuwa-echo-bag'
const STORE = 'echoes'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        tx.oncomplete = () => {
          db.close()
          resolve(req?.result)
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error)
        }
      }),
  )
}

/** 저장된 에코 전체를 불러옵니다. */
export const loadBag = () => run('readonly', (store) => store.getAll()).then((rows) => rows ?? [])

/** 에코 하나를 저장합니다. 같은 키가 이미 있으면 덮어씁니다. */
export const saveBagItem = (item) => run('readwrite', (store) => store.put(item))

/** 에코 하나를 지웁니다. */
export const deleteBagItem = (key) => run('readwrite', (store) => store.delete(key))

/** 전부 지웁니다. */
export const clearBag = () => run('readwrite', (store) => store.clear())
