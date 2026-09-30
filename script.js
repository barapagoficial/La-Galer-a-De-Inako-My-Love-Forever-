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
const preloader = document.querySelector('#preloader');
const progressBar = document.querySelector('#scrollProgress');
const nav = document.querySelector('.nav');
const heroEl = document.querySelector('.hero');
const watermark = document.querySelector('.watermark');
const orbs = document.querySelectorAll('.orb');
const heroTitle = document.querySelector('#hero-title');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let allPhotos = [];
let photos = [];
let activeIndex = 0;
let activeCollection = 'Todas';

const cleanName = (photo) => {
  const file = decodeURIComponent(photo.name || photo.path?.split('/').pop() || 'Inako');
  return file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Inako';
};

function getCollection(path = '') {
  const parts = path.split('/').filter(Boolean).map(part => decodeURIComponent(part));
  // Manifest: fotos/subcarpeta/archivo. Local folder: carpeta/subcarpeta/archivo.
  return parts.length > 2 ? parts[parts.length - 2] : 'Principal';
}

/* ── Contador animado con ease-out ── */
function updateCounter() {
  const target = photos.length;
  const label = n => `${String(n).padStart(2, '0')} ${n === 1 ? 'fotografía' : 'fotografías'}`;
  if (target === 0 || reduceMotion) { photoCount.textContent = label(target); return; }
  const start = performance.now();
  const duration = 600;
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    photoCount.textContent = label(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function createCard(photo, index) {
  const article = document.createElement('article');
  article.className = 'gallery-card';
  // Entrada escalonada: cada tarjeta aparece un poco después de la anterior
  article.style.transitionDelay = `${(index % 6) * 55}ms`;
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', `Abrir ${cleanName(photo)}`);
  button.dataset.cursor = 'Ver';
  const image = document.createElement('img');
  image.src = photo.src;
  image.alt = `Inako — ${cleanName(photo)}`;
  image.loading = index < 6 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.onerror = () => article.remove();
  const stamp = document.createElement('span');
  stamp.className = 'card-stamp px-heart';
  const overlay = document.createElement('span');
  overlay.className = 'card-overlay';
  overlay.innerHTML = `<span>${String(index + 1).padStart(2, '0')} · Inako</span><b>↗</b>`;
  button.append(image, stamp, overlay);
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
    const count = collection === 'Todas'
      ? allPhotos.length
      : allPhotos.filter(photo => photo.collection === collection).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-button${collection === activeCollection ? ' active' : ''}`;
    button.append(collection);
    const badge = document.createElement('span');
    badge.className = 'count';
    badge.textContent = count;
    button.append(badge);
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

/* ── Lightbox ── */
function openLightbox(index) {
  activeIndex = index;
  updateLightbox();
  lightbox.showModal();
  document.body.classList.add('lightbox-open');
  document.body.style.overflow = 'hidden';
}
function updateLightbox() {
  const photo = photos[activeIndex];
  if (!photo) return;
  lightboxImage.src = photo.src;
  lightboxImage.alt = `Inako — ${cleanName(photo)}`;
  lightboxCaption.textContent = `${photo.collection} · ${cleanName(photo)}`;
  lightboxIndex.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  // Transición suave al cambiar de foto dentro del visor
  const figure = lightbox.querySelector('figure');
  figure.classList.remove('swap');
  void figure.offsetWidth;
  figure.classList.add('swap');
}
function moveLightbox(direction) {
  activeIndex = (activeIndex + direction + photos.length) % photos.length;
  updateLightbox();
}
function closeLightbox() {
  lightbox.close();
  document.body.classList.remove('lightbox-open');
  document.body.style.overflow = '';
}
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-arrow.prev').addEventListener('click', () => moveLightbox(-1));
document.querySelector('.lightbox-arrow.next').addEventListener('click', () => moveLightbox(1));
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
// Esc cierra el diálogo de forma nativa; sincronizamos también el cursor y el scroll.
lightbox.addEventListener('close', () => {
  document.body.classList.remove('lightbox-open');
  document.body.style.overflow = '';
});
document.addEventListener('keydown', event => {
  if (!lightbox.open) return;
  if (event.key === 'ArrowLeft') moveLightbox(-1);
  if (event.key === 'ArrowRight') moveLightbox(1);
});
// Deslizar el dedo para cambiar de foto en móvil.
let touchStartX = 0;
let touchStartY = 0;
lightbox.addEventListener('touchstart', event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });
lightbox.addEventListener('touchend', event => {
  const dx = event.changedTouches[0].clientX - touchStartX;
  const dy = event.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) moveLightbox(dx < 0 ? 1 : -1);
}, { passive: true });

/* ── Reveal genérico al hacer scroll ── */
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

/* ── Preloader ── */
const bootTime = performance.now();
function finishPreloader() {
  if (!preloader || preloader.classList.contains('done')) return;
  preloader.classList.add('done');
  heroTitle?.classList.add('revealed');
  setTimeout(() => preloader.remove(), 1100);
}
addEventListener('load', () => {
  setTimeout(finishPreloader, Math.max(0, 1050 - (performance.now() - bootTime)));
});
setTimeout(finishPreloader, 4000); // seguridad por si 'load' tarda demasiado

/* ── Título del hero: entrada letra a letra (los <em> quedan intactos) ── */
if (heroTitle) {
  const chars = [];
  heroTitle.querySelectorAll('.title-line').forEach(line => {
    [...line.childNodes].forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const fragment = document.createDocumentFragment();
      for (const ch of node.textContent) {
        if (ch === ' ') { fragment.append(document.createTextNode(' ')); continue; }
        const wrap = document.createElement('span');
        wrap.className = 'char-wrap';
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        wrap.append(span);
        fragment.append(wrap);
        chars.push(span);
      }
      node.replaceWith(fragment);
    });
  });
  chars.forEach((char, index) => char.style.setProperty('--d', `${index * 45}ms`));
  heroTitle.classList.add('chars-on');
}

/* ── Scroll: barra de progreso + nav + parallax del watermark ── */
let scrollTicking = false;
addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0) {
      const stepped = Math.round((y / max) * 32) / 32; // avance "a saltos", como píxeles
      progressBar.style.setProperty('--p', stepped);
    }
    if (watermark && y < innerHeight * 1.2) {
      watermark.style.transform = `translateY(${y * 0.22}px)`;
    }
    scrollTicking = false;
  });
}, { passive: true });

/* ── Parallax de los orbes con el ratón ── */
if (!reduceMotion && heroEl) {
  heroEl.addEventListener('mousemove', event => {
    const x = event.clientX / innerWidth - .5;
    const y = event.clientY / innerHeight - .5;
    orbs.forEach((orb, index) => {
      const force = index === 0 ? 34 : -26;
      orb.style.translate = `${x * force}px ${y * force}px`;
    });
  });
}

/* ── Cursor personalizado con etiqueta en elementos [data-cursor] ── */
const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');
const cursorLabel = document.querySelector('.cursor-label');
let pointerX = innerWidth / 2, pointerY = innerHeight / 2, ringX = pointerX, ringY = pointerY;
addEventListener('mousemove', event => {
  pointerX = event.clientX; pointerY = event.clientY;
  cursorDot.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;
});
(function follow() {
  ringX += (pointerX - ringX) * .14; ringY += (pointerY - ringY) * .14;
  cursor.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  requestAnimationFrame(follow);
})();
document.addEventListener('mouseover', event => {
  cursor.classList.toggle('active', !!event.target.closest('a, button, label'));
  const labeled = event.target.closest('[data-cursor]');
  cursor.classList.toggle('labeled', !!labeled);
  cursorLabel.textContent = labeled ? labeled.dataset.cursor : '';
});

/* ── Corazones pixel que nacen al hacer clic ── */
let flyingHearts = 0;
function spawnHeart(x, y, bigBoost = false) {
  if (flyingHearts > 16) return;
  const heart = document.createElement('span');
  heart.className = 'px-heart click-heart';
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  heart.style.setProperty('--s', `${13 + Math.random() * 11}px`);
  heart.style.setProperty('--dx', `${Math.random() * 70 - 35}px`);
  heart.style.setProperty('--rot', `${Math.random() * 30 - 15}deg`);
  heart.style.setProperty('--c', ['#f0eee9', '#dcd8cc', '#ffffff'][Math.floor(Math.random() * 3)]);
  document.body.append(heart);
  flyingHearts++;
  heart.addEventListener('animationend', () => { heart.remove(); flyingHearts--; });
  if (bigBoost) heart.style.setProperty('--s', '26px');
}
addEventListener('pointerdown', event => {
  if (reduceMotion || lightbox.open) return;
  if (event.target.closest('a, button, label, input, .gallery-card')) return;
  spawnHeart(event.clientX, event.clientY);
});

/* ── Easter egg: escribe "inako" y cae una lluvia de corazones ── */
let typedBuffer = '';
addEventListener('keydown', event => {
  if (event.key.length !== 1 || lightbox.open) return;
  typedBuffer = (typedBuffer + event.key.toLowerCase()).slice(-5);
  if (typedBuffer === 'inako') {
    typedBuffer = '';
    for (let i = 0; i < 24; i++) {
      setTimeout(() => spawnHeart(
        innerWidth * (0.08 + Math.random() * 0.84),
        innerHeight * (0.15 + Math.random() * 0.6)
      ), i * 70);
    }
  }
});

/* ── Cielo estrellado: estrellas que titilan + estrellas fugaces ── */
const canvas = document.querySelector('#stars');
const ctx = canvas.getContext('2d');
let stars = [];
let shootingStars = [];
let animationId;
let starsRunning = false;

function sizeCanvas() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  stars = Array.from({ length: Math.min(90, Math.floor(innerWidth / 14)) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * .75 + .15,
    speed: Math.random() * .08 + .015,
    alpha: Math.random() * .55 + .1,
    phase: Math.random() * Math.PI * 2,
    drift: (Math.random() - .5) * .02
  }));
}

function spawnShootingStar() {
  if (starsRunning && !document.hidden && !document.body.classList.contains('motion-paused')) {
    shootingStars.push({
      x: Math.random() * innerWidth * .7 + innerWidth * .3,
      y: Math.random() * innerHeight * .35,
      vx: -(3.6 + Math.random() * 3),
      vy: 1.4 + Math.random() * 1.4,
      life: 1
    });
  }
  setTimeout(spawnShootingStar, 4500 + Math.random() * 7000);
}

function drawStars() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  stars.forEach(star => {
    star.y -= star.speed;
    star.x += star.drift;
    star.phase += .02;
    if (star.y < -2) { star.y = innerHeight + 2; star.x = Math.random() * innerWidth; }
    const twinkle = star.alpha * (.6 + .4 * Math.sin(star.phase));
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
    ctx.fill();
  });

  shootingStars = shootingStars.filter(star => star.life > 0);
  shootingStars.forEach(star => {
    star.x += star.vx;
    star.y += star.vy;
    star.life -= .012;
    const tailX = star.x - star.vx * 16;
    const tailY = star.y - star.vy * 16;
    const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255,255,255,${.85 * star.life})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
  });

  if (starsRunning) animationId = requestAnimationFrame(drawStars);
}

addEventListener('resize', sizeCanvas);
sizeCanvas();
starsRunning = true;
drawStars();
setTimeout(spawnShootingStar, 3500);

/* ── Botón para pausar/reanudar animaciones ── */
const motionToggle = document.querySelector('#motionToggle');
motionToggle.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.title = paused ? 'Reanudar animaciones' : 'Pausar animaciones';
  if (paused) {
    starsRunning = false;
    cancelAnimationFrame(animationId);
  } else if (!starsRunning) {
    starsRunning = true;
    drawStars();
  }
});

loadManifest();
