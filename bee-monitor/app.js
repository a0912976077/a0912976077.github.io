const gallery = document.getElementById('gallery');
const viewer = document.getElementById('viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerCaption = document.getElementById('viewer-caption');
document.getElementById('close-viewer').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });

function makeCard(item, index) {
  const card = document.createElement('article');
  card.className = 'photo-card';
  const open = document.createElement('button');
  open.className = 'photo-open';
  open.type = 'button';
  open.setAttribute('aria-label', `放大第 ${index + 1} 張照片`);
  const image = document.createElement('img');
  image.src = item.original;
  image.alt = `${item.captured_at} 拍照端原始照片`;
  image.loading = index < 4 ? 'eager' : 'lazy';
  open.append(image);
  const meta = document.createElement('div');
  meta.className = 'photo-meta';
  const heading = document.createElement('strong');
  heading.textContent = item.captured_at;
  open.addEventListener('click', () => {
    viewerImage.src = image.src;
    viewerCaption.textContent = `${item.captured_at} · 原始照片`;
    viewer.showModal();
  });
  meta.append(heading);
  card.append(open, meta);
  return card;
}

fetch('photos.json', { cache: 'no-store' })
  .then(response => { if (!response.ok) throw new Error('清單無法讀取'); return response.json(); })
  .then(data => {
    document.getElementById('latest-capture').textContent = data.latest_capture_at || '尚無照片';
    document.getElementById('sync-time').textContent = data.generated_at ? new Date(data.generated_at).toLocaleString('zh-TW') : '未知';
    document.getElementById('photo-count').textContent = `${data.photo_count} 張`;
    gallery.replaceChildren(...data.photos.map(makeCard));
  })
  .catch(() => { gallery.textContent = '照片清單暫時無法載入。'; });
