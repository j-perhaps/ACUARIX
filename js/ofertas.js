// ===== OFERTAS =====
const offers = [
    { id: 101, name: 'Combo Inicio Acuarista', oldPrice: 750, newPrice: 580, discount: 23, icon: '🎁', desc: 'Acuario 50L + Filtro + Luz LED + Decoración' },
    { id: 102, name: 'Pack Peces Tropicales x10', oldPrice: 150, newPrice: 99, discount: 34, icon: '🐠', desc: 'Variedad de peces tropicales' },
    { id: 103, name: 'Set Completo Mantenimiento', oldPrice: 280, newPrice: 195, discount: 30, icon: '🧰', desc: 'Herramientas + Químicos + Test de agua' },
    { id: 104, name: 'Acuario Panorámico 100L', oldPrice: 1200, newPrice: 890, discount: 26, icon: '🏰', desc: 'Diseño premium con todos los accesorios' },
    { id: 105, name: 'Plantas Naturales Pack x10', oldPrice: 220, newPrice: 149, discount: 32, icon: '🌿', desc: '10 plantas variadas' },
    { id: 106, name: 'Sistema Filtración Pro', oldPrice: 380, newPrice: 265, discount: 30, icon: '🌊', desc: 'Filtro externo + bomba de aire' },
    { id: 107, name: 'Combo Alimentación 3 meses', oldPrice: 190, newPrice: 125, discount: 34, icon: '🍽️', desc: '3 tipos de comida + vitaminas' },
    { id: 108, name: 'Kit Iluminación RGB Premium', oldPrice: 450, newPrice: 315, discount: 30, icon: '💡', desc: 'Luz LED RGB + Control remoto + Timer' }
];

// ===== MENU MOBILE =====
const menuBtn = document.getElementById('menuBtn');
const navMenu = document.querySelector('.nav-menu');

menuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
        navMenu.classList.remove('active');
    }
});

// ===== RENDERIZAR OFERTAS =====
function renderOffers() {
    const grid = document.getElementById('offersGrid');
    
    grid.innerHTML = offers.map(offer => {
        const savings = offer.oldPrice - offer.newPrice;
        return `
            <div class="offer-card">
                <div class="discount-badge">-${offer.discount}%</div>
                <div class="offer-icon">${offer.icon}</div>
                <div class="offer-info">
                    <h3 class="offer-name">${offer.name}</h3>
                    <p class="offer-desc">${offer.desc}</p>
                    <div class="price-container">
                        <span class="old-price">${offer.oldPrice} Bs</span>
                        <span class="new-price">${offer.newPrice} Bs</span>
                    </div>
                    <div class="savings">Ahorras ${savings} Bs</div>
                    <button class="btn-add-cart" onclick="addToCart(${offer.id})">
                        ¡Aprovechar Oferta!
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== CARRITO =====
let cart = JSON.parse(localStorage.getItem('aquarixCart')) || [];

function addToCart(offerId) {
    const offer = offers.find(o => o.id === offerId);
    const existingItem = cart.find(item => item.id === offerId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: offer.id,
            name: offer.name,
            price: offer.newPrice,
            icon: offer.icon,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification('¡Oferta añadida al carrito! 🔥');
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartUI();
}

function updateQuantity(itemId, change) {
    const item = cart.find(item => item.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('aquarixCart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    const cartCount = document.querySelector('.cart-count');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        totalPrice.textContent = '0 Bs';
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-icon">${item.icon}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} Bs</div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="qty-number">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `${total} Bs`;
}

// ===== MODAL CARRITO =====
const cartModal = document.getElementById('cartModal');
const cartIcon = document.getElementById('cartIcon');
const closeCart = document.getElementById('closeCart');

cartIcon.addEventListener('click', () => {
    cartModal.classList.add('active');
    updateCartUI();
});

closeCart.addEventListener('click', () => {
    cartModal.classList.remove('active');
});

cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
    }
});

// ===== CHECKOUT =====
document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    let message = '🔥 *Pedido de OFERTAS AQUARIX* 🔥\n\n';
    cart.forEach(item => {
        message += `${item.icon} *${item.name}*\n`;
        message += `   Cantidad: ${item.quantity}\n`;
        message += `   Precio: ${item.price} Bs c/u\n`;
        message += `   Subtotal: ${item.price * item.quantity} Bs\n\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `💰 *TOTAL: ${total} Bs*`;
    
    const whatsappUrl = `https://wa.me/59173211815?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    cart = [];
    saveCart();
    updateCartUI();
    cartModal.classList.remove('active');
});

// ===== NOTIFICACIÓN =====
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #ff4757, #ff6348);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===== INICIALIZAR =====
renderOffers();
updateCartUI();

console.log('🔥 Ofertas cargadas!');