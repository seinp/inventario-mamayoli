// Archivo: Logica.js
// Descripción: Contiene la lógica del frontend para la renderización del catálogo, manejo de eventos y funcionalidad de carrito.

// ---------------------------------------------
// INICIALIZACIÓN Y VARIABLES GLOBALES
// ---------------------------------------------

// El carrito se almacena como un array de objetos {id: number, nombre: string, precio: number, cantidad: number}
let cart = []; 
let lastProductIdViewed = null; // Para saber qué producto añadir al carrito desde el modal
const WHATSAPP_NUMBER = "+573180739709"; // Número de WhatsApp de destino

// Referencias del DOM para el carrito (pueden no existir en algunas páginas)
const cartCountElement = document.getElementById('cartCount');
const cartItemsListElement = document.getElementById('cartItemsList');
const cartTotalElement = document.getElementById('cartTotal');
const emptyCartMessageElement = document.getElementById('emptyCartMessage');
const checkoutBtn = document.getElementById('checkoutBtn');
const addToCartModalBtn = document.getElementById('addToCartModalBtn');

// Referencias del DOM existentes
const productsGrid = document.getElementById('productsGrid');
const carouselInner = document.getElementById('carouselInner');
const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('noResults');
const carouselSection = document.querySelector('main > section:first-of-type');


document.addEventListener('DOMContentLoaded', () => {
    // Inicializar los iconos de Lucide
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    
    // Cargar datos (Simulación o Firestore futuro)
    renderCarousel();
    filterAndRenderProducts(); 

    // Asignar listeners al botón del modal
    if (addToCartModalBtn) {
        addToCartModalBtn.addEventListener('click', () => {
            if (lastProductIdViewed) {
                // Añadir el producto que se está viendo actualmente en el modal
                addToCart(lastProductIdViewed);
                // Opcional: Cerrar el modal después de añadir (opcional)
                const modalElement = document.getElementById('detailsModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        });
    }

    // Nuevo: Listener para el botón Finalizar Compra (Checkout)
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', sendWhatsAppOrder);
    }
});


// ---------------------------------------------
// SIMULACIÓN DE DATOS (REEMPLAZAR CON FIRESTORE)
// ---------------------------------------------

// **IMPORTANTE:** Se añadió el campo 'costo' para la gestión administrativa.
const DUMMY_PRODUCTS = [
    // Datos de Bisutería y Accesorios de MamaYoli
    { id: 1, nombre: "Collar Dije de Luna", precio: 29.50, costo: 12.00, categoria: "Collares", stock: 5, descripcion: "Delicado collar plateado con dije de luna creciente y pequeña gema. Ideal para un look minimalista y elegante.", imagenesUrls: ["https://placehold.co/600x400/FBE5E6/D4AF37?text=MamaYoli+Collar+Luna", "https://placehold.co/600x400/E88D92/ffffff?text=Detalle+Gema", "https://placehold.co/600x400/D4AF37/ffffff?text=Puesto+en+Modelo"], activo: true },
    { id: 2, nombre: "Set de Aretes Minimalistas", precio: 18.00, costo: 6.50, categoria: "Aretes", stock: 12, descripcion: "Set de tres pares de pendientes de acero inoxidable en tonos dorados. Perfecto para perforaciones múltiples.", imagenesUrls: ["https://placehold.co/600x400/D4AF37/ffffff?text=MamaYoli+Aretes+Set", "https://placehold.co/600x400/FBE5E6/333333?text=Aretes+Minimal"], activo: true },
    { id: 3, nombre: "Pulsera de Cuentas Rosadas", precio: 8.50, costo: 3.00, categoria: "Pulseras", stock: 25, descripcion: "Pulsera elástica de cuentas de cuarzo rosa con un dije de corazón dorado. Combina con cualquier atuendo casual.", imagenesUrls: ["https://placehold.co/600x400/E88D92/ffffff?text=Pulsera+Cuarzo"], activo: true },
    { id: 4, nombre: "Anillo Ajustable de Flor", precio: 15.00, costo: 7.00, categoria: "Anillos", stock: 18, descripcion: "Anillo de plata con diseño floral ajustable, ideal para regalo. Suave y cómodo de llevar.", imagenesUrls: ["https://placehold.co/600x400/FBE5E6/D4AF37?text=Anillo+Flor"], activo: true },
    { id: 5, nombre: "Gargantilla de Perlas", precio: 35.00, costo: 15.00, categoria: "Collares", stock: 3, descripcion: "Gargantilla clásica con pequeñas perlas sintéticas y broche dorado. Elegancia atemporal.", imagenesUrls: ["https://placehold.co/600x400/D4AF37/ffffff?text=Gargantilla+Perlas"], activo: true },
    { id: 6, nombre: "Reloj Minimalista Rosado", precio: 59.99, costo: 25.00, categoria: "Accesorios", stock: 50, descripcion: "Reloj de pulsera con correa de cuero sintético rosado y marco dorado. Estilo discreto y moderno.", imagenesUrls: ["https://placehold.co/600x400/E88D92/ffffff?text=Reloj+Rosado"], activo: true },
    { id: 7, nombre: "Broche de Gema Grande (INACTIVO)", precio: 40.00, costo: 20.00, categoria: "Accesorios", stock: 1, descripcion: "Broche de solapa con una gran gema facetada en tonos amatistas.", imagenesUrls: ["https://placehold.co/600x400/FBE5E6/333333?text=Broche+Gema"], activo: false }, // Producto inactivo
    { id: 8, nombre: "Tobillera de Conchas", precio: 12.00, costo: 4.00, categoria: "Pulseras", stock: 0, descripcion: "Tobillera estilo playero con pequeñas conchas y detalles dorados.", imagenesUrls: ["https://placehold.co/600x400/D4AF37/ffffff?text=Tobillera+Conchas"], activo: true } // Producto agotado
];

/**
 * Busca un producto por ID en los datos simulados.
 * @param {number} id - ID del producto.
 * @returns {object|undefined}
 */
function getProductById(id) {
    return DUMMY_PRODUCTS.find(p => p.id === id);
}


// ---------------------------------------------
// FUNCIONES DE CARRITO
// ---------------------------------------------

/**
 * Añade un producto al carrito.
 * @param {number} productId - ID del producto a añadir.
 */
window.addToCart = function(productId) {
    const product = getProductById(productId);
    if (!product || product.stock <= 0) {
        console.error("Producto no encontrado o sin stock.");
        return;
    }

    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        if (cartItem.cantidad < product.stock) {
            cartItem.cantidad += 1;
        } else {
            console.warn("No hay suficiente stock para añadir más.");
            return;
        }
    } else {
        cart.push({
            id: productId,
            nombre: product.nombre,
            precio: product.precio,
            imagenUrl: product.imagenesUrls[0],
            cantidad: 1
        });
    }

    renderCart();
    // Mensaje informativo: si existe la función de muestra de mensajes, la llamamos
    if(typeof window.showInvoiceMessage === 'function'){
        try { window.showInvoiceMessage('Producto agregado a la factura'); } catch(e){ console.warn('showInvoiceMessage falló', e); }
    }
};

// Notificador opcional para integrarse con la página de facturación
// Si existe una función global updateInvoicePanel, la llamamos para sincronizar la UI
function notifyInvoicePanel(){
    if(typeof window.updateInvoicePanel === 'function'){
        try { window.updateInvoicePanel(); } catch(e) { console.warn('updateInvoicePanel falló', e); }
    }
}

/**
 * Elimina un producto completamente del carrito.
 * @param {number} productId - ID del producto a eliminar.
 */
window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
};

/**
 * Genera el mensaje de pedido de WhatsApp y redirige.
 */
function sendWhatsAppOrder() {
    if (cart.length === 0) {
        console.warn("El carrito está vacío, no se puede enviar el pedido.");
        return;
    }

    let total = 0;
    let orderDetails = "🛍️ *NUEVO PEDIDO MAMA YOLI* 💍\n\n";
    orderDetails += "--- Detalles del Pedido ---\n";

    cart.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        // Formato limpio y con emojis por item
        orderDetails += `\n✨ *${index + 1}. ${item.nombre}*\n`;
        orderDetails += `   ➡️ Cantidad: ${item.cantidad}\n`;
        orderDetails += `   💸 Subtotal: $${subtotal.toFixed(2)}\n`;
    });

    orderDetails += "\n--------------------------\n";
    orderDetails += `💰 *TOTAL A PAGAR: $${total.toFixed(2)}*\n`;
    orderDetails += "--------------------------\n\n";
    orderDetails += "Por favor, confírmame el método de pago y la dirección de envío. ¡Gracias por tu compra! 😊";

    // Codificar el mensaje para la URL de WhatsApp
    const encodedMessage = encodeURIComponent(orderDetails);
    
    // Crear el enlace de WhatsApp
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Abrir el enlace en una nueva ventana/pestaña
    window.open(whatsappUrl, '_blank');
}

/**
 * Renderiza el contenido del carrito en el Offcanvas.
 */
function renderCart() {
    let total = 0;
    let itemCount = 0;
    if(cartItemsListElement) cartItemsListElement.innerHTML = ''; // Limpiar lista

    if (cart.length === 0) {
        if(emptyCartMessageElement) emptyCartMessageElement.classList.remove('d-none');
        if(checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if(emptyCartMessageElement) emptyCartMessageElement.classList.add('d-none');
        if(checkoutBtn) checkoutBtn.disabled = false;
        
        cart.forEach(item => {
            // Nota: No necesitamos el objeto completo del producto aquí, solo el del carrito.
            total += item.precio * item.cantidad;
            itemCount += item.cantidad;

            const itemHtml = `
                <div class="d-flex align-items-center mb-3 pb-2 border-bottom">
                    <img src="${item.imagenUrl}" class="rounded me-3" style="width: 60px; height: 60px; object-fit: cover;" alt="${item.nombre}">
                    <div class="flex-grow-1">
                        <h6 class="mb-0 fw-semibold text-pink">${item.nombre}</h6>
                        <p class="mb-0 text-muted small">$${item.precio.toFixed(2)} x ${item.cantidad}</p>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="price-text fw-bold me-3">$${(item.precio * item.cantidad).toFixed(2)}</span>
                        <button class="btn btn-sm btn-outline-danger p-1 rounded-circle" onclick="removeFromCart(${item.id})" title="Eliminar">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            `;
            cartItemsListElement.insertAdjacentHTML('beforeend', itemHtml);
        });

        // Re-crear iconos de Lucide para los nuevos botones "x"
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // Actualizar resumen
    if(cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    if(cartCountElement) cartCountElement.textContent = itemCount;

    // Notificar al panel de facturación si existe
    notifyInvoicePanel();
}


// ---------------------------------------------
// FUNCIONES DE RENDERIZADO DEL CATÁLOGO
// ---------------------------------------------

/**
 * Renderiza una tarjeta de producto en la cuadrícula.
 * @param {object} product - Objeto producto.
 */
function renderProductCard(product) {
    const firstImage = product.imagenesUrls && product.imagenesUrls.length > 0 ? product.imagenesUrls[0] : 'https://placehold.co/600x400/cccccc/333333?text=Sin+Imagen';

    // Ocultar productos sin stock (Simulación de 'activo: true' y stock > 0)
    if (product.stock <= 0 || !product.activo) return;

    const cardHtml = `
        <div class="col">
            <div class="card product-card h-100">
                <img src="${firstImage}" class="card-img-top" alt="${product.nombre}" onerror="this.onerror=null; this.src='https://placehold.co/600x400/cccccc/333333?text=Error+Imagen';">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-semibold text-pink">${product.nombre}</h5>
                    <p class="card-text text-muted flex-grow-1">${product.descripcion.substring(0, 50)}...</p>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="price-text fs-4">$${product.precio.toFixed(2)}</span>
                        <a href="#" class="btn btn-sm btn-outline-primary rounded-pill" onclick="viewDetails(${product.id}); return false;">Ver Detalle</a>
                    </div>
                    <button class="btn btn-pink btn-sm rounded-pill mt-2" onclick="addToCart(${product.id})">
                        <i data-lucide="shopping-cart" class="me-1" style="width: 16px; height:16px;"></i> Agregar a factura
                    </button>
                </div>
            </div>
        </div>
    `;
    productsGrid.insertAdjacentHTML('beforeend', cardHtml);
}

/**
 * Renderiza el carrusel de banners.
 */
function renderCarousel() {
    if (!carouselInner) return;

    const carouselData = [
        { title: "Nueva Colección Dorada", text: "Descubre la elegancia de nuestros dijes bañados en oro.", image: "https://placehold.co/1200x400/D4AF37/ffffff?text=MamaYoli+Coleccion+Dorado" },
        { title: "Bisutería Fina y Duradera", text: "Accesorios para brillar todos los días.", image: "https://placehold.co/1200x400/E88D92/ffffff?text=MamaYoli+Elegancia" },
        { title: "Envíos Gratis", text: "En todas las compras superiores a $50.00.", image: "https://placehold.co/1200x400/FBE5E6/333333?text=MamaYoli+Envio+Gratis" }
    ];

    carouselInner.innerHTML = '';
    carouselData.forEach((item, index) => {
        const isActive = index === 0 ? 'active' : '';
        const slide = `
            <div class="carousel-item ${isActive}">
                <img src="${item.image}" class="d-block w-100" alt="${item.title}">
                <div class="carousel-caption d-none d-md-block text-start" style="background: rgba(0, 0, 0, 0.4); border-radius: 8px; padding: 10px;">
                    <h5>${item.title}</h5>
                    <p>${item.text}</p>
                </div>
            </div>
        `;
        carouselInner.insertAdjacentHTML('beforeend', slide);
    });
}

/**
 * Filtra y renderiza la cuadrícula de productos.
 * @param {string} searchTerm - El término de búsqueda.
 */
function filterAndRenderProducts(searchTerm = '') {
    if (!productsGrid || !noResults || !carouselSection) return;

    productsGrid.innerHTML = ''; // Limpiar cuadrícula
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // 1. Mostrar/Ocultar Carrusel basado en el término de búsqueda
    if (lowerCaseSearchTerm.length > 0) {
        carouselSection.classList.add('d-none'); // Ocultar si hay búsqueda
    } else {
        carouselSection.classList.remove('d-none'); // Mostrar si la búsqueda está vacía
    }

    const filteredProducts = DUMMY_PRODUCTS.filter(product =>
        product.stock > 0 && product.activo && ( // Solo productos activos y con stock > 0
            product.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.descripcion.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.categoria.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.id.toString().includes(lowerCaseSearchTerm) // Simulación de búsqueda por ID
        )
    );

    if (filteredProducts.length > 0) {
        filteredProducts.forEach(renderProductCard);
        // Re-crear iconos de Lucide para los nuevos botones en las tarjetas
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        noResults.classList.add('d-none');
    } else {
        noResults.classList.remove('d-none');
    }
}

/**
 * Muestra el detalle de un producto en un modal (reemplaza el uso de alert()).
 * @param {number} id - ID del producto.
 */
window.viewDetails = function(id) {
    const product = getProductById(id);
    if (!product) return;

    lastProductIdViewed = id; // Guardar ID para el botón "Añadir al Carrito" del modal

    // --- 1. Generar HTML del Carrusel de Imágenes ---
    const carouselId = `detailCarousel-${product.id}`;
    let carouselIndicators = '';
    let carouselItems = '';
    const imageCount = product.imagenesUrls ? product.imagenesUrls.length : 0;
    
    if (imageCount > 0) {
        product.imagenesUrls.forEach((url, index) => {
            const isActive = index === 0 ? 'active' : '';
            // Indicadores
            carouselIndicators += `<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}" class="${isActive}" aria-current="${isActive ? 'true' : 'false'}" aria-label="Slide ${index + 1}"></button>`;
            // Items
            carouselItems += `
                <div class="carousel-item ${isActive}">
                    <img src="${url}" class="d-block w-100 rounded-3 shadow-sm" alt="${product.nombre} Imagen ${index + 1}" style="max-height: 300px; object-fit: cover;">
                </div>
            `;
        });
    } else {
         // Placeholder si no hay imágenes
         carouselItems = `
            <div class="carousel-item active">
                <img src="https://placehold.co/600x300/cccccc/333333?text=Sin+Imágenes+Disponibles" class="d-block w-100 rounded-3 shadow-sm" alt="Sin Imágenes" style="max-height: 300px; object-fit: cover;">
            </div>
        `;
        carouselIndicators = '<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>';
    }

    // Estructura completa del carrusel (incluye botones de navegación solo si hay más de una imagen)
    const carouselHtml = `
        <div id="${carouselId}" class="carousel slide mb-4" data-bs-ride="carousel">
            <div class="carousel-indicators">
                ${carouselIndicators}
            </div>
            <div class="carousel-inner">
                ${carouselItems}
            </div>
            ${imageCount > 1 ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Anterior</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Siguiente</span>
            </button>` : ''}
        </div>
    `;

    // --- 2. Generar HTML de la Información ---
    const stockStatus = product.stock > 0 
        ? `<span class="badge bg-success">${product.stock} disponibles</span>` 
        : '<span class="badge bg-danger">Agotado</span>';

    const infoHtml = `
        <h3 class="text-pink mb-3">${product.nombre}</h3>
        <p><strong>Precio:</strong> <span class="price-text fs-4">$${product.precio.toFixed(2)}</span></p>
        <p><strong>Stock:</strong> ${stockStatus}</p>
        <p><strong>Descripción:</strong> ${product.descripcion}</p>
    `;

    // --- 3. Inyectar el contenido combinado ---
    const modalTitleElement = document.getElementById('detailsModalTitle');
    // Aseguramos que el título del modal sea rosado
    modalTitleElement.className = 'modal-title text-pink fw-bold'; 
    modalTitleElement.textContent = product.nombre;
    
    document.getElementById('detailsModalBody').innerHTML = carouselHtml + infoHtml;
    
    // Configurar el botón de añadir al carrito
    addToCartModalBtn.disabled = product.stock <= 0;
    addToCartModalBtn.setAttribute('data-product-id', product.id);
    
    // Mostrar el modal
    const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
    detailsModal.show();
                
    // Re-crear iconos de Lucide dentro del modal
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}


// ---------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------

// Evento de búsqueda al escribir
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        // Delay para optimizar la búsqueda
        setTimeout(() => filterAndRenderProducts(e.target.value.trim()), 300);
    });
}

// Evento para prevenir el envío del formulario de búsqueda (comportamiento por defecto)
const searchForm = document.querySelector('.navbar-search-form');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        filterAndRenderProducts(searchInput ? searchInput.value.trim() : '');
    });
}
