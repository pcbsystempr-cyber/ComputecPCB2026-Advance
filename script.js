// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        const isActive = navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
    });
    
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }
    });
}

// Close menu when clicking on a link
document.querySelectorAll('.nav-menu a, .nav-menu button').forEach(navAction => {
    navAction.addEventListener('click', () => {
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    });
});

// Scroll to Top Button
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Botón "volver arriba" va con el FAB (position:fixed); siempre visible en CSS.

function lockAdminSessionOnHomeReturn() {
    const isAdminPage = /admin\.html?$/i.test(window.location.pathname);
    if (isAdminPage || !window.Authenticator || typeof Authenticator.logout !== 'function') {
        return;
    }

    let shouldLockSession = false;

    try {
        shouldLockSession = sessionStorage.getItem('computec_lock_admin_on_home') === '1';
        if (shouldLockSession) {
            sessionStorage.removeItem('computec_lock_admin_on_home');
        }
    } catch (error) {
        console.warn('No se pudo leer el estado de bloqueo de admin.', error);
    }

    if (!shouldLockSession && /admin\.html?$/i.test(document.referrer || '')) {
        shouldLockSession = true;
    }

    if (shouldLockSession) {
        Authenticator.logout();
    }
}

lockAdminSessionOnHomeReturn();

// Inicializar noticias si no existen
function initializeNews() {
    const defaultNews = [
        {
            id: 1,
            title: 'Próximo Gaming Day',
            date: '2026-02-13',
            content: '¡Se acerca el Gaming Day 2026! Torneos de videojuegos, premios increíbles, música y entretenimiento. Regístrate y participa en el evento gaming más esperado del año.',
            featured: true
        },
        {
            id: 2,
            title: 'PCB System - Página Principal de la Escuela',
            date: '2026-01-10',
            content: 'Estudiantes de COMPUTEC desarrollan la página web oficial de la Escuela Superior Vocacional Pablo Colón Berdecía.',
            featured: false
        },
        {
            id: 3,
            title: 'Taller de Inteligencia Artificial para Maestros',
            date: '2026-01-30',
            content: 'Taller especializado de Inteligencia Artificial dirigido a maestros de la escuela. Aprende sobre IA, herramientas educativas y cómo integrar la tecnología en el salón de clases.',
            featured: false
        }
    ];
    
    if (!localStorage.getItem('news')) {
        localStorage.setItem('news', JSON.stringify(defaultNews));
    }
}

// Inicializar proyectos si no existen
function initializeProjects() {
    const defaultProjects = [
        {
            id: 1,
            title: 'PCB System',
            student: 'Estudiantes de COMPUTEC',
            year: '2026',
            category: 'Programación',
            description: 'Sistema web institucional de la Escuela Pablo Colón Berdecía.',
            status: 'published'
        },
        {
            id: 2,
            title: 'Casa Abierta',
            student: 'Estudiantes de COMPUTEC',
            year: '2026',
            category: 'Programación',
            description: 'Página web del evento Casa Abierta con talleres y programas disponibles.',
            status: 'published'
        },
        {
            id: 3,
            title: 'Unidad de Apoyo Socioemocional',
            student: 'Estudiantes de COMPUTEC',
            year: '2026',
            category: 'Programación',
            description: 'Plataforma web con recursos, información y servicios de apoyo estudiantil.',
            status: 'published'
        },
        {
            id: 4,
            title: 'DECA Coop',
            student: 'Estudiantes de COMPUTEC',
            year: '2026',
            category: 'Programación',
            description: 'Tienda en línea estudiantil con productos, ofertas y experiencia de compra digital.',
            status: 'published'
        },
        {
            id: 5,
            title: 'Centro de Impresiones Escolares',
            student: 'Estudiantes de COMPUTEC',
            year: '2026',
            category: 'Programación',
            description: 'Servicio de impresiones escolares en línea para estudiantes y personal de COMPUTEC.',
            status: 'published'
        },
        {
            id: 6,
            title: 'Solicitud de Servicio Técnico',
            student: 'Estudiantes de COMPUTEC',
            year: '2026',
            category: 'Programación',
            description: 'Plataforma para gestionar y solicitar servicios técnicos dentro de la escuela.',
            status: 'published'
        },
        {
            id: 7,
            title: 'ElectroDashboard PCB',
            student: 'Estudiantes de COMPUTEC',
            year: '2026',
            category: 'Programación',
            description: 'Dashboard interactivo para monitoreo y gestión de herramientas eléctricas escolares.',
            status: 'published'
        }
    ];

    const storedProjectsRaw = localStorage.getItem('projects');
    if (!storedProjectsRaw) {
        localStorage.setItem('projects', JSON.stringify(defaultProjects));
        return;
    }

    let storedProjects = [];
    try {
        storedProjects = JSON.parse(storedProjectsRaw);
        if (!Array.isArray(storedProjects)) {
            storedProjects = [];
        }
    } catch (error) {
        storedProjects = [];
    }

    const normalizeTitle = (value) => String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const existingTitles = new Set(storedProjects.map(item => normalizeTitle(item && item.title)));
    const missingDefaults = defaultProjects.filter(item => !existingTitles.has(normalizeTitle(item.title)));

    if (missingDefaults.length) {
        const maxId = storedProjects.reduce((max, item) => Math.max(max, Number(item && item.id) || 0), 0);
        const defaultsWithIds = missingDefaults.map((item, index) => ({
            ...item,
            id: maxId + index + 1
        }));
        localStorage.setItem('projects', JSON.stringify(storedProjects.concat(defaultsWithIds)));
    }
}

// Inicializar servicios si no existen
function initializeServices() {
    const defaultServices = [
        {
            id: 1,
            name: 'Reparación de Equipos',
            description: 'Diagnóstico y reparación de computadoras, laptops y periféricos',
            available: true,
            status: 'active'
        },
        {
            id: 2,
            name: 'Instalación de Software',
            description: 'Instalación y configuración de programas educativos',
            available: true,
            status: 'active'
        },
        {
            id: 3,
            name: 'Soporte de Red',
            description: 'Asistencia con conexiones de red y problemas de conectividad',
            available: true,
            status: 'active'
        },
        {
            id: 4,
            name: 'Configuración de Proyectores',
            description: 'Instalación y configuración de equipos audiovisuales',
            available: true,
            status: 'active'
        }
    ];

    if (!localStorage.getItem('services')) {
        localStorage.setItem('services', JSON.stringify(defaultServices));
    }
}

// Obtener noticias desde localStorage
function getNews() {
    const news = localStorage.getItem('news');
    return news ? JSON.parse(news) : [];
}

function getProjects() {
    const projects = localStorage.getItem('projects');
    return projects ? JSON.parse(projects) : [];
}

function getServices() {
    const services = localStorage.getItem('services');
    return services ? JSON.parse(services) : [];
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toSafeId(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
}

// Guardar noticias en localStorage
function saveNews(news) {
    localStorage.setItem('news', JSON.stringify(news));
}

// Renderizar noticias en la página principal
function renderNews() {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    const now = new Date();
    const news = getNews().filter(item => {
        const status = item.status || 'published';
        if (status === 'draft') return false;
        if (status === 'scheduled') {
            if (!item.publishAt) return false;
            return new Date(item.publishAt) <= now;
        }
        return true;
    });
    
    if (news.length === 0) {
        newsGrid.innerHTML = '<p style="text-align: center; color: #666;">No hay noticias disponibles.</p>';
        return;
    }
    
    // Ordenar por fecha (más reciente primero)
    news.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    newsGrid.innerHTML = news.map((item, index) => `
        <article class="news-card ${item.featured ? 'featured' : ''}">
            ${item.featured ? '<div class="news-badge">Destacado</div>' : ''}
            <div class="news-image">
                <i class="fa-solid fa-newspaper"></i>
            </div>
            <div class="news-content">
                <span class="news-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(formatDate(item.date))}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.content)}</p>
            </div>
        </article>
    `).join('');
}

function renderProjects() {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    const projectLinksByTitle = {
        'pcb system': 'https://pcbsystempr-cyber.github.io/pcbsystem2026/',
        'casa abierta': 'https://pcbsystempr-cyber.github.io/Casa-Abierta/',
        'unidad de apoyo socioemocional': 'https://pcbsystempr-cyber.github.io/Unidad_de_Apoyo_Socioemocional_Prueba/',
        'deca coop': 'https://pcbsystempr-cyber.github.io/DECA_de_Barranquitas_up/',
        'centro de impresiones escolares': 'https://pcbsystempr-cyber.github.io/CopiasPCB/',
        'solicitud de servicio tecnico': 'https://pcbsystempr-cyber.github.io/Servicio-Tecnico/',
        'electrodashboard pcb': 'https://pcbsystempr-cyber.github.io/electricity_tool_pcb/',
    };

    const resolveProjectLink = (project) => {
        const title = String(project?.title || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

        return projectLinksByTitle[title] || 'https://github.com/pcbsystempr-cyber';
    };

    const projects = getProjects()
        .filter(item => (item.status || 'published') === 'published')
        .sort((a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0));

    if (projects.length === 0) {
        return;
    }

    projectsGrid.innerHTML = projects.map(item => {
        const projectLink = resolveProjectLink(item);
        return `
        <div class="project-card featured-project">
            <div class="project-badge"><i class="fa-solid fa-code"></i> ${escapeHtml(item.category || 'Proyecto')}</div>
            <div class="project-image">
                <i class="fa-solid fa-laptop-code"></i>
            </div>
            <div class="project-content">
                <h3>${escapeHtml(item.title)}</h3>
                <p class="project-author">Por: ${escapeHtml(item.student || 'Estudiantes de COMPUTEC')} ${item.year ? '· ' + escapeHtml(item.year) : ''}</p>
                <p class="project-description">${escapeHtml(item.description || 'Proyecto desarrollado por estudiantes de COMPUTEC.')}</p>
                <div class="project-tech">
                    <span class="tech-tag">${escapeHtml(item.category || 'Tecnología')}</span>
                </div>
                <button class="view-project-btn" type="button" onclick="window.open('${projectLink}', '_blank')">Ver página</button>
            </div>
        </div>
    `;
    }).join('');
}

function renderServices() {
    const serviceList = document.querySelector('#servicios-tecnicos .service-list');
    if (!serviceList) return;

    const services = getServices().filter(item => {
        const status = item.status || (item.available ? 'active' : 'inactive');
        return status === 'active';
    });

    if (services.length === 0) {
        return;
    }

    serviceList.innerHTML = services.map(item => `
        <div class="service-item">
            <i class="fa-solid fa-wrench"></i>
            <div>
                <h4>${escapeHtml(item.name)}</h4>
                <p>${escapeHtml(item.description || 'Servicio técnico disponible para maestros.')}</p>
            </div>
        </div>
    `).join('');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// ============================================
// GALLERY SYSTEM
// ============================================

// Default gallery images
const defaultGalleryImages = [
    {
        id: 1,
        src: 'galeria/LogoLimpio4.png',
        alt: 'Logo de COMPUTEC',
        description: 'Logo oficial de la Escuela Superior Vocacional Pablo Colón Berdecía'
    }
];

// Get gallery images from localStorage
function getGalleryImages() {
    const images = localStorage.getItem('galleryImages');
    return images ? JSON.parse(images) : defaultGalleryImages;
}

// Save gallery images to localStorage
function saveGalleryImages(images) {
    localStorage.setItem('galleryImages', JSON.stringify(images));
}

// Get gallery settings
function getGallerySettings() {
    const settings = localStorage.getItem('gallerySettings');
    return settings ? JSON.parse(settings) : { transitionTime: 5000 };
}

// Save gallery settings
function saveGallerySettings(settings) {
    localStorage.setItem('gallerySettings', JSON.stringify(settings));
}

// Initialize gallery
function initializeGallery() {
    if (!localStorage.getItem('galleryImages')) {
        saveGalleryImages(defaultGalleryImages);
    }
    if (!localStorage.getItem('gallerySettings')) {
        saveGallerySettings({ transitionTime: 5000 });
    }
}

// Carousel state
let currentSlide = 0;
let carouselInterval = null;

// Render gallery carousel
function renderGallery() {
    const carousel = document.getElementById('gallery-carousel');
    const indicators = document.getElementById('carousel-indicators');
    const thumbnails = document.getElementById('gallery-thumbnails');
    
    if (!carousel) return;
    
    const images = getGalleryImages();
    const settings = getGallerySettings();
    
    if (images.length === 0) {
        carousel.innerHTML = `
            <div class="gallery-empty">
                <i class="fa-solid fa-images"></i>
                <p>No hay imágenes en la galería</p>
            </div>
        `;
        if (indicators) indicators.innerHTML = '';
        if (thumbnails) thumbnails.innerHTML = '';
        return;
    }
    
    // Render slides
    carousel.innerHTML = images.map((img, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${index === 0 ? 'high' : 'low'}">
            ${img.description ? `
                <div class="carousel-content">
                    <h3>${escapeHtml(img.alt)}</h3>
                    <p>${escapeHtml(img.description)}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Render indicators
    if (indicators) {
        indicators.innerHTML = images.map((_, index) => `
            <div class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
        `).join('');
        
        // Add click handlers to indicators
        indicators.querySelectorAll('.carousel-indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                goToSlide(parseInt(indicator.dataset.index));
            });
        });
    }
    
    // Render thumbnails
    if (thumbnails) {
        thumbnails.innerHTML = images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" loading="lazy" decoding="async" fetchpriority="low">
            </div>
        `).join('');
        
        // Add click handlers to thumbnails
        thumbnails.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                goToSlide(parseInt(thumb.dataset.index));
            });
        });
    }
    
    // Setup navigation buttons
    setupCarouselNavigation();
    
    // Start auto-advance
    startCarouselAutoAdvance(settings.transitionTime);
}

// Setup carousel navigation
function setupCarouselNavigation() {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            const images = getGalleryImages();
            currentSlide = (currentSlide - 1 + images.length) % images.length;
            updateSlide();
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            const images = getGalleryImages();
            currentSlide = (currentSlide + 1) % images.length;
            updateSlide();
        };
    }
}

// Go to specific slide
function goToSlide(index) {
    const images = getGalleryImages();
    if (index >= 0 && index < images.length) {
        currentSlide = index;
        updateSlide();
        
        // Reset auto-advance timer
        const settings = getGallerySettings();
        startCarouselAutoAdvance(settings.transitionTime);
    }
}

// Update slide display
function updateSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
    });
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
    
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentSlide);
    });
}

// Start auto-advance
function startCarouselAutoAdvance(intervalTime) {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    carouselInterval = setInterval(() => {
        const images = getGalleryImages();
        if (images.length > 1) {
            currentSlide = (currentSlide + 1) % images.length;
            updateSlide();
        }
    }, intervalTime);
}

// Stop auto-advance
function stopCarouselAutoAdvance() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

// Render additional images in teacher gallery section
function renderTeacherGallery() {
    const galleryGrid = document.getElementById('teacher-gallery-grid');
    if (!galleryGrid) return;
    
    const images = getGalleryImages();
    
    if (images.length === 0) {
        galleryGrid.innerHTML = '<p style="text-align: center; color: #666;">No hay imágenes disponibles</p>';
        return;
    }
    
    // Show up to 4 images in a grid (or fewer if less available)
    const displayImages = images.slice(0, 4);
    
    galleryGrid.innerHTML = displayImages.map((img, index) => `
        <div class="teacher-gallery-item">
            <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" loading="lazy" decoding="async" fetchpriority="low">
        </div>
    `).join('');
}

// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================

// Verificar si el usuario está logueado
function isLoggedIn() {
    return SessionManager.isAuthenticated();
}

// Mostrar panel de admin según estado de login
function updateAdminPanel() {
    const adminLogin = document.getElementById('admin-login');
    const adminContent = document.getElementById('admin-content');
    const adminPanel = document.getElementById('admin-panel');
    
    if (!adminLogin || !adminContent) return;
    
    if (isLoggedIn()) {
        adminLogin.style.display = 'none';
        adminContent.style.display = 'block';
        renderAdminNewsList();
    } else {
        adminLogin.style.display = 'block';
        adminContent.style.display = 'none';
    }
}

// Manejar login
async function handleLogin(event) {
    if (event) {
        event.preventDefault();
    }

    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');
    const errorMsg = document.getElementById('login-error');

    if (!usernameEl || !passwordEl || !errorMsg || !window.Authenticator) {
        return;
    }

    const username = usernameEl.value;
    const password = passwordEl.value;
    
    // Usar el autenticador seguro de auth.js
    const result = await Authenticator.login(username, password);
    
    if (result.success) {
        errorMsg.style.display = 'none';
        // Redirigir a admin
        setTimeout(function() {
            window.location.href = result.redirectUrl;
        }, 500);
    } else {
        errorMsg.textContent = result.message;
        errorMsg.style.display = 'block';
    }
}

// Manejar logout
function handleLogout() {
    Authenticator.logout();
    updateAdminPanel();
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
}

// Renderizar lista de noticias en admin
function renderAdminNewsList() {
    const newsList = document.getElementById('admin-news-list');
    if (!newsList) return;
    
    const news = getNews();
    
    if (news.length === 0) {
        newsList.innerHTML = '<p>No hay noticias. Agrega una nueva noticia.</p>';
        return;
    }
    
    news.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    newsList.innerHTML = news.map(item => {
        const safeId = toSafeId(item.id);
        return `
        <div class="news-list-item">
            <div class="news-info">
                <h5>${escapeHtml(item.title)}</h5>
                <span>${escapeHtml(formatDate(item.date))} ${item.featured ? '(Destacado)' : ''}</span>
            </div>
            <div class="news-actions">
                <button class="btn-edit" onclick="editNews(${safeId})">Editar</button>
                <button class="btn-delete" onclick="deleteNews(${safeId})">Eliminar</button>
            </div>
        </div>
    `;
    }).join('');
}

// Guardar noticia (crear o editar)
function handleNewsSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('news-id').value;
    const title = document.getElementById('news-title').value;
    const date = document.getElementById('news-date').value;
    const content = document.getElementById('news-content').value;
    const featured = document.getElementById('news-featured').checked;
    
    let news = getNews();
    
    if (id) {
        // Editar noticia existente
        const index = news.findIndex(n => n.id === parseInt(id));
        if (index !== -1) {
            news[index] = { id: parseInt(id), title, date, content, featured };
        }
    } else {
        // Crear nueva noticia
        const newId = news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
        news.push({ id: newId, title, date, content, featured });
    }
    
    saveNews(news);
    renderNews();
    renderAdminNewsList();
    resetNewsForm();
}

// Editar noticia
function editNews(id) {
    const news = getNews();
    const item = news.find(n => n.id === id);
    
    if (item) {
        document.getElementById('news-id').value = item.id;
        document.getElementById('news-title').value = item.title;
        document.getElementById('news-date').value = item.date;
        document.getElementById('news-content').value = item.content;
        document.getElementById('news-featured').checked = item.featured;
        
        document.getElementById('form-title').textContent = 'Editar Noticia';
        document.getElementById('cancel-edit').style.display = 'inline-block';
    }
}

// Eliminar noticia
function deleteNews(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
        let news = getNews();
        news = news.filter(n => n.id !== id);
        saveNews(news);
        renderNews();
        renderAdminNewsList();
    }
}

// Resetear formulario
function resetNewsForm() {
    document.getElementById('news-form').reset();
    document.getElementById('news-id').value = '';
    document.getElementById('form-title').textContent = 'Agregar Nueva Noticia';
    document.getElementById('cancel-edit').style.display = 'none';
}

// Cancelar edición
function cancelEdit() {
    resetNewsForm();
}

// ============================================
// ADMIN GALLERY MANAGEMENT
// ============================================

// Render gallery management list in admin
function renderAdminGalleryList() {
    const galleryList = document.getElementById('admin-gallery-list');
    if (!galleryList) return;
    
    const images = getGalleryImages();
    
    if (images.length === 0) {
        galleryList.innerHTML = '<p class="empty-message">No hay imágenes. Agrega nuevas imágenes.</p>';
        return;
    }
    
    galleryList.innerHTML = images.map((img, index) => {
        const safeId = toSafeId(img.id);
        const safeSrc = escapeHtml(img.src);
        const safeAlt = escapeHtml(img.alt);
        const safeDescription = escapeHtml(img.description || '');

        return `
        <div class="gallery-image-item" draggable="true" data-id="${safeId}">
            <div class="image-preview">
                <img src="${safeSrc}" alt="${safeAlt}">
            </div>
            <div class="image-details">
                <input type="text" 
                       placeholder="Texto alternativo (alt)" 
                       value="${safeAlt}" 
                       onchange="updateImageData(${safeId}, 'alt', this.value)">
                <textarea 
                    placeholder="Descripción de la imagen"
                    onchange="updateImageData(${safeId}, 'description', this.value)">${safeDescription}</textarea>
            </div>
            <div class="image-actions">
                <button class="btn btn-move-up" onclick="moveImage(${safeId}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover arriba">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button class="btn btn-move-down" onclick="moveImage(${safeId}, 1)" ${index === images.length - 1 ? 'disabled' : ''} title="Mover abajo">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
                <button class="btn btn-delete-image" onclick="deleteGalleryImage(${safeId})" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    }).join('');
    
    // Setup drag and drop
    setupGalleryDragAndDrop();
}

// Setup drag and drop for gallery images
function setupGalleryDragAndDrop() {
    const items = document.querySelectorAll('.gallery-image-item');
    let draggedItem = null;
    
    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
            renderAdminGalleryList();
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem && draggedItem !== this) {
                const images = getGalleryImages();
                const fromId = parseInt(draggedItem.dataset.id);
                const toId = parseInt(this.dataset.id);
                
                const fromIndex = images.findIndex(img => img.id === fromId);
                const toIndex = images.findIndex(img => img.id === toId);
                
                if (fromIndex !== -1 && toIndex !== -1) {
                    const [movedItem] = images.splice(fromIndex, 1);
                    images.splice(toIndex, 0, movedItem);
                    saveGalleryImages(images);
                    renderAdminGalleryList();
                }
            }
        });
    });
}

// Update image data (alt text or description)
function updateImageData(id, field, value) {
    const images = getGalleryImages();
    const index = images.findIndex(img => img.id === id);
    
    if (index !== -1) {
        images[index][field] = value;
        saveGalleryImages(images);
    }
}

// Move image up or down
function moveImage(id, direction) {
    const images = getGalleryImages();
    const index = images.findIndex(img => img.id === id);
    
    if (index !== -1) {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < images.length) {
            const [movedItem] = images.splice(index, 1);
            images.splice(newIndex, 0, movedItem);
            saveGalleryImages(images);
            renderAdminGalleryList();
        }
    }
}

// Delete image from gallery
function deleteGalleryImage(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen de la galería?')) {
        let images = getGalleryImages();
        images = images.filter(img => img.id !== id);
        saveGalleryImages(images);
        renderAdminGalleryList();
    }
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('La imagen es muy grande. El tamaño máximo es 10MB.');
        return;
    }
    
    // Check if already have 20 images
    const images = getGalleryImages();
    if (images.length >= 20) {
        alert('Has alcanzado el límite máximo de 20 imágenes.');
        return;
    }
    
    // Optimize and save image
    optimizeAndSaveImage(file);
}

// Optimize image before saving
function optimizeAndSaveImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimensions for optimization
            const maxWidth = 1920;
            const maxHeight = 1080;
            
            // Calculate new dimensions while maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get optimized image as base64
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Generate unique ID
            const newId = Date.now();
            
            // Save to localStorage as base64 (for demo purposes)
            // In production, you would upload to a server
            const images = getGalleryImages();
            images.push({
                id: newId,
                src: optimizedDataUrl,
                alt: file.name.replace(/\.[^/.]+$/, ''),
                description: ''
            });
            
            saveGalleryImages(images);
            renderAdminGalleryList();
            
            // Clear file input
            const fileInput = document.getElementById('gallery-image-input');
            if (fileInput) fileInput.value = '';
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Save gallery settings
function saveGalleryTransitionTime() {
    const transitionInput = document.getElementById('gallery-transition-time');
    const transitionTime = transitionInput ? (parseInt(transitionInput.value, 10) || 5000) : 5000;
    saveGallerySettings({ transitionTime: transitionTime });
}

// Preview gallery
function previewGallery() {
    const previewModal = document.createElement('div');
    previewModal.className = 'preview-modal active';
    previewModal.id = 'gallery-preview-modal';
    
    const images = getGalleryImages();
    const settings = getGallerySettings();
    
    previewModal.innerHTML = `
        <div class="preview-content">
            <button class="preview-close" onclick="closePreviewModal()">&times;</button>
            <div class="gallery-carousel" style="padding: 20px;">
                <div class="carousel-container" id="preview-carousel">
                    ${images.map((img, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}">
                            ${img.description ? `
                                <div class="carousel-content">
                                    <h3>${escapeHtml(img.alt)}</h3>
                                    <p>${escapeHtml(img.description)}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <button class="carousel-btn carousel-prev" onclick="previewPrevSlide()">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button class="carousel-btn carousel-next" onclick="previewNextSlide()">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div class="carousel-indicators" id="preview-indicators">
                    ${images.map((_, index) => `
                        <div class="carousel-indicator ${index === 0 ? 'active' : ''}" onclick="previewGoToSlide(${index})"></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewModal);
    
    // Start preview carousel
    let previewSlide = 0;
    window.previewCarouselInterval = setInterval(() => {
        previewSlide = (previewSlide + 1) % images.length;
        updatePreviewSlide(previewSlide);
    }, settings.transitionTime);
    
    window.previewGoToSlide = function(index) {
        previewSlide = index;
        updatePreviewSlide(index);
        clearInterval(window.previewCarouselInterval);
        window.previewCarouselInterval = setInterval(() => {
            previewSlide = (previewSlide + 1) % images.length;
            updatePreviewSlide(previewSlide);
        }, settings.transitionTime);
    };
    
    window.updatePreviewSlide = function(index) {
        const slides = previewModal.querySelectorAll('.carousel-slide');
        const indicators = previewModal.querySelectorAll('.carousel-indicator');
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
    };
    
    window.previewPrevSlide = function() {
        previewSlide = (previewSlide - 1 + images.length) % images.length;
        updatePreviewSlide(previewSlide);
        clearInterval(window.previewCarouselInterval);
        window.previewCarouselInterval = setInterval(() => {
            previewSlide = (previewSlide + 1) % images.length;
            updatePreviewSlide(previewSlide);
        }, settings.transitionTime);
    };
    
    window.previewNextSlide = function() {
        previewSlide = (previewSlide + 1) % images.length;
        updatePreviewSlide(previewSlide);
        clearInterval(window.previewCarouselInterval);
        window.previewCarouselInterval = setInterval(() => {
            previewSlide = (previewSlide + 1) % images.length;
            updatePreviewSlide(previewSlide);
        }, settings.transitionTime);
    };
    
    // Close on background click
    previewModal.addEventListener('click', function(e) {
        if (e.target === previewModal) {
            closePreviewModal();
        }
    });
}

// Close preview modal
function closePreviewModal() {
    const modal = document.getElementById('gallery-preview-modal');
    if (modal) {
        if (window.previewCarouselInterval) {
            clearInterval(window.previewCarouselInterval);
        }
        modal.remove();
    }
}

// Sincronización en vivo entre pestañas (admin <-> index)
let storageSyncTimer = null;
function syncFromStorageChange(changedKey) {
    if (storageSyncTimer) {
        clearTimeout(storageSyncTimer);
    }

    storageSyncTimer = setTimeout(() => {
        if (!changedKey || changedKey === 'news') {
            renderNews();
        }

        if (!changedKey || changedKey === 'projects') {
            renderProjects();
        }

        if (!changedKey || changedKey === 'services') {
            renderServices();
        }

        if (!changedKey || changedKey === 'galleryImages' || changedKey === 'gallerySettings') {
            renderGallery();
            renderTeacherGallery();
        }

        if (changedKey === 'theme') {
            const savedTheme = localStorage.getItem('theme');
            const isDark = savedTheme === 'dark';
            body.classList.toggle('dark-mode', isDark);
            updateThemeButton(isDark);
        }
    }, 120);
}

window.addEventListener('storage', function(event) {
    const syncedKeys = ['news', 'projects', 'services', 'galleryImages', 'gallerySettings', 'theme'];
    if (!event || !syncedKeys.includes(event.key)) {
        return;
    }

    syncFromStorageChange(event.key);
});

// Inicializar todo
document.addEventListener('DOMContentLoaded', function() {
    initializeNews();
    initializeProjects();
    initializeServices();
    renderNews();
    renderProjects();
    renderServices();
    updateAdminPanel();
    setupContactMessageCounter();
    
    // Initialize gallery
    initializeGallery();
    renderGallery();
    renderTeacherGallery();
    
    // Event listeners del admin
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const newsForm = document.getElementById('news-form');
    if (newsForm) {
        newsForm.addEventListener('submit', handleNewsSubmit);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const cancelEditBtn = document.getElementById('cancel-edit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', cancelEdit);
    }
});

// Theme Toggle (Dark/Light Mode)
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (themeToggle) {
        updateThemeButton(true);
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeButton(isDark);
    });
}

function updateThemeButton(isDark) {
    if (!themeToggle) {
        return;
    }
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('span');
    if (!icon || !text) {
        return;
    }
    if (isDark) {
        icon.className = 'fa-solid fa-sun';
        text.textContent = 'Modo Claro';
    } else {
        icon.className = 'fa-solid fa-moon';
        text.textContent = 'Modo Oscuro';
    }
}

// Smooth Scrolling
function showHomePanel(panelId, shouldScroll = false) {
    const targetPanel = document.getElementById(panelId);

    if (!targetPanel || !targetPanel.classList.contains('home-panel')) {
        return false;
    }

    document.querySelectorAll('.home-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    document.querySelectorAll('[data-home-panel-target]').forEach(button => {
        button.classList.toggle('active', button.dataset.homePanelTarget === panelId);
    });

    targetPanel.classList.add('active');

    if (shouldScroll) {
        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return true;
}

function scrollToSection(sectionId) {
    if (showHomePanel(sectionId, true)) {
        return;
    }

    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

document.querySelectorAll('[data-home-panel-target]').forEach(button => {
    button.addEventListener('click', () => {
        showHomePanel(button.dataset.homePanelTarget, true);
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').slice(1);

        if (!targetId) {
            return;
        }

        if (showHomePanel(targetId, true)) {
            return;
        }

        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Animate growth bars on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const growthBars = entry.target.querySelectorAll('.growth-fill');
            growthBars.forEach(bar => {
                const growth = bar.getAttribute('data-growth');
                bar.style.width = growth + '%';
            });
        }
    });
}, observerOptions);

const projectionsSection = document.querySelector('.projections');
if (projectionsSection) {
    observer.observe(projectionsSection);
}

// Chatbot functionality removed - now opens external AI tutor

// FAQ Accordion + filtros (búsqueda y categoría)
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            const q = item.querySelector('.faq-question');
            if (q) q.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
            faqItem.classList.add('active');
            question.setAttribute('aria-expanded', 'true');
        }
    });
});

// Welcome Pop-up (opcional: solo si existen los nodos en el HTML)
const welcomePopup = document.getElementById('welcomePopup');
const closePopup = document.getElementById('closePopup');
const dontShowAgain = document.getElementById('dontShowAgain');

function closeWelcomePopup() {
    if (!welcomePopup) {
        return;
    }
    welcomePopup.classList.remove('active');
    localStorage.setItem('welcomePopupShown', 'true');
    if (dontShowAgain && dontShowAgain.checked) {
        localStorage.setItem('popupDismissed', 'true');
    }
}

if (welcomePopup && closePopup) {
    window.addEventListener('load', () => {
        const popupShown = localStorage.getItem('welcomePopupShown');
        if (!popupShown) {
            setTimeout(() => {
                welcomePopup.classList.add('active');
                localStorage.setItem('welcomePopupShown', 'true');
            }, 1000);
        }
    });

    closePopup.addEventListener('click', closeWelcomePopup);

    welcomePopup.addEventListener('click', (e) => {
        if (e.target === welcomePopup) {
            closeWelcomePopup();
        }
    });
}

// Gaming Day Page
function openGamingDayPage() {
    window.open('https://pcbsystempr-cyber.github.io/Day-Gaming_Day-FinalA/', '_blank');
}

// Tech Service Page
function openTechServicePage() {
    window.open('https://hackerpcb1.github.io/Servicio-Tecnico/', '_blank');
}

// View Project Function
function viewProject(projectId) {
    // URLs de los proyectos - Agrega los enlaces reales aquí
    const projectUrls = {
        'casa-abierta': 'https://hackerpcb1.github.io/Casa-Abierta/',
        'gaming-day': 'https://hackerpcb3-byte.github.io/Gaming_Day_4/',
        'servicio-tecnico': 'https://hackerpcb1.github.io/Servicio-Tecnico/',
        'pablo-colon': '#', // Agregar URL cuando esté disponible
        'apoyo-socioemocional': '#' // Agregar URL cuando esté disponible
    };

    const url = projectUrls[projectId];

    if (url && url !== '#') {
        window.open(url, '_blank');
    } else {
        alert(`El proyecto "${projectId}" estará disponible pronto.\n\nNuestros estudiantes están trabajando en completar este proyecto.`);
    }
}

// Career Modal Functions
function openCareerModal(careerId) {
    const careerData = {
        'desarrollador-software': {
            title: 'Desarrollador de Software',
            icon: 'fa-laptop-code',
            description: 'Los desarrolladores de software son profesionales que diseñan, crean, prueban y mantienen aplicaciones y sistemas informáticos. Utilizan lenguajes de programación para resolver problemas y crear soluciones tecnológicas innovadoras.',
            responsibilities: [
                'Diseñar y desarrollar aplicaciones y sistemas de software',
                'Escribir código limpio, eficiente y bien documentado',
                'Realizar pruebas y depuración de aplicaciones',
                'Colaborar con equipos multidisciplinarios',
                'Mantener y actualizar sistemas existentes',
                'Implementar medidas de seguridad en el código'
            ],
            skills: [
                'Dominio de lenguajes de programación (Python, Java, JavaScript, C++)',
                'Conocimiento de bases de datos (SQL, NoSQL)',
                'Frameworks y librerías modernas',
                'Control de versiones (Git)',
                'Metodologías ágiles (Scrum, Kanban)',
                'Resolución de problemas y pensamiento lógico'
            ],
            salary: '$35,000 - $75,000 anuales en Puerto Rico (dependiendo de experiencia)',
            companies: [
                'Evertec - Líder en procesamiento de transacciones',
                'Popular - Banco Popular de Puerto Rico',
                'FirstBank - Servicios financieros',
                'Wovenware - Desarrollo de software y AI',
                'EVERTEC - Soluciones tecnológicas',
                'Gobierno de Puerto Rico - Diversos departamentos',
                'Empresas de telecomunicaciones (Claro, Liberty)',
                'Startups tecnológicas locales'
            ],
            growth: 'El campo de desarrollo de software tiene un crecimiento proyectado del 22% hasta 2030. Es una de las carreras más demandadas en Puerto Rico y el mundo.',
            preparation: 'En COMPUTEC aprenderás programación básica en lenguajes de alta demanda, lógica de programación, y desarrollo de proyectos reales que te prepararán para esta carrera.',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=desarrollador%20software&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=desarrollador+software' },
                { name: 'Empleos Gobierno PR', url: 'https://www.trabajo.pr.gov/' }
            ]
        },
        'soporte-informatico': {
            title: 'Técnico en Soporte Informático',
            icon: 'fa-headset',
            description: 'Los técnicos de soporte informático ayudan a usuarios y organizaciones a resolver problemas técnicos con computadoras, software y redes. Son la primera línea de ayuda en cualquier empresa.',
            responsibilities: [
                'Diagnosticar y resolver problemas técnicos',
                'Instalar y configurar hardware y software',
                'Proporcionar asistencia técnica a usuarios',
                'Mantener documentación de problemas y soluciones',
                'Realizar mantenimiento preventivo de equipos',
                'Capacitar a usuarios en el uso de tecnología'
            ],
            skills: [
                'Conocimiento de sistemas operativos (Windows, macOS, Linux)',
                'Resolución de problemas de hardware y software',
                'Redes básicas y conectividad',
                'Excelentes habilidades de comunicación',
                'Paciencia y servicio al cliente',
                'Herramientas de diagnóstico y reparación'
            ],
            salary: '$25,000 - $45,000 anuales en Puerto Rico',
            companies: [
                'Hospitales y centros médicos',
                'Instituciones educativas',
                'Bancos y cooperativas',
                'Empresas de retail (Walmart, Costco)',
                'Gobierno de Puerto Rico',
                'Empresas de manufactura',
                'Hoteles y resorts',
                'Compañías de seguros'
            ],
            growth: 'Demanda constante con crecimiento del 9% proyectado. Cada empresa necesita soporte técnico.',
            preparation: 'COMPUTEC te especializa en diagnóstico, reparación y mantenimiento de computadoras, además de resolución de problemas tecnológicos.',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=soporte%20tecnico&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=soporte+informatico' },
                { name: 'Clasificados Online', url: 'https://www.clasificadosonline.com/empleos.asp' }
            ]
        },
        'administrador-redes': {
            title: 'Administrador de Redes',
            icon: 'fa-network-wired',
            description: 'Los administradores de redes diseñan, implementan y mantienen las redes de comunicación de una organización, asegurando conectividad confiable y segura.',
            responsibilities: [
                'Configurar y mantener routers, switches y firewalls',
                'Monitorear el rendimiento de la red',
                'Implementar medidas de seguridad de red',
                'Resolver problemas de conectividad',
                'Planificar expansiones de red',
                'Gestionar servidores y servicios de red'
            ],
            skills: [
                'Protocolos de red (TCP/IP, DNS, DHCP)',
                'Configuración de equipos Cisco/Juniper',
                'Seguridad de redes',
                'Virtualización y cloud computing',
                'Monitoreo de redes',
                'Certificaciones (CCNA, Network+)'
            ],
            salary: '$30,000 - $60,000 anuales en Puerto Rico',
            companies: [
                'Empresas de telecomunicaciones',
                'Instituciones financieras',
                'Gobierno de Puerto Rico',
                'Hospitales y sistemas de salud',
                'Universidades',
                'Empresas de manufactura',
                'Centros de datos',
                'Proveedores de servicios IT'
            ],
            growth: 'Crecimiento del 5% con demanda constante en infraestructura de red.',
            preparation: 'En COMPUTEC aprendes administración de redes, configuración de equipos y resolución de problemas de conectividad.',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=administrador%20redes&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=administrador+redes' },
                { name: 'Empleos Gobierno PR', url: 'https://www.trabajo.pr.gov/' }
            ]
        },
        'ciberseguridad': {
            title: 'Especialista en Ciberseguridad',
            icon: 'fa-user-shield',
            description: 'Los especialistas en ciberseguridad protegen sistemas, redes y datos de amenazas cibernéticas. Son guardianes digitales que previenen ataques y responden a incidentes de seguridad.',
            responsibilities: [
                'Monitorear sistemas en busca de amenazas',
                'Implementar medidas de seguridad',
                'Realizar auditorías de seguridad',
                'Responder a incidentes de seguridad',
                'Educar a empleados sobre seguridad',
                'Mantener políticas de seguridad actualizadas'
            ],
            skills: [
                'Conocimiento de amenazas y vulnerabilidades',
                'Herramientas de seguridad (firewalls, antivirus, IDS/IPS)',
                'Análisis de riesgos',
                'Ethical hacking y pentesting',
                'Cumplimiento normativo (HIPAA, PCI-DSS)',
                'Certificaciones (Security+, CEH, CISSP)'
            ],
            salary: '$40,000 - $80,000 anuales en Puerto Rico',
            companies: [
                'Bancos y instituciones financieras',
                'Empresas de seguros',
                'Hospitales y sistemas de salud',
                'Gobierno de Puerto Rico',
                'Evertec y procesadores de pagos',
                'Empresas de telecomunicaciones',
                'Consultoras de seguridad',
                'Empresas farmacéuticas'
            ],
            growth: 'Crecimiento explosivo del 33% proyectado. Una de las carreras más demandadas actualmente.',
            preparation: 'COMPUTEC te enseña fundamentos de ciberseguridad, ingeniería social, y prácticas de seguridad informática.',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=ciberseguridad&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=ciberseguridad' },
                { name: 'CyberSeek', url: 'https://www.cyberseek.org/index.html' }
            ]
        },
        'desarrollador-web': {
            title: 'Desarrollador Web',
            icon: 'fa-globe',
            description: 'Los desarrolladores web crean y mantienen sitios web y aplicaciones web. Combinan diseño, programación y experiencia de usuario para crear presencias digitales efectivas.',
            responsibilities: [
                'Diseñar y desarrollar sitios web responsivos',
                'Crear interfaces de usuario atractivas',
                'Desarrollar funcionalidades backend',
                'Optimizar rendimiento y SEO',
                'Integrar APIs y servicios externos',
                'Mantener y actualizar sitios existentes'
            ],
            skills: [
                'HTML5, CSS3, JavaScript',
                'Frameworks (React, Vue, Angular)',
                'Backend (Node.js, PHP, Python)',
                'Bases de datos',
                'Diseño responsivo',
                'Control de versiones (Git)'
            ],
            salary: '$30,000 - $65,000 anuales en Puerto Rico',
            companies: [
                'Agencias de marketing digital',
                'Empresas de e-commerce',
                'Startups tecnológicas',
                'Departamentos de IT corporativos',
                'Freelance y trabajo remoto',
                'Empresas de medios',
                'Instituciones educativas',
                'Gobierno de Puerto Rico'
            ],
            growth: 'Crecimiento del 13% con alta demanda de presencia digital.',
            preparation: 'En COMPUTEC aprendes programación web, HTML, CSS, JavaScript y desarrollo de proyectos web reales.',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=desarrollador%20web&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=desarrollador+web' },
                { name: 'Remote OK', url: 'https://remoteok.com/remote-web-developer-jobs' }
            ]
        },
        'programador-aplicaciones': {
            title: 'Programador de Aplicaciones',
            icon: 'fa-mobile-alt',
            description: 'Los programadores de aplicaciones desarrollan software para dispositivos móviles y de escritorio, creando apps que millones de personas usan diariamente.',
            responsibilities: [
                'Desarrollar aplicaciones móviles (iOS/Android)',
                'Crear aplicaciones de escritorio',
                'Diseñar interfaces intuitivas',
                'Integrar servicios en la nube',
                'Realizar pruebas de calidad',
                'Publicar y mantener apps en tiendas'
            ],
            skills: [
                'Desarrollo móvil (Swift, Kotlin, React Native)',
                'Desarrollo de escritorio (C#, Java, Electron)',
                'UI/UX design',
                'APIs y servicios web',
                'Bases de datos móviles',
                'Publicación en App Store/Play Store'
            ],
            salary: '$35,000 - $70,000 anuales en Puerto Rico',
            companies: [
                'Empresas de desarrollo de apps',
                'Startups tecnológicas',
                'Bancos (apps bancarias)',
                'Empresas de retail',
                'Agencias digitales',
                'Empresas de entretenimiento',
                'Servicios de delivery',
                'Trabajo remoto internacional'
            ],
            growth: 'Crecimiento del 22% con explosión de apps móviles.',
            preparation: 'COMPUTEC te enseña programación en lenguajes modernos y desarrollo de aplicaciones prácticas.',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=programador%20aplicaciones&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=programador+aplicaciones' },
                { name: 'AngelList', url: 'https://angel.co/jobs' }
            ]
        },
        'tecnico-mantenimiento': {
            title: 'Técnico en Mantenimiento',
            icon: 'fa-wrench',
            description: 'Los técnicos en mantenimiento se especializan en reparación física de computadoras, instalación de componentes y mantenimiento preventivo de equipos tecnológicos.',
            responsibilities: [
                'Diagnosticar fallas de hardware',
                'Reparar y reemplazar componentes',
                'Realizar mantenimiento preventivo',
                'Instalar y configurar equipos nuevos',
                'Recuperar datos de discos dañados',
                'Limpiar y optimizar equipos'
            ],
            skills: [
                'Conocimiento de componentes de hardware',
                'Herramientas de diagnóstico',
                'Soldadura y reparación electrónica',
                'Instalación de sistemas operativos',
                'Recuperación de datos',
                'Atención al cliente'
            ],
            salary: '$24,000 - $42,000 anuales en Puerto Rico',
            companies: [
                'Tiendas de reparación de computadoras',
                'Best Buy y retailers tecnológicos',
                'Escuelas y universidades',
                'Hospitales',
                'Empresas de manufactura',
                'Gobierno de Puerto Rico',
                'Negocio propio/freelance',
                'Empresas de servicios IT'
            ],
            growth: 'Demanda estable con necesidad constante de reparaciones.',
            preparation: 'COMPUTEC se especializa en diagnóstico, reparación y mantenimiento de computadoras - ¡es nuestro enfoque principal!',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=tecnico%20mantenimiento&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=tecnico+mantenimiento' },
                { name: 'Clasificados Online', url: 'https://www.clasificadosonline.com/empleos.asp' }
            ]
        },
        'analista-sistemas': {
            title: 'Analista de Sistemas',
            icon: 'fa-chart-line',
            description: 'Los analistas de sistemas estudian los procesos de negocio y diseñan soluciones tecnológicas para mejorar la eficiencia organizacional.',
            responsibilities: [
                'Analizar necesidades de negocio',
                'Diseñar soluciones tecnológicas',
                'Documentar requisitos de sistemas',
                'Coordinar con desarrolladores',
                'Realizar pruebas de sistemas',
                'Capacitar usuarios finales'
            ],
            skills: [
                'Análisis de procesos de negocio',
                'Modelado de sistemas',
                'Documentación técnica',
                'Gestión de proyectos',
                'Comunicación efectiva',
                'Conocimiento de bases de datos y software empresarial'
            ],
            salary: '$32,000 - $60,000 anuales en Puerto Rico',
            companies: [
                'Bancos y cooperativas',
                'Empresas de seguros',
                'Gobierno de Puerto Rico',
                'Hospitales',
                'Empresas de manufactura',
                'Consultoras IT',
                'Universidades',
                'Empresas de retail'
            ],
            growth: 'Crecimiento del 9% con demanda en transformación digital.',
            preparation: 'COMPUTEC te enseña a analizar problemas tecnológicos, diseñar soluciones y trabajar con sistemas informáticos.',
            jobLinks: [
                { name: 'LinkedIn Jobs PR', url: 'https://www.linkedin.com/jobs/search/?keywords=analista%20sistemas&location=Puerto%20Rico' },
                { name: 'Indeed Puerto Rico', url: 'https://pr.indeed.com/jobs?q=analista+sistemas' },
                { name: 'Empleos Gobierno PR', url: 'https://www.trabajo.pr.gov/' }
            ]
        }
    };
    const career = careerData[careerId];
    if (!career) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="career-header">
            <i class="fa-solid ${career.icon} career-icon"></i>
            <h2>${career.title}</h2>
        </div>

        <div class="career-section">
            <h3><i class="fa-solid fa-info-circle"></i> ¿Qué es?</h3>
            <p>${career.description}</p>
        </div>

        <div class="career-section">
            <h3><i class="fa-solid fa-tasks"></i> Responsabilidades</h3>
            <ul class="career-list">
                ${career.responsibilities.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>

        <div class="career-section">
            <h3><i class="fa-solid fa-star"></i> Habilidades Requeridas</h3>
            <ul class="career-list">
                ${career.skills.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>

        <div class="career-section salary-section">
            <h3><i class="fa-solid fa-dollar-sign"></i> Salario Promedio</h3>
            <p class="salary-info">${career.salary}</p>
        </div>

        <div class="career-section">
            <h3><i class="fa-solid fa-building"></i> Empresas que Contratan en Puerto Rico</h3>
            <ul class="companies-list">
                ${career.companies.map(company => `<li><i class="fa-solid fa-check-circle"></i> ${company}</li>`).join('')}
            </ul>
        </div>

        <div class="career-section">
            <h3><i class="fa-solid fa-chart-line"></i> Proyección de Crecimiento</h3>
            <p>${career.growth}</p>
        </div>

        <div class="career-section computec-section">
            <h3><i class="fa-solid fa-graduation-cap"></i> Cómo COMPUTEC te Prepara</h3>
            <p>${career.preparation}</p>
        </div>

        <div class="career-section">
            <h3><i class="fa-solid fa-search"></i> Buscar Empleos</h3>
            <div class="job-links">
                ${career.jobLinks.map(link => `
                    <a href="${link.url}" target="_blank" class="job-link-btn">
                        <i class="fa-solid fa-external-link-alt"></i> ${link.name}
                    </a>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('careerModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCareerModal() {
    document.getElementById('careerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('careerModal');
    if (event.target === modal) {
        closeCareerModal();
    }
}

// Contact Form Functions
function submitContactForm(event) {
    event.preventDefault();

    const form = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    // Get form values
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const newsletter = document.getElementById('contactNewsletter').checked;

    // Validate required fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name) {
        document.getElementById('contactName').focus();
        return;
    }
    if (!email || !emailRegex.test(email)) {
        document.getElementById('contactEmail').focus();
        return;
    }
    if (!subject) {
        document.getElementById('contactSubject').focus();
        return;
    }
    if (!message) {
        document.getElementById('contactMessage').focus();
        return;
    }

    // Hide form and show success message
    form.style.display = 'none';
    formSuccess.style.display = 'block';
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetContactForm() {
    const form = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    form.reset();
    updateMessageCounter();

    form.style.display = '';
    formSuccess.style.display = 'none';
}

function updateMessageCounter() {
    const textarea = document.getElementById('contactMessage');
    const counter = document.getElementById('messageCounter');
    if (!textarea || !counter) return;
    const len = textarea.value.length;
    const max = parseInt(textarea.getAttribute('maxlength'), 10) || 500;
    counter.textContent = len + ' / ' + max;
    counter.classList.toggle('near-limit', len >= max * 0.8 && len < max);
    counter.classList.toggle('at-limit', len >= max);
}

function setupContactMessageCounter() {
    const textarea = document.getElementById('contactMessage');
    if (!textarea) return;
    textarea.addEventListener('input', updateMessageCounter);
    updateMessageCounter();
}

// Tech Service Form - Ya no se usa, redirige a página externa
// const techServiceForm = document.getElementById('techServiceForm');
// if (techServiceForm) {
//     techServiceForm.addEventListener('submit', (e) => {
//         e.preventDefault();
//         const teacherName = document.getElementById('teacherName').value;
//         const serviceType = document.getElementById('serviceType').value;
//         const priority = document.getElementById('priority').value;
//
//         alert(`¡Solicitud recibida!\n\nMaestro: ${teacherName}\nServicio: ${serviceType}\nPrioridad: ${priority}\n\nNos pondremos en contacto contigo pronto para atender tu solicitud.`);
//         techServiceForm.reset();
//     });
// }

// Smooth scroll animation for all sections
const sections = document.querySelectorAll('section');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    sectionObserver.observe(section);
});

// Tour Guiado
let currentTourStep = 0;
const tourSteps = [
    {
        element: '#sobre-nosotros',
        title: '📚 Sobre COMPUTEC',
        description: 'Conoce nuestro programa especializado en tecnología, diagnóstico y reparación de computadoras.'
    },
    {
        element: '#cursos',
        title: '💻 Nuestros Cursos',
        description: 'Explora los 10 cursos principales que ofrecemos: desde programación hasta ciberseguridad y realidad virtual.'
    },
    {
        element: '#proyectos',
        title: '🚀 Proyectos Estudiantiles',
        description: 'Descubre los increíbles proyectos web creados por nuestros estudiantes de COMPUTEC.'
    },
    {
        element: '.employment-opportunities',
        title: '💼 Oportunidades de Empleo',
        description: 'Conoce las carreras disponibles para nuestros graduados. Haz clic en cualquiera para ver detalles completos.'
    },
    {
        element: '#contacto',
        title: '📧 Contáctanos',
        description: '¿Tienes preguntas? Aquí puedes enviarnos un mensaje o encontrar nuestra información de contacto.'
    }
];

function startTour() {
    closeWelcomePopup();
    currentTourStep = 0;
    document.getElementById('tourOverlay').style.display = 'block';
    showTourStep();
}

function showTourStep() {
    if (currentTourStep >= tourSteps.length) {
        endTour();
        return;
    }

    const step = tourSteps[currentTourStep];
    const element = document.querySelector(step.element);

    if (!element) {
        nextTourStep();
        return;
    }

    // Scroll to element
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update tooltip content
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourDescription').textContent = step.description;
    document.getElementById('tourStep').textContent = `Paso ${currentTourStep + 1} de ${tourSteps.length}`;

    // Position tooltip
    setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const tooltip = document.querySelector('.tour-tooltip');
        const spotlight = document.querySelector('.tour-spotlight');

        // Position spotlight
        spotlight.style.top = `${rect.top + window.scrollY - 20}px`;
        spotlight.style.left = `${rect.left - 20}px`;
        spotlight.style.width = `${rect.width + 40}px`;
        spotlight.style.height = `${rect.height + 40}px`;

        // Position tooltip
        const tooltipTop = rect.bottom + window.scrollY + 20;
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';

        // Show elements
        spotlight.style.opacity = '1';
        tooltip.style.opacity = '1';
    }, 500);
}

function nextTourStep() {
    currentTourStep++;
    if (currentTourStep < tourSteps.length) {
        showTourStep();
    } else {
        endTour();
    }
}

function skipTour() {
    endTour();
}

function endTour() {
    const overlay = document.getElementById('tourOverlay');
    overlay.style.display = 'none';
    document.querySelector('.tour-spotlight').style.opacity = '0';
    document.querySelector('.tour-tooltip').style.opacity = '0';
    currentTourStep = 0;
}


