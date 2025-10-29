// index.js - Funcionalidad de la página principal

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarProductosDestacados();
    actualizarContadorCarrito();
    configurarAnimaciones();
});

// ============================================
// CARGAR PRODUCTOS DESTACADOS
// ============================================
function cargarProductosDestacados() {
    const carousel = document.getElementById('featured-carousel');
    if (!carousel) return;
    
    // Obtener todos los productos
    const todosLosProductos = obtenerProductos();
    
    // Filtrar productos destacados o tomar los primeros 6
    let productosDestacados = todosLosProductos.filter(p => p.destacado);
    
    // Si no hay suficientes destacados, complementar con los más nuevos
    if (productosDestacados.length < 6) {
        const nuevos = todosLosProductos
            .filter(p => p.nuevo && !productosDestacados.includes(p))
            .slice(0, 6 - productosDestacados.length);
        productosDestacados = [...productosDestacados, ...nuevos];
    }
    
    // Si aún no hay suficientes, tomar los primeros
    if (productosDestacados.length < 6) {
        productosDestacados = todosLosProductos.slice(0, 6);
    }
    
    // Limpiar carousel
    carousel.innerHTML = '';
    
    // Renderizar cada producto
    productosDestacados.forEach(producto => {
        const card = crearTarjetaProductoHome(producto);
        carousel.appendChild(card);
    });
}

function crearTarjetaProductoHome(producto) {
    const card = document.createElement('a');
    card.href = 'catalogo.html';
    card.className = 'product-card-home';
    
    // Obtener precio (puede ser de variante o precio directo)
    let precio = producto.precio;
    let precioOriginal = producto.precioOriginal;
    
    if (producto.variantes && producto.variantes.length > 0) {
        precio = producto.variantes[0].precio;
        precioOriginal = producto.variantes[0].precioOriginal;
    }
    
    // Construir HTML
    card.innerHTML = `
        <div class="product-image-home">
            <img src="${producto.imagenes[0]}" alt="${producto.nombre}">
            ${producto.oferta ? '<span class="product-badge">OFERTA</span>' : ''}
            ${producto.nuevo && !producto.oferta ? '<span class="product-badge" style="background: var(--secondary)">NUEVO</span>' : ''}
        </div>
        <div class="product-info-home">
            <h3 class="product-name-home">${producto.nombre}</h3>
            <div class="product-price-home">
                Bs. ${precio}
                ${precioOriginal ? `<small style="text-decoration: line-through; color: var(--text-light); font-size: 16px; margin-left: 8px;">Bs. ${precioOriginal}</small>` : ''}
            </div>
            <button class="product-btn-home" onclick="event.preventDefault(); agregarDesdeHome(${producto.id})">
                <i class="fas fa-shopping-cart"></i> Añadir al carrito
            </button>
        </div>
    `;
    
    return card;
}

// ============================================
// AGREGAR AL CARRITO DESDE HOME
// ============================================
function agregarDesdeHome(productoId) {
    const producto = obtenerProductoPorId(productoId);
    if (!producto) return;
    
    // Obtener carrito
    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    // Determinar variante (si existe, usar la primera)
    let varianteId = null;
    if (producto.variantes && producto.variantes.length > 0) {
        varianteId = producto.variantes[0].id;
    }
    
    // Verificar si ya existe en el carrito
    const existente = carrito.find(item => 
        item.productoId === productoId && item.varianteId === varianteId
    );
    
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            productoId: productoId,
            cantidad: 1,
            varianteId: varianteId
        });
    }
    
    // Guardar carrito
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Actualizar contador
    actualizarContadorCarrito();
    
    // Mostrar notificación
    let nombreProducto = producto.nombre;
    if (varianteId && producto.variantes) {
        const variante = producto.variantes.find(v => v.id === varianteId);
        if (variante) {
            nombreProducto += ` - ${variante.tamaño}`;
        }
    }
    
    mostrarToast(`✅ ${nombreProducto} añadido al carrito`);
}

// ============================================
// ACTUALIZAR CONTADOR DEL CARRITO
// ============================================
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    document.querySelectorAll('.cart-count, .bottom-cart-count').forEach(element => {
        element.textContent = total;
        if (total > 0) {
            element.classList.add('show');
            element.style.display = 'block';
        } else {
            element.classList.remove('show');
            element.style.display = 'none';
        }
    });
}

// ============================================
// NOTIFICACIONES
// ============================================
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = mensaje;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// ANIMACIONES AL SCROLL
// ============================================
function configurarAnimaciones() {
    // Intersection Observer para animaciones
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observar elementos
    document.querySelectorAll('.category-card, .feature-card, .testimonial-card, .product-card-home').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.5s ease';
        observer.observe(el);
    });
    
    // Animación de números en stats
    animarStats();
}

function animarStats() {
    const stats = document.querySelectorAll('.stat-number');
    
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 50;
        const isDecimal = stat.textContent.includes('.');
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = isDecimal ? target.toFixed(1) : target;
                clearInterval(timer);
            } else {
                stat.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
            }
        }, 30);
    });
}

// ============================================
// SCROLL SUAVE
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// LAZY LOADING DE IMÁGENES
// ============================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// MANEJO DE ERRORES EN IMÁGENES
// ============================================
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
    }
}, true);

// ============================================
// PERFORMANCE: Prevenir múltiples clics
// ============================================
let isProcessing = false;

document.addEventListener('click', (e) => {
    if (e.target.closest('.product-btn-home') && isProcessing) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
});

// ============================================
// DETECTAR MODO OSCURO DEL SISTEMA (OPCIONAL)
// ============================================
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // El usuario prefiere modo oscuro
    // Aquí podrías aplicar estilos especiales si quisieras
    console.log('Modo oscuro detectado');
}

// ============================================
// EVENTOS DE VISIBILIDAD
// ============================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Página no visible
        console.log('Usuario salió de la página');
    } else {
        // Página visible nuevamente
        console.log('Usuario volvió a la página');
        actualizarContadorCarrito();
    }
});