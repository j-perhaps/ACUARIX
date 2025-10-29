// catalogo.js - Funcionalidad principal del catálogo

// ============================================
// VARIABLES GLOBALES
// ============================================
let productos = []; // Array para almacenar productos del JSON
let productosFiltrados = [];
let categoriaActual = 'todos';
let ordenActual = 'popular';
let precioMin = 0;
let precioMax = 2000;
let soloStock = true;
let soloOfertas = false;
let paginaActual = 1;
let productosPorPagina = 12;
let productoModalActual = null;
let varianteSeleccionada = null;

// ============================================
// CARGAR DATOS DEL JSON
// ============================================
async function cargarProductos() {
    try {
        const response = await fetch('js/productos.json');
        const data = await response.json();
        productos = data.productos;
        console.log('✅ Productos cargados:', productos.length);
        return true;
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        return false;
    }
}

// ============================================
// FUNCIONES AUXILIARES (antes estaban en productos.js)
// ============================================
function obtenerProductos() {
    return productos;
}

function obtenerProductoPorId(id) {
    return productos.find(p => p.id === id);
}

function filtrarPorCategoria(categoria) {
    if (categoria === 'todos') return productos;
    return productos.filter(p => p.categoria === categoria);
}

function contarPorCategoria() {
    const conteo = {
        todos: productos.length,
        acuarios: 0,
        filtros: 0,
        iluminacion: 0,
        decoracion: 0,
        plantas: 0,
        alimento: 0,
        accesorios: 0,
        mantenimiento: 0
    };
    
    productos.forEach(p => {
        if (conteo.hasOwnProperty(p.categoria)) {
            conteo[p.categoria]++;
        }
    });
    
    return conteo;
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Primero cargar los productos del JSON
    const cargado = await cargarProductos();
    
    if (!cargado) {
        mostrarNotificacion('⚠️ Error al cargar los productos. Por favor recarga la página.');
        return;
    }
    
    // Luego inicializar el catálogo
    inicializarCatalogo();
    configurarEventos();
    actualizarContadorCarrito();
});

function inicializarCatalogo() {
    // Actualizar contadores de categorías
    const conteo = contarPorCategoria();
    Object.keys(conteo).forEach(cat => {
        const elemento = document.getElementById(`count-${cat}`);
        if (elemento) {
            elemento.textContent = conteo[cat];
        }
    });
    
    // Cargar productos
    aplicarFiltros();
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================
function configurarEventos() {
    // Categorías
    document.querySelectorAll('[data-category]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarCategoria(e.currentTarget.dataset.category);
        });
    });
    
    // Búsqueda
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            realizarBusqueda();
        });
    }
    
    // Filtros de precio
    const minSlider = document.getElementById('price-min-slider');
    const maxSlider = document.getElementById('price-max-slider');
    const minInput = document.getElementById('min-price');
    const maxInput = document.getElementById('max-price');
    const applyBtn = document.getElementById('apply-filter');
    
    if (minSlider && maxSlider) {
        minSlider.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            if (value >= parseInt(maxSlider.value)) {
                value = parseInt(maxSlider.value) - 10;
                e.target.value = value;
            }
            minInput.value = value;
            actualizarBarraPrecio();
        });
        
        maxSlider.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            if (value <= parseInt(minSlider.value)) {
                value = parseInt(minSlider.value) + 10;
                e.target.value = value;
            }
            maxInput.value = value;
            actualizarBarraPrecio();
        });
        
        minInput.addEventListener('input', (e) => {
            minSlider.value = e.target.value;
            actualizarBarraPrecio();
        });
        
        maxInput.addEventListener('input', (e) => {
            maxSlider.value = e.target.value;
            actualizarBarraPrecio();
        });
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            precioMin = parseInt(minInput.value);
            precioMax = parseInt(maxInput.value);
            aplicarFiltros();
        });
    }
    
    // Filtros de disponibilidad
    const stockCheck = document.getElementById('filter-stock');
    const offerCheck = document.getElementById('filter-offer');
    
    if (stockCheck) {
        stockCheck.addEventListener('change', (e) => {
            soloStock = e.target.checked;
            aplicarFiltros();
        });
    }
    
    if (offerCheck) {
        offerCheck.addEventListener('change', (e) => {
            soloOfertas = e.target.checked;
            aplicarFiltros();
        });
    }
    
    // Ordenamiento
    const sortSelect = document.getElementById('sort-products');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            ordenActual = e.target.value;
            aplicarFiltros();
        });
    }
    
    // Vista de productos
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const vista = e.currentTarget.dataset.view;
            cambiarVista(vista);
        });
    });
    
    // Items por página
    const itemsSelect = document.getElementById('items-per-page');
    if (itemsSelect) {
        itemsSelect.addEventListener('change', (e) => {
            productosPorPagina = parseInt(e.target.value);
            paginaActual = 1;
            mostrarProductos();
        });
    }
    
    // Sidebar mobile
    const filterToggle = document.querySelector('.filter-toggle');
    const sidebarClose = document.querySelector('.sidebar-close');
    const sidebar = document.querySelector('.catalog-sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (filterToggle) {
        filterToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Menú de navegación móvil (hamburguesa)
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const navCategories = document.getElementById('nav-categories');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navCategories.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', (e) => {
            e.stopPropagation();
            navCategories.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Click en overlay para cerrar
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            navCategories?.classList.remove('active');
            sidebar?.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Cerrar menú al hacer click en un enlace
    if (navCategories) {
        navCategories.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navCategories.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    // Modal
    const modal = document.getElementById('quick-view-modal');
    const modalClose = document.getElementById('modal-close');
    const modalOverlay = modal?.querySelector('.modal-overlay');
    
    if (modalClose) {
        modalClose.addEventListener('click', cerrarModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', cerrarModal);
    }
    
    // Reset filters
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetearFiltros);
    }
    
    // Back to top
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================
function cambiarCategoria(categoria) {
    categoriaActual = categoria;
    
    // Actualizar UI
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-category="${categoria}"]`)?.parentElement?.classList.add('active');
    
    // Cerrar sidebar en mobile
    document.querySelector('.catalog-sidebar')?.classList.remove('active');
    
    aplicarFiltros();
}

function realizarBusqueda() {
    const searchInput = document.getElementById('search-input');
    const termino = searchInput.value.toLowerCase().trim();
    
    if (!termino) {
        aplicarFiltros();
        return;
    }
    
    const todos = obtenerProductos();
    productosFiltrados = todos.filter(p => 
        p.nombre.toLowerCase().includes(termino) ||
        p.descripcion.toLowerCase().includes(termino) ||
        p.categoria.toLowerCase().includes(termino)
    );
    
    ordenarProductos();
    paginaActual = 1;
    mostrarProductos();
}

function aplicarFiltros() {
    let productosTemp = filtrarPorCategoria(categoriaActual);
    
    // Filtrar por precio
    productosTemp = productosTemp.filter(p => {
        const precio = obtenerPrecioProducto(p);
        return precio >= precioMin && precio <= precioMax;
    });
    
    // Filtrar por stock
    if (soloStock) {
        productosTemp = productosTemp.filter(p => p.stock > 0);
    }
    
    // Filtrar por ofertas
    if (soloOfertas) {
        productosTemp = productosTemp.filter(p => p.oferta);
    }
    
    productosFiltrados = productosTemp;
    ordenarProductos();
    paginaActual = 1;
    mostrarProductos();
}

function ordenarProductos() {
    switch (ordenActual) {
        case 'price-low':
            productosFiltrados.sort((a, b) => obtenerPrecioProducto(a) - obtenerPrecioProducto(b));
            break;
        case 'price-high':
            productosFiltrados.sort((a, b) => obtenerPrecioProducto(b) - obtenerPrecioProducto(a));
            break;
        case 'name-asc':
            productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'name-desc':
            productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
        case 'newest':
            productosFiltrados.sort((a, b) => (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0));
            break;
        default: // popular
            productosFiltrados.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    }
}

function obtenerPrecioProducto(producto) {
    if (producto.variantes && producto.variantes.length > 0) {
        return producto.variantes[0].precio;
    }
    return producto.precio || 0;
}

function resetearFiltros() {
    categoriaActual = 'todos';
    precioMin = 0;
    precioMax = 2000;
    soloStock = true;
    soloOfertas = false;
    ordenActual = 'popular';
    
    document.getElementById('min-price').value = 0;
    document.getElementById('max-price').value = 2000;
    document.getElementById('price-min-slider').value = 0;
    document.getElementById('price-max-slider').value = 2000;
    document.getElementById('filter-stock').checked = true;
    document.getElementById('filter-offer').checked = false;
    document.getElementById('sort-products').value = 'popular';
    document.getElementById('search-input').value = '';
    
    actualizarBarraPrecio();
    aplicarFiltros();
}

function actualizarBarraPrecio() {
    const track = document.querySelector('.range-track');
    const minSlider = document.getElementById('price-min-slider');
    const maxSlider = document.getElementById('price-max-slider');
    
    if (track && minSlider && maxSlider) {
        const min = parseInt(minSlider.min);
        const max = parseInt(minSlider.max);
        const minVal = parseInt(minSlider.value);
        const maxVal = parseInt(maxSlider.value);
        
        const percentMin = ((minVal - min) / (max - min)) * 100;
        const percentMax = ((maxVal - min) / (max - min)) * 100;
        
        track.style.left = percentMin + '%';
        track.style.width = (percentMax - percentMin) + '%';
    }
}

// ============================================
// MOSTRAR PRODUCTOS
// ============================================
function mostrarProductos() {
    const container = document.getElementById('products-container');
    const emptyState = document.getElementById('empty-state');
    const paginationWrapper = document.getElementById('pagination-wrapper');
    
    if (!container) return;
    
    // Calcular paginación
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosAPaginar = productosFiltrados.slice(inicio, fin);
    
    // Actualizar contadores
    document.getElementById('showing-count').textContent = productosAPaginar.length;
    document.getElementById('total-count').textContent = productosFiltrados.length;
    
    // Verificar si hay productos
    if (productosFiltrados.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        paginationWrapper.style.display = 'none';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    paginationWrapper.style.display = productosFiltrados.length > productosPorPagina ? 'flex' : 'none';
    
    // Limpiar container
    container.innerHTML = '';
    
    // Crear tarjetas de productos
    productosAPaginar.forEach(producto => {
        const card = crearTarjetaProducto(producto);
        container.appendChild(card);
    });
    
    // Actualizar paginación
    actualizarPaginacion();
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function crearTarjetaProducto(producto) {
    const template = document.getElementById('product-template');
    const card = template.content.cloneNode(true);
    
    const productCard = card.querySelector('.product-card');
    
    // Badges
    const badgesContainer = card.querySelector('.product-badges');
    badgesContainer.innerHTML = '';
    if (producto.nuevo) {
        badgesContainer.innerHTML += '<span class="badge new">Nuevo</span>';
    }
    if (producto.oferta) {
        badgesContainer.innerHTML += '<span class="badge offer">Oferta</span>';
    }
    if (producto.destacado) {
        badgesContainer.innerHTML += '<span class="badge featured">Destacado</span>';
    }
    
    // Imagen principal
    const img = card.querySelector('.product-img');
    img.src = producto.imagenes[0];
    img.alt = producto.nombre;
    
    // Miniaturas de imágenes si hay más de una
    const thumbnailsContainer = card.querySelector('.image-thumbnails');
    if (producto.imagenes.length > 1) {
        producto.imagenes.forEach((_, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'thumb' + (index === 0 ? ' active' : '');
            thumb.dataset.index = index;
            thumbnailsContainer.appendChild(thumb);
        });
        
        // Event listeners para cambiar imagen
        thumbnailsContainer.querySelectorAll('.thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                img.src = producto.imagenes[index];
                thumbnailsContainer.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
    
    // Información del producto
    card.querySelector('.product-category').textContent = producto.categoria.toUpperCase();
    card.querySelector('.product-title a').textContent = producto.nombre;
    card.querySelector('.product-description').textContent = producto.descripcion;
    
    // Rating
    const starsContainer = card.querySelector('.stars');
    starsContainer.innerHTML = generarEstrellas(producto.rating);
    card.querySelector('.rating-count').textContent = `(${producto.reviews || 0})`;
    
    // Stock
    const stockElement = card.querySelector('.product-stock');
    if (producto.stock > 10) {
        stockElement.textContent = 'En stock';
        stockElement.className = 'product-stock in-stock';
    } else if (producto.stock > 0) {
        stockElement.textContent = `Solo ${producto.stock} disponibles`;
        stockElement.className = 'product-stock low-stock';
    } else {
        stockElement.textContent = 'Agotado';
        stockElement.className = 'product-stock out-stock';
    }
    
    // Variantes/Presentaciones
    const variantesContainer = card.querySelector('.product-variants');
    if (producto.variantes && producto.variantes.length > 0) {
        variantesContainer.style.display = 'block';
        const optionsContainer = card.querySelector('.variant-options');
        optionsContainer.innerHTML = '';
        
        producto.variantes.forEach((variante, index) => {
            const option = document.createElement('div');
            option.className = 'variant-option' + (index === 0 ? ' active' : '');
            option.innerHTML = `
                <span class="variant-size">${variante.tamaño}</span>
                <span class="variant-price">Bs. ${variante.precio}</span>
            `;
            option.dataset.varianteId = variante.id;
            option.dataset.precio = variante.precio;
            option.dataset.precioOriginal = variante.precioOriginal || '';
            
            option.addEventListener('click', () => {
                optionsContainer.querySelectorAll('.variant-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                // Actualizar precio mostrado
                const precioElement = productCard.querySelector('.current-price');
                const precioOriginalElement = productCard.querySelector('.original-price');
                precioElement.textContent = `Bs. ${variante.precio}`;
                if (variante.precioOriginal) {
                    precioOriginalElement.textContent = `Bs. ${variante.precioOriginal}`;
                    precioOriginalElement.style.display = 'inline';
                } else {
                    precioOriginalElement.style.display = 'none';
                }
            });
            
            optionsContainer.appendChild(option);
        });
        
        // Precio inicial (primera variante)
        const primeraVariante = producto.variantes[0];
        card.querySelector('.current-price').textContent = `Bs. ${primeraVariante.precio}`;
        if (primeraVariante.precioOriginal) {
            card.querySelector('.original-price').textContent = `Bs. ${primeraVariante.precioOriginal}`;
        } else {
            card.querySelector('.original-price').style.display = 'none';
        }
        
        // Precio por unidad
        const pricePerUnit = card.querySelector('.price-per-unit');
        if (pricePerUnit) {
            pricePerUnit.textContent = primeraVariante.descripcion || '';
        }
    } else {
        // Producto sin variantes
        variantesContainer.style.display = 'none';
        card.querySelector('.current-price').textContent = `Bs. ${producto.precio}`;
        if (producto.precioOriginal) {
            card.querySelector('.original-price').textContent = `Bs. ${producto.precioOriginal}`;
        } else {
            card.querySelector('.original-price').style.display = 'none';
        }
    }
    
    // Botón vista rápida
    const quickViewBtn = card.querySelector('.quick-view-btn');
    quickViewBtn.addEventListener('click', () => abrirModal(producto));
    
    // Botón añadir al carrito
    const addBtn = card.querySelector('.add-to-cart-btn');
    addBtn.addEventListener('click', () => {
        let varianteId = null;
        if (producto.variantes && producto.variantes.length > 0) {
            const varianteActiva = productCard.querySelector('.variant-option.active');
            varianteId = varianteActiva ? varianteActiva.dataset.varianteId : producto.variantes[0].id;
        }
        agregarAlCarrito(producto.id, 1, varianteId);
    });
    
    return card;
}

function generarEstrellas(rating) {
    let html = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star"></i>';
    }
    
    return html;
}

// ============================================
// PAGINACIÓN
// ============================================
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (!pageNumbers) return;
    
    // Botones prev/next
    prevBtn.disabled = paginaActual === 1;
    nextBtn.disabled = paginaActual === totalPaginas;
    
    prevBtn.onclick = () => {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarProductos();
        }
    };
    
    nextBtn.onclick = () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarProductos();
        }
    };
    
    // Números de página
    pageNumbers.innerHTML = '';
    
    // Lógica para mostrar páginas
    let paginasAMostrar = [];
    
    if (totalPaginas <= 7) {
        // Mostrar todas las páginas
        for (let i = 1; i <= totalPaginas; i++) {
            paginasAMostrar.push(i);
        }
    } else {
        // Mostrar con puntos suspensivos
        if (paginaActual <= 3) {
            paginasAMostrar = [1, 2, 3, 4, '...', totalPaginas];
        } else if (paginaActual >= totalPaginas - 2) {
            paginasAMostrar = [1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas];
        } else {
            paginasAMostrar = [1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas];
        }
    }
    
    paginasAMostrar.forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'page-number';
        
        if (num === '...') {
            btn.textContent = '...';
            btn.disabled = true;
            btn.style.cursor = 'default';
        } else {
            btn.textContent = num;
            if (num === paginaActual) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                paginaActual = num;
                mostrarProductos();
            });
        }
        
        pageNumbers.appendChild(btn);
    });
}

// ============================================
// MODAL DE VISTA RÁPIDA
// ============================================
function abrirModal(producto) {
    productoModalActual = producto;
    varianteSeleccionada = null;
    
    const modal = document.getElementById('quick-view-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Imagen principal
    const modalImg = document.getElementById('modal-image');
    modalImg.src = producto.imagenes[0];
    
    // Galería de miniaturas
    const thumbnailsContainer = document.getElementById('modal-thumbnails');
    thumbnailsContainer.innerHTML = '';
    
    if (producto.imagenes.length > 1) {
        producto.imagenes.forEach((img, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'gallery-thumb' + (index === 0 ? ' active' : '');
            thumb.innerHTML = `<img src="${img}" alt="${producto.nombre}">`;
            thumb.addEventListener('click', () => {
                modalImg.src = img;
                thumbnailsContainer.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbnailsContainer.appendChild(thumb);
        });
        
        // Botones de navegación
        const prevBtn = modal.querySelector('.prev-image');
        const nextBtn = modal.querySelector('.next-image');
        let imagenActual = 0;
        
        prevBtn.onclick = () => {
            imagenActual = (imagenActual - 1 + producto.imagenes.length) % producto.imagenes.length;
            modalImg.src = producto.imagenes[imagenActual];
            actualizarThumbActivo(imagenActual);
        };
        
        nextBtn.onclick = () => {
            imagenActual = (imagenActual + 1) % producto.imagenes.length;
            modalImg.src = producto.imagenes[imagenActual];
            actualizarThumbActivo(imagenActual);
        };
        
        function actualizarThumbActivo(index) {
            const thumbs = thumbnailsContainer.querySelectorAll('.gallery-thumb');
            thumbs.forEach(t => t.classList.remove('active'));
            thumbs[index]?.classList.add('active');
        }
    }
    
    // Badges
    const badgesContainer = document.getElementById('modal-badges');
    badgesContainer.innerHTML = '';
    if (producto.nuevo) {
        badgesContainer.innerHTML += '<span class="badge new">Nuevo</span>';
    }
    if (producto.oferta) {
        badgesContainer.innerHTML += '<span class="badge offer">Oferta</span>';
    }
    if (producto.destacado) {
        badgesContainer.innerHTML += '<span class="badge featured">Destacado</span>';
    }
    
    // Información básica
    document.getElementById('modal-category').textContent = producto.categoria.toUpperCase();
    document.getElementById('modal-title').textContent = producto.nombre;
    document.getElementById('modal-stars').innerHTML = generarEstrellas(producto.rating);
    document.getElementById('modal-rating').textContent = `(${producto.reviews || 0} reseñas)`;
    document.getElementById('modal-description').textContent = producto.descripcion;
    document.getElementById('modal-sku').textContent = producto.sku;
    
    // Stock
    const stockElement = document.getElementById('modal-stock');
    if (producto.stock > 10) {
        stockElement.textContent = 'En stock';
        stockElement.className = 'stock-status in-stock';
    } else if (producto.stock > 0) {
        stockElement.textContent = `Solo ${producto.stock} disponibles`;
        stockElement.className = 'stock-status low-stock';
    } else {
        stockElement.textContent = 'Agotado';
        stockElement.className = 'stock-status out-stock';
    }
    
    // Presentaciones/Variantes
    const presentationsContainer = document.getElementById('modal-presentations');
    if (producto.variantes && producto.variantes.length > 0) {
        presentationsContainer.style.display = 'block';
        const optionsContainer = presentationsContainer.querySelector('.presentation-options');
        optionsContainer.innerHTML = '';
        
        producto.variantes.forEach((variante, index) => {
            const option = document.createElement('label');
            option.className = 'presentation-option' + (index === 0 ? ' selected' : '');
            option.innerHTML = `
                <input type="radio" name="presentation" value="${variante.id}" ${index === 0 ? 'checked' : ''}>
                <div class="presentation-content">
                    <span class="presentation-size">${variante.tamaño}</span>
                    <span class="presentation-price">Bs. ${variante.precio}</span>
                    ${variante.descripcion ? `<span class="presentation-desc">${variante.descripcion}</span>` : ''}
                    ${variante.ahorro ? `<span class="presentation-savings">${variante.ahorro}</span>` : ''}
                </div>
            `;
            
            const radio = option.querySelector('input');
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    varianteSeleccionada = variante;
                    optionsContainer.querySelectorAll('.presentation-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    actualizarPrecioModal(variante);
                }
            });
            
            optionsContainer.appendChild(option);
        });
        
        // Seleccionar primera variante por defecto
        varianteSeleccionada = producto.variantes[0];
        actualizarPrecioModal(producto.variantes[0]);
    } else {
        presentationsContainer.style.display = 'none';
        actualizarPrecioModal(producto);
    }
    
    // Características
    const featuresContainer = document.getElementById('modal-features');
    if (producto.caracteristicas && producto.caracteristicas.length > 0) {
        featuresContainer.style.display = 'block';
        const ul = featuresContainer.querySelector('ul');
        ul.innerHTML = '';
        producto.caracteristicas.forEach(car => {
            const li = document.createElement('li');
            li.textContent = car;
            ul.appendChild(li);
        });
    } else {
        featuresContainer.style.display = 'none';
    }
    
    // Cantidad
    const quantityInput = document.getElementById('modal-quantity');
    quantityInput.value = 1;
    
    modal.querySelector('.quantity-btn.minus').onclick = () => {
        if (quantityInput.value > 1) {
            quantityInput.value = parseInt(quantityInput.value) - 1;
        }
    };
    
    modal.querySelector('.quantity-btn.plus').onclick = () => {
        quantityInput.value = parseInt(quantityInput.value) + 1;
    };
    
    // Botón añadir al carrito
    const addBtn = document.getElementById('modal-add-btn');
    addBtn.onclick = () => {
        const cantidad = parseInt(quantityInput.value);
        const varianteId = varianteSeleccionada ? varianteSeleccionada.id : null;
        agregarAlCarrito(producto.id, cantidad, varianteId);
        cerrarModal();
    };
}

function actualizarPrecioModal(data) {
    const precio = data.precio;
    const precioOriginal = data.precioOriginal;
    
    document.getElementById('modal-price').textContent = `Bs. ${precio}`;
    
    const originalElement = document.getElementById('modal-original');
    const savingElement = document.getElementById('modal-saving');
    const priceUnitElement = document.getElementById('modal-price-unit');
    
    if (precioOriginal) {
        originalElement.textContent = `Bs. ${precioOriginal}`;
        originalElement.style.display = 'inline';
        const ahorro = precioOriginal - precio;
        savingElement.textContent = `¡Ahorras Bs. ${ahorro}!`;
        savingElement.style.display = 'block';
    } else {
        originalElement.style.display = 'none';
        savingElement.style.display = 'none';
    }
    
    if (data.descripcion) {
        priceUnitElement.textContent = data.descripcion;
    } else {
        priceUnitElement.textContent = '';
    }
}

function cerrarModal() {
    const modal = document.getElementById('quick-view-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    productoModalActual = null;
    varianteSeleccionada = null;
}

// ============================================
// CARRITO
// ============================================
function agregarAlCarrito(productoId, cantidad, varianteId = null) {
    const producto = obtenerProductoPorId(productoId);
    if (!producto) return;
    
    // Obtener carrito del localStorage
    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    // Crear item del carrito
    const item = {
        productoId: productoId,
        cantidad: cantidad,
        varianteId: varianteId
    };
    
    // Verificar si ya existe en el carrito
    const existente = carrito.find(i => 
        i.productoId === productoId && i.varianteId === varianteId
    );
    
    if (existente) {
        existente.cantidad += cantidad;
    } else {
        carrito.push(item);
    }
    
    // Guardar carrito
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Actualizar contador
    actualizarContadorCarrito();
    
    // Mostrar notificación
    let nombreCompleto = producto.nombre;
    if (varianteId) {
        const variante = producto.variantes.find(v => v.id === varianteId);
        if (variante) {
            nombreCompleto += ` - ${variante.tamaño}`;
        }
    }
    mostrarNotificacion(`✅ ${nombreCompleto} añadido al carrito`);
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    document.querySelectorAll('.cart-count, .mobile-cart-count').forEach(element => {
        element.textContent = total;
        element.style.display = total > 0 ? 'flex' : 'none';
    });
}

// ============================================
// NOTIFICACIONES
// ============================================
function mostrarNotificacion(mensaje) {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    messageElement.textContent = mensaje;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
    
    document.getElementById('notification-close').onclick = () => {
        notification.classList.remove('show');
    };
}

// ============================================
// CAMBIAR VISTA
// ============================================
function cambiarVista(vista) {
    const productGrid = document.getElementById('products-container');
    
    if (vista === 'list') {
        productGrid.style.gridTemplateColumns = '1fr';
    } else {
        productGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    }
}