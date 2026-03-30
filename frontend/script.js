let page = 1;
const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');
let currentImageId = null;
let currentIndex = 0;

// Load images from API
async function loadImages() {
  const res = await fetch(`http://localhost:4000/api/images?page=${page}`);
  const data = await res.json();

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.setAttribute('data-id', item._id);
    div.setAttribute('data-title', item.title);
    div.setAttribute('data-description', item.description);

    const img = document.createElement('img');
    img.dataset.src = `http://localhost:4000/uploads/${item.filename}`;
    img.alt = item.title;
    img.className = 'lazy';

    div.appendChild(img);
    gallery.appendChild(div);
  });

  lazyLoad();
}

function lazyLoad() {
  const imgs = document.querySelectorAll('img.lazy');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  imgs.forEach(img => observer.observe(img));
}

// Observe loader for infinite scroll
const scrollObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      page++;
      loadImages();
    }
  });
}, {
  rootMargin: '200px'
});

scrollObserver.observe(loader);

// Initial image load
loadImages();

// Lightbox click handler
gallery.addEventListener('click', async e => {
  const item = e.target.closest('.gallery-item');
  if (!item) return;

  const img = item.querySelector('img');
  const title = item.getAttribute('data-title');
  const desc = item.getAttribute('data-description');
  currentImageId = item.getAttribute('data-id');
  const allItems = Array.from(document.querySelectorAll('.gallery-item'));
  currentIndex = allItems.indexOf(item);

  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox-title').innerText = title;
  document.getElementById('lightbox-description').innerText = desc;
  document.getElementById('lightbox').classList.remove('hidden');

  await loadComments(currentImageId);
});

// Load comments
async function loadComments(imageId) {
  const commentsDiv = document.getElementById('comments-list');
  commentsDiv.innerHTML = '';
  try {
    const res = await fetch(`http://localhost:4000/api/images/${imageId}/comments`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const comments = await res.json();
    comments.forEach(c => {
      const el = document.createElement('div');
      el.className = 'comment';
      el.innerText = `${c.userId?.username || 'Anonymous'}: ${c.text}`;
      commentsDiv.appendChild(el);
    });
  } catch (err) {
    commentsDiv.innerText = 'Failed to load comments.';
  }
}

// Post comment
const commentForm = document.getElementById('comment-form');
commentForm.addEventListener('submit', async e => {
  e.preventDefault();
  const text = e.target.text.value;
  if (!text.trim()) return;

  try {
    await fetch(`http://localhost:4000/api/images/${currentImageId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ text })
    });
    e.target.reset();
    await loadComments(currentImageId);
  } catch (err) {
    alert('Error posting comment');
  }
});

// Lightbox navigation
document.querySelector('.lightbox .close').addEventListener('click', () => {
  document.getElementById('lightbox').classList.add('hidden');
});

document.querySelector('.next-btn').addEventListener('click', () => {
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  currentIndex = (currentIndex + 1) % items.length;
  items[currentIndex].click();
});

document.querySelector('.prev-btn').addEventListener('click', () => {
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  currentIndex = (currentIndex - 1 + items.length) % items.length;
  items[currentIndex].click();
});

// Hero Slideshow
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-images .slide');
let heroInterval = setInterval(showNextSlide, 4000);

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove('active'));
  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
}

function showNextSlide() {
  showSlide(currentSlide + 1);
}

function showPrevSlide() {
  showSlide(currentSlide - 1);
}

document.querySelector('.hero-next').addEventListener('click', () => {
  clearInterval(heroInterval);
  showNextSlide();
  heroInterval = setInterval(showNextSlide, 4000);
});

document.querySelector('.hero-prev').addEventListener('click', () => {
  clearInterval(heroInterval);
  showPrevSlide();
  heroInterval = setInterval(showNextSlide, 4000);
});

showSlide(currentSlide);

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
});

// User & token management
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userDisplay = document.getElementById('current-user');
  const uploadLink = document.getElementById('upload-link');

  // Create logout button dynamically if missing
  let logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.className = 'theme-btn';
    document.querySelector('header').appendChild(logoutBtn);
  }

  if (!token) {
    userDisplay.style.display = 'none';
    logoutBtn.style.display = 'none';
    if (uploadLink) uploadLink.style.display = 'none';
    return;
  }

  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));

    if (decoded.username) {
      userDisplay.textContent = 'Logged in as: ' + decoded.username;
      userDisplay.style.display = 'block';
      logoutBtn.style.display = 'inline-block';
    }

    if (decoded.role === 'admin' && uploadLink) {
      uploadLink.style.display = 'inline-block';
    } else if (uploadLink) {
      uploadLink.style.display = 'none';
    }
  } catch (err) {
    console.error('Invalid token');
    localStorage.removeItem('token');
    location.reload();
  }

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    location.reload();
  });
});
