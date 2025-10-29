// carrito.js - Funcionalidad del carrito de compras

// ============================================
// VARIABLES GLOBALES
// ============================================
let carrito = [];
let cuponAplicado = null;
const ENVIO_GRATIS_MINIMO = 200;
const COSTO_ENVIO = 20;

// Cupones disponibles
const cupones = {
    'AQUA10': { descuento: 10, tipo: 'porcentaje' },
    'AQUA20': { descuento: 20, tipo: 'porcentaje' },
    'PRIMERACOMPRA': { descuento: 50, tipo: 'fijo' },
    'VERANO2024': { descuento: 15, tipo: 'porcentaje' }
};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    configurarEventos();
    renderizarCarrito();
    actualizarContadores();
});

// ============================================
// CARGAR CARRITO DEL LOCALSTORAGE
// ============================================
function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
    
    const cuponGuardado = localStorage.getItem('cuponAplicado');
    if (cuponGuardado) {
        cuponAplicado = JSON.parse(cuponGuardado);
    }
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    if (cuponAplicado) {
        localStorage.setItem('cuponAplicado', JSON.stringify(cuponAplicado));
    } else {
        localStorage.removeItem('cuponAplicado');
    }
}

// ============================================
// CONFIGURAR EVENTOS
// ============================================
function configurarEventos() {
    // Vaciar carrito
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', mostrarModalVaciarCarrito);
    }
    
    // Modal vaciar carrito
    const cancelClear = document.getElementById('cancel-clear');
    const confirmClear = document.getElementById('confirm-clear');
    const clearOverlay = document.getElementById('clear-overlay');
    
    if (cancelClear) {
        cancelClear.addEventListener('click', cerrarModalVaciar);
    }
    
    if (confirmClear) {
        confirmClear.addEventListener('click', vaciarCarrito);
    }
    
    if (clearOverlay) {
        clearOverlay.addEventListener('click', cerrarModalVaciar);
    }
    
    // Cupón
    const couponForm = document.getElementById('coupon-form');
    if (couponForm) {
        couponForm.addEventListener('submit', aplicarCupon);
    }
    
    const removeCoupon = document.getElementById('remove-coupon');
    if (removeCoupon) {
        removeCoupon.addEventListener('click', quitarCupon);
    }
    
    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', mostrarModalCheckout);
    }
    
    const closeCheckout = document.getElementById('close-checkout');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    
    if (closeCheckout) {
        closeCheckout.addEventListener('click', cerrarModalCheckout);
    }
    
    if (checkoutOverlay) {
        checkoutOverlay.addEventListener('click', cerrarModalCheckout);
    }
    
    // Formulario checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', procesarPedido);
    }
    
    // Reset button
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            window.location.href = 'catalogo.html';
        });
    }
}

// ============================================
// RENDERIZAR CARRITO
// ============================================
function renderizarCarrito() {
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const couponSection = document.getElementById('coupon-section');
    const orderSummary = document.getElementById('order-summary');
    
    if (!cartItems) return;
    
    // Verificar si el carrito está vacío
    if (carrito.length === 0) {
        cartItems.style.display = 'none';
        emptyCart.style.display = 'block';
        couponSection.style.display = 'none';
        orderSummary.style.display = 'none';
        return;
    }
    
    // Mostrar elementos
    cartItems.style.display = 'flex';
    emptyCart.style.display = 'none';
    couponSection.style.display = 'block';
    orderSummary.style.display = 'block';
    
    // Limpiar items
    cartItems.innerHTML = '';
    
    // Renderizar cada item
    carrito.forEach((item, index) => {
        const producto = obtenerProductoPorId(item.productoId);
        if (!producto) return;
        
        const itemElement = crearItemCarrito(producto, item, index);
        cartItems.appendChild(itemElement);
    });
    
    // Actualizar resumen
    actualizarResumen();
}

function crearItemCarrito(producto, item, index) {
    const template = document.getElementById('cart-item-template');
    const clone = template.content.cloneNode(true);
    
    // Imagen
    const img = clone.querySelector('.product-image');
    img.src = producto.imagenes[0];
    img.alt = producto.nombre;
    
    // Nombre
    const nombre = clone.querySelector('.item-name');
    nombre.textContent = producto.nombre;
    
    // Variante
    const variantElement = clone.querySelector('.item-variant');
    let precioUnitario = producto.precio;
    
    if (item.varianteId && producto.variantes) {
        const variante = producto.variantes.find(v => v.id === item.varianteId);
        if (variante) {
            variantElement.textContent = `${variante.tamaño} - ${variante.descripcion || ''}`;
            precioUnitario = variante.precio;
        }
    } else {
        variantElement.textContent = '';
    }
    
    // Precio unitario
    const precio = clone.querySelector('.item-price');
    precio.textContent = `Bs. ${precioUnitario} c/u`;
    
    // Cantidad
    const qtyInput = clone.querySelector('.qty-input');
    qtyInput.value = item.cantidad;
    
    const minusBtn = clone.querySelector('.minus-btn');
    const plusBtn = clone.querySelector('.plus-btn');
    
    minusBtn.addEventListener('click', () => {
        if (item.cantidad > 1) {
            item.cantidad--;
            guardarCarrito();
            renderizarCarrito();
            actualizarContadores();
        }
    });
    
    plusBtn.addEventListener('click', () => {
        item.cantidad++;
        guardarCarrito();
        renderizarCarrito();
        actualizarContadores();
    });
    
    // Botón eliminar
    const removeBtn = clone.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
        eliminarItem(index);
    });
    
    // Total del item
    const totalPrice = clone.querySelector('.total-price');
    const totalItem = precioUnitario * item.cantidad;
    totalPrice.textContent = `Bs. ${totalItem}`;
    
    return clone;
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    renderizarCarrito();
    actualizarContadores();
    mostrarToast('Producto eliminado del carrito');
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================
function actualizarResumen() {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento(subtotal);
    const costoEnvio = subtotal >= ENVIO_GRATIS_MINIMO ? 0 : COSTO_ENVIO;
    const total = subtotal - descuento + costoEnvio;
    
    // Actualizar valores
    document.getElementById('subtotal').textContent = `Bs. ${subtotal}`;
    document.getElementById('shipping-cost').textContent = costoEnvio === 0 ? 'GRATIS' : `Bs. ${costoEnvio}`;
    document.getElementById('total').textContent = `Bs. ${total}`;
    
    // Mostrar/ocultar descuento
    const discountRow = document.getElementById('discount-row');
    if (descuento > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discount-amount').textContent = `-Bs. ${descuento}`;
    } else {
        discountRow.style.display = 'none';
    }
    
    // Nota de envío
    const shippingNote = document.getElementById('shipping-note');
    const remainingElement = document.getElementById('remaining-free-shipping');
    
    if (subtotal >= ENVIO_GRATIS_MINIMO) {
        shippingNote.innerHTML = '<i class="fas fa-check-circle"></i><span>¡Envío gratis en tu pedido!</span>';
        shippingNote.classList.add('free');
    } else {
        const restante = ENVIO_GRATIS_MINIMO - subtotal;
        remainingElement.textContent = restante;
        shippingNote.classList.remove('free');
    }
    
    // Actualizar total en modal checkout
    const checkoutTotal = document.getElementById('checkout-total');
    if (checkoutTotal) {
        checkoutTotal.textContent = `Bs. ${total}`;
    }
}

function calcularSubtotal() {
    return carrito.reduce((total, item) => {
        const producto = obtenerProductoPorId(item.productoId);
        if (!producto) return total;
        
        let precio = producto.precio;
        
        if (item.varianteId && producto.variantes) {
            const variante = producto.variantes.find(v => v.id === item.varianteId);
            if (variante) {
                precio = variante.precio;
            }
        }
        
        return total + (precio * item.cantidad);
    }, 0);
}

function calcularDescuento(subtotal) {
    if (!cuponAplicado) return 0;
    
    if (cuponAplicado.tipo === 'porcentaje') {
        return Math.round(subtotal * cuponAplicado.descuento / 100);
    } else {
        return cuponAplicado.descuento;
    }
}

// ============================================
// CUPONES
// ============================================
function aplicarCupon(e) {
    e.preventDefault();
    
    const input = document.getElementById('coupon-input');
    const codigo = input.value.toUpperCase().trim();
    const message = document.getElementById('coupon-message');
    
    if (!codigo) {
        mostrarMensajeCupon('Por favor ingresa un código', 'error');
        return;
    }
    
    if (cupones[codigo]) {
        cuponAplicado = {
            codigo: codigo,
            ...cupones[codigo]
        };
        
        guardarCarrito();
        actualizarResumen();
        input.value = '';
        
        const desc = cuponAplicado.tipo === 'porcentaje' 
            ? `${cuponAplicado.descuento}%` 
            : `Bs. ${cuponAplicado.descuento}`;
        
        mostrarMensajeCupon(`¡Cupón aplicado! Descuento de ${desc}`, 'success');
        mostrarToast('¡Cupón aplicado exitosamente! 🎉');
    } else {
        mostrarMensajeCupon('Cupón inválido o expirado', 'error');
    }
}

function quitarCupon() {
    cuponAplicado = null;
    guardarCarrito();
    actualizarResumen();
    mostrarMensajeCupon('', 'error');
    mostrarToast('Cupón removido');
}

function mostrarMensajeCupon(mensaje, tipo) {
    const messageElement = document.getElementById('coupon-message');
    messageElement.textContent = mensaje;
    messageElement.className = `coupon-message ${tipo}`;
}

// ============================================
// VACIAR CARRITO
// ============================================
function mostrarModalVaciarCarrito() {
    if (carrito.length === 0) return;
    const modal = document.getElementById('confirm-clear-modal');
    modal.classList.add('show');
}

function cerrarModalVaciar() {
    const modal = document.getElementById('confirm-clear-modal');
    modal.classList.remove('show');
}

function vaciarCarrito() {
    carrito = [];
    cuponAplicado = null;
    guardarCarrito();
    renderizarCarrito();
    actualizarContadores();
    cerrarModalVaciar();
    mostrarToast('Carrito vaciado');
}

// ============================================
// CHECKOUT
// ============================================
function mostrarModalCheckout() {
    if (carrito.length === 0) return;
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function cerrarModalCheckout() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function procesarPedido(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const nombre = document.getElementById('customer-name').value;
    const telefono = document.getElementById('customer-phone').value;
    const email = document.getElementById('customer-email').value;
    const direccion = document.getElementById('delivery-address').value;
    const ciudad = document.getElementById('delivery-city').value;
    const metodoPago = document.querySelector('input[name="payment"]:checked').value;
    const notas = document.getElementById('order-notes').value;
    
    // Generar mensaje para WhatsApp
    const mensaje = generarMensajeWhatsApp({
        nombre,
        telefono,
        email,
        direccion,
        ciudad,
        metodoPago,
        notas
    });
    
    // Abrir WhatsApp
    const numeroWhatsApp = '59173211815';
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
    
    // Limpiar carrito después de enviar
    setTimeout(() => {
        vaciarCarrito();
        cerrarModalCheckout();
        mostrarToast('¡Pedido enviado! Te contactaremos pronto 🎉');
    }, 1000);
}

function generarMensajeWhatsApp(datos) {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento(subtotal);
    const costoEnvio = subtotal >= ENVIO_GRATIS_MINIMO ? 0 : COSTO_ENVIO;
    const total = subtotal - descuento + costoEnvio;
    
    let mensaje = `🐠 *NUEVO PEDIDO - AQUARIX* 🐠\n\n`;
    mensaje += `👤 *DATOS DEL CLIENTE*\n`;
    mensaje += `Nombre: ${datos.nombre}\n`;
    mensaje += `Teléfono: ${datos.telefono}\n`;
    if (datos.email) mensaje += `Email: ${datos.email}\n`;
    mensaje += `\n📍 *DIRECCIÓN DE ENTREGA*\n`;
    mensaje += `${datos.direccion}\n`;
    mensaje += `Ciudad: ${datos.ciudad}\n`;
    mensaje += `\n🛒 *PRODUCTOS*\n`;
    
    carrito.forEach((item, index) => {
        const producto = obtenerProductoPorId(item.productoId);
        if (!producto) return;
        
        let nombreCompleto = producto.nombre;
        let precio = producto.precio;
        
        if (item.varianteId && producto.variantes) {
            const variante = producto.variantes.find(v => v.id === item.varianteId);
            if (variante) {
                nombreCompleto += ` - ${variante.tamaño}`;
                precio = variante.precio;
            }
        }
        
        mensaje += `${index + 1}. ${nombreCompleto}\n`;
        mensaje += `   Cantidad: ${item.cantidad}\n`;
        mensaje += `   Precio: Bs. ${precio} c/u\n`;
        mensaje += `   Subtotal: Bs. ${precio * item.cantidad}\n\n`;
    });
    
    mensaje += `💰 *RESUMEN*\n`;
    mensaje += `Subtotal: Bs. ${subtotal}\n`;
    
    if (descuento > 0) {
        mensaje += `Descuento (${cuponAplicado.codigo}): -Bs. ${descuento}\n`;
    }
    
    mensaje += `Envío: ${costoEnvio === 0 ? 'GRATIS' : `Bs. ${costoEnvio}`}\n`;
    mensaje += `*TOTAL: Bs. ${total}*\n\n`;
    
    mensaje += `💳 *MÉTODO DE PAGO*\n`;
    const metodoPagoTexto = {
        'transferencia': 'Transferencia bancaria',
        'efectivo': 'Efectivo contra entrega',
        'qr': 'QR Simple/Tigo Money'
    };
    mensaje += `${metodoPagoTexto[datos.metodoPago]}\n`;
    
    if (datos.notas) {
        mensaje += `\n📝 *NOTAS ADICIONALES*\n${datos.notas}\n`;
    }
    
    mensaje += `\n✅ ¡Gracias por tu compra!`;
    
    return mensaje;
}

// ============================================
// CONTADORES
// ============================================
function actualizarContadores() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    document.querySelectorAll('.cart-count, .bottom-cart-count').forEach(element => {
        element.textContent = totalItems;
        if (totalItems > 0) {
            element.classList.add('show');
        } else {
            element.classList.remove('show');
        }
    });
    
    // Actualizar contador de productos
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `${carrito.length} ${carrito.length === 1 ? 'producto' : 'productos'}`;
    }
}

// ============================================
// NOTIFICACIONES
// ============================================
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = mensaje;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}