/**
 * 캐릭터 얼굴 썸네일 <img>의 onError: 썸네일 파일이 아직 없으면(관리자에서 새로 올린 캐릭터 등) 원본 이미지로 한 번만 바꿉니다.
 * 사용: <img src={c.thumb ?? c.image} onError={thumbFallback(c)} />
 */
export const thumbFallback = (character) => (e) => {
  const img = e.currentTarget
  if (character?.image && img.dataset.fallback !== '1') {
    img.dataset.fallback = '1'
    img.src = character.image
  }
}
