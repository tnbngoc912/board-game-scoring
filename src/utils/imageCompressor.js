/**
 * Nén ảnh bằng Canvas API và chuyển sang định dạng WebP.
 * @param {File} file - File ảnh gốc.
 * @param {Object} options - Tùy chọn nén.
 * @param {number} options.maxSize - Kích thước cạnh lớn nhất (mặc định 1600).
 * @param {number} options.quality - Chất lượng nén từ 0 đến 1 (mặc định 0.8).
 * @returns {Promise<File>} File ảnh mới đã được nén dạng WebP.
 */
export async function compressImage(file, { maxSize = 1600, quality = 0.8 } = {}) {
  // Chỉ nén nếu file là image
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Tạo URL tạm thời cho file
  const objectUrl = URL.createObjectURL(file);

  try {
    // Load ảnh vào HTMLImageElement
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.src = objectUrl;
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
    });

    let { width, height } = img;

    // Tính toán kích thước mới
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }

    // Tạo canvas để vẽ ảnh
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2d context from canvas');
    }

    // Vẽ ảnh lên canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Xuất canvas ra Blob dưới dạng image/webp
    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        'image/webp',
        quality
      );
    });

    if (!blob) {
      throw new Error('Canvas toBlob failed');
    }

    // Đổi tên file: thay đổi extension thành .webp
    const originalName = file.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    let baseName = originalName;
    if (lastDotIndex !== -1) {
      baseName = originalName.substring(0, lastDotIndex);
    }
    const newFileName = `${baseName}.webp`;

    // Trả về File mới
    return new File([blob], newFileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Lỗi khi nén ảnh trên client:', error);
    // Nếu có lỗi, trả về file gốc để fallback tải lên thay vì làm crash ứng dụng
    return file;
  } finally {
    // Giải phóng bộ nhớ cho URL tạm thời
    URL.revokeObjectURL(objectUrl);
  }
}
