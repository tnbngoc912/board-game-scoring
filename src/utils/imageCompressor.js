/**
 * Nén ảnh bằng Canvas API và chuyển sang định dạng WebP (với fallback JPEG nếu trình duyệt không hỗ trợ).
 * @param {File} file - File ảnh gốc.
 * @param {Object} options - Tùy chọn nén.
 * @param {number} options.maxSize - Kích thước cạnh lớn nhất (mặc định 1600px - sắc nét chuẩn HD cho mobile & web).
 * @param {number} options.quality - Chất lượng nén từ 0 đến 1 (mặc định 0.82).
 * @returns {Promise<File>} File ảnh mới đã được nén dạng WebP hoặc JPEG.
 */
export async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  // Chỉ nén nếu file là image
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Không cần nén nếu là ảnh vector SVG hoặc ảnh gif động
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
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

    // Giữ nguyên tỷ lệ và giới hạn cạnh lớn nhất theo maxSize
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

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Could not get 2d context from canvas');
    }

    // Đổ nền trắng mặc định nếu ảnh có transparent (phòng trường hợp xuất JPEG)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Vẽ ảnh lên canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Thử xuất ra WebP trước
    let outputType = 'image/webp';
    let blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality);
    });

    // Kiểm tra tính tương thích: Nếu Safari cũ không hỗ trợ WebP encode, toBlob sẽ sinh ra PNG hoặc null
    if (!blob || blob.type === 'image/png') {
      outputType = 'image/jpeg';
      blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82);
      });
    }

    // Giải phóng bộ nhớ GPU Canvas ngay lập tức
    canvas.width = 0;
    canvas.height = 0;

    if (!blob) {
      throw new Error('Canvas toBlob failed');
    }

    // Đổi phần mở rộng file tương ứng với mime type
    const originalName = file.name || 'image';
    const lastDotIndex = originalName.lastIndexOf('.');
    let baseName = originalName;
    if (lastDotIndex !== -1) {
      baseName = originalName.substring(0, lastDotIndex);
    }
    const ext = outputType === 'image/webp' ? '.webp' : '.jpg';
    const newFileName = `${baseName}${ext}`;

    return new File([blob], newFileName, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Lỗi khi nén ảnh trên client:', error);
    return file;
  } finally {
    // Giải phóng bộ nhớ cho URL tạm thời
    URL.revokeObjectURL(objectUrl);
  }
}
