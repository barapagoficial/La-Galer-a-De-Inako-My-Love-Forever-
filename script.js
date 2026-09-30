const gallery = document.querySelector('#gallery');
const emptyState = document.querySelector('#emptyState');
const photoCount = document.querySelector('#photoCount');
const addMore = document.querySelector('#addMore');
const galleryTools = document.querySelector('#galleryTools');
const collectionFilters = document.querySelector('#collectionFilters');
const layoutButton = document.querySelector('#layoutButton');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxCaption = document.querySelector('#lightboxCaption');
const lightboxIndex = document.querySelector('#lightboxIndex');
let allPhotos = [];
let photos = [];
let activeIndex = 0;
let activeCollection = 'Todas';

const cleanName = (photo) => {
  const file = decodeURIComponent(photo.name || photo.path?.split('/').pop() || 'Inako');
  return file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Inako';
};

function getCollection(path = '') {
  const parts = path.split('/').filter(Boolean);
  // Manifest: fotos/subcarpeta/archivo. Local folder: carpeta/subcarpeta/archivo.
  return parts.length > 2 ? parts[parts.length - 2] : 'Principal';
}

function updateCounter() {
  photoCount.textContent = `${String(photos.length).padStart(2, '0')} ${photos.length === 1 ? 'fotografía' : 'fotografías'}`;
}

function createCard(photo, index) {
  const article = document.createElement('article');
  article.className = 'gallery-card';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', `Abrir ${cleanName(photo)}`);
  const image = document.createElement('img');
  image.src = photo.src;
  image.alt = `Inako — ${cleanName(photo)}`;
  image.loading = index < 6 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.onerror = () => article.remove();
  const overlay = document.createElement('span');
  overlay.className = 'card-overlay';
  overlay.innerHTML = `<span>${String(index + 1).padStart(2, '0')} · Inako</span><b>↗</b>`;
  button.append(image, overlay);
  button.addEventListener('click', () => openLightbox(index));
  article.append(button);
  gallery.append(article);
  cardObserver.observe(article);
}

function renderGallery() {
  photos = activeCollection === 'Todas'
    ? [...allPhotos]
    : allPhotos.filter(photo => photo.collection === activeCollection);
  gallery.replaceChildren();
  photos.forEach(createCard);
  emptyState.hidden = allPhotos.length > 0;
  addMore.hidden = allPhotos.length === 0;
  galleryTools.hidden = allPhotos.length === 0;
  updateCounter();
}

function buildFilters() {
  const collections = ['Todas', ...new Set(allPhotos.map(photo => photo.collection))];
  collectionFilters.replaceChildren();
  collections.forEach(collection => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-button${collection === activeCollection ? ' active' : ''}`;
    button.textContent = collection;
    button.addEventListener('click', () => {
      activeCollection = collection;
      buildFilters();
      renderGallery();
    });
    collectionFilters.append(button);
  });
}

function render(items) {
  allPhotos.forEach(photo => photo.local && URL.revokeObjectURL(photo.src));
  allPhotos = items;
  activeCollection = 'Todas';
  buildFilters();
  renderGallery();
}

async function loadManifest() {
  try {
    const response = await fetch('fotos.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No manifest');
    const files = await response.json();
    render(files.map(src => ({
      src,
      path: src,
      name: src.split('/').pop(),
      collection: getCollection(src),
      local: false
    })));
  } catch {
    render([]);
  }
}

function loadFolder(event) {
  const files = [...event.target.files]
    .filter(file => file.type.startsWith('image/'))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
  render(files.map(file => {
    const path = file.webkitRelativePath || file.name;
    return {
      src: URL.createObjectURL(file),
      path,
      name: file.name,
      collection: getCollection(path),
      local: true
    };
  }));
  document.querySelector('#galeria').scrollIntoView({ behavior: 'smooth' });
}

document.querySelector('#folderInput').addEventListener('change', loadFolder);
document.querySelector('#moreInput').addEventListener('change', loadFolder);
layoutButton.addEventListener('click', () => {
  const compact = gallery.classList.toggle('compact');
  layoutButton.setAttribute('aria-pressed', String(compact));
  document.querySelector('#layoutLabel').textContent = compact ? 'Vista amplia' : 'Vista compacta';
});

function openLightbox(index) {
  activeIndex = index;
  updateLightbox();
  lightbox.showModal();
  document.body.style.overflow = 'hidden';
}
function updateLightbox() {
  const photo = photos[activeIndex];
  if (!photo) return;
  lightboxImage.src = photo.src;
  lightboxImage.alt = `Inako — ${cleanName(photo)}`;
  lightboxCaption.textContent = `${photo.collection} · ${cleanName(photo)}`;
  lightboxIndex.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
}
function moveLightbox(direction) {
  activeIndex = (activeIndex + direction + photos.length) % photos.length;
  updateLightbox();
}
function closeLightbox() {
  lightbox.close();
  document.body.style.overflow = '';
}
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-arrow.prev').addEventListener('click', () => moveLightbox(-1));
document.querySelector('.lightbox-arrow.next').addEventListener('click', () => moveLightbox(1));
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', event => {
  if (!lightbox.open) return;
  if (event.key === 'ArrowLeft') moveLightbox(-1);
  if (event.key === 'ArrowRight') moveLightbox(1);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
  revealObserver.observe(element);
});
const cardObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: .08 });

const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');
let pointerX = innerWidth / 2, pointerY = innerHeight / 2, ringX = pointerX, ringY = pointerY;
addEventListener('mousemove', event => {
  pointerX = event.clientX; pointerY = event.clientY;
  cursorDot.style.transform = `translate(${pointerX - 2}px, ${pointerY - 2}px)`;
});
(function follow() {
  ringX += (pointerX - ringX) * .14; ringY += (pointerY - ringY) * .14;
  cursor.style.transform = `translate(${ringX - 19}px, ${ringY - 19}px)`;
  requestAnimationFrame(follow);
})();
document.addEventListener('mouseover', event => cursor.classList.toggle('active', !!event.target.closest('a, button, label')));

const canvas = document.querySelector('#stars');
const ctx = canvas.getContext('2d');
let stars = [];
let animationId;
function sizeCanvas() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  stars = Array.from({ length: Math.min(90, Math.floor(innerWidth / 14)) }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: Math.random() * .75 + .15, speed: Math.random() * .08 + .015,
    alpha: Math.random() * .55 + .1
  }));
}
function drawStars() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  stars.forEach(star => {
    star.y -= star.speed;
    if (star.y < -2) { star.y = innerHeight + 2; star.x = Math.random() * innerWidth; }
    ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`; ctx.fill();
  });
  animationId = requestAnimationFrame(drawStars);
}
addEventListener('resize', sizeCanvas);
sizeCanvas(); drawStars();

const motionToggle = document.querySelector('#motionToggle');
motionToggle.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.title = paused ? 'Reanudar animaciones' : 'Pausar animaciones';
  if (paused) cancelAnimationFrame(animationId); else drawStars();
});

loadManifest();
