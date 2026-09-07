const preloadedUrls = new Set()

/**
 * Tối ưu hóa URL ảnh từ các CDN phổ biến (Google Usercontent, Cloudinary, v.v.)
 * để nén dung lượng và tải tức thì ở kích thước phù hợp thumbnail.
 */
export function getOptimizedImageUrl(url, size = 160) {
  if (!url || typeof url !== 'string') return url

  // Google Usercontent / Google Drive
  if (url.includes('googleusercontent.com')) {
    if (/=s\d+/i.test(url)) {
      return url.replace(/=s\d+.*$/i, `=s${size}-c`)
    }
    return `${url}=s${size}-c`
  }

  // Cloudinary
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('w_') && !url.includes('c_')) {
      return url.replace('/upload/', `/upload/c_fill,w_${size},h_${size},q_auto,f_auto/`)
    }
  }

  return url
}

/**
 * Nạp trước danh sách ảnh vào bộ nhớ RAM (Memory Cache) của trình duyệt.
 * Giúp thẻ <img> vẽ tức thì 0ms ngay khi component mount.
 */
export function preloadImages(urls = [], size = 160) {
  if (typeof window === 'undefined') return

  const list = Array.isArray(urls) ? urls : [urls]
  list.filter(Boolean).forEach((rawUrl) => {
    const optimized = getOptimizedImageUrl(rawUrl, size)
    if (!optimized || preloadedUrls.has(optimized)) return

    preloadedUrls.add(optimized)
    const img = new window.Image()
    img.decoding = 'async'
    img.src = optimized
  })
}
