// Archivo: Facturacion.js
// Lógica específica para la página de facturación: interacción con carrito, generación de factura, impresión y guardado local.

// IIFE para aislar el scope
(function(){
    // IVA por defecto (19%) — ajustar según país
    const TAX_RATE = 0.19;

    // Referencias DOM
    const clienteSelect = document.getElementById('clienteSelect');
    const invoiceItemsDiv = document.getElementById('invoiceItems');
    const invoiceSubtotal = document.getElementById('invoiceSubtotal');
    const invoiceTax = document.getElementById('invoiceTax');
    const invoiceTotal = document.getElementById('invoiceTotal');
    const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
    const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');

    // Clientes de ejemplo (en el futuro cargar desde almacenamiento/Firestore)
    const DUMMY_CLIENTS = [
        { id: 'C001', nombre: 'María González', documento: 'CC 12345678', telefono: '+57 300 1234567', direccion: 'Calle 123 #45-67' },
        { id: 'C002', nombre: 'Juan Pérez', documento: 'CC 87654321', telefono: '+57 311 7654321', direccion: 'Carrera 50 #12-34' },
    ];

    // Estado local para la factura actual
    let currentInvoice = null;

    // Poblamos el select de clientes
    function populateClients(){
        if(!clienteSelect) return;
        DUMMY_CLIENTS.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.nombre} — ${c.documento}`;
            clienteSelect.appendChild(opt);
        });
    }

    // Calcula totales usando la variable global `cart` desde Logica.js
    function calculateTotals(){
        if(!window.cart) return {subtotal:0, tax:0, total:0};
        const subtotal = window.cart.reduce((s, item) => s + (item.precio * item.cantidad), 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }

    // Actualiza el panel de la derecha con los totales y items
    function updateInvoicePanel(){
        if(!invoiceItemsDiv) return;
        if(!window.cart || window.cart.length === 0){
            invoiceItemsDiv.textContent = 'Sin items';
        } else {
            invoiceItemsDiv.innerHTML = '';
            window.cart.forEach(it => {
                const itemRow = document.createElement('div');
                itemRow.className = 'd-flex justify-content-between align-items-center small mb-2';

                const left = document.createElement('div');
                left.innerHTML = `<strong class="text-pink">${it.nombre}</strong><div class="small text-muted">$${it.precio.toFixed(2)}</div>`;

                const right = document.createElement('div');
                right.className = 'd-flex align-items-center';
                right.innerHTML = `
                    <div class="input-group input-group-sm me-2" style="width:110px;">
                        <button class="btn btn-outline-secondary" type="button" onclick="decreaseInvoiceQty(${it.id})">-</button>
                        <span class="px-2 d-inline-block text-center" style="min-width:40px;">${it.cantidad}</span>
                        <button class="btn btn-outline-secondary" type="button" onclick="increaseInvoiceQty(${it.id})">+</button>
                    </div>
                    <div class="me-2 fw-semibold">$${(it.precio * it.cantidad).toFixed(2)}</div>
                    <button class="btn btn-sm btn-outline-danger" type="button" onclick="removeInvoiceItem(${it.id})">Eliminar</button>
                `;

                itemRow.appendChild(left);
                itemRow.appendChild(right);
                invoiceItemsDiv.appendChild(itemRow);
            });
        }

        const totals = calculateTotals();
        invoiceSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;
        invoiceTax.textContent = `$${totals.tax.toFixed(2)}`;
        invoiceTotal.textContent = `$${totals.total.toFixed(2)}`;
    }

    // Exponer la función para que Logica.js pueda llamarla cuando el carrito cambie
    window.updateInvoicePanel = updateInvoicePanel;

    // Genera un objeto factura mínimo
    function buildInvoiceObject(){
        const clienteId = clienteSelect ? clienteSelect.value : '';
        const cliente = DUMMY_CLIENTS.find(c => c.id === clienteId) || null;
        const fecha = new Date().toISOString();
        const items = (window.cart || []).map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, subtotal: i.precio * i.cantidad }));
        const totals = calculateTotals();

        return {
            id: `F-${Date.now()}`,
            fecha,
            cliente,
            items,
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            nota: ''
        };
    }

    // Habilita botones de guardar/imprimir si hay una factura generada
    function setInvoiceAvailable(state){
        if(saveInvoiceBtn) saveInvoiceBtn.disabled = !state;
        if(printInvoiceBtn) printInvoiceBtn.disabled = !state;
    }

    // Guarda la factura en localStorage (simulación)
    function saveInvoice(invoice){
        const saved = JSON.parse(localStorage.getItem('invoices') || '[]');
        saved.push(invoice);
        localStorage.setItem('invoices', JSON.stringify(saved));
    }

    // Funciones para modificar cantidades y eliminar ítems desde el panel
    window.increaseInvoiceQty = function(productId){
        if(!window.cart) return;
        const item = window.cart.find(i => i.id === productId);
        const prod = (typeof getProductById === 'function') ? getProductById(productId) : null;
        if(item && (!prod || item.cantidad < (prod.stock || Infinity))){
            item.cantidad += 1;
            if(typeof renderCart === 'function') renderCart();
            else updateInvoicePanel();
        }
    }

    window.decreaseInvoiceQty = function(productId){
        if(!window.cart) return;
        const item = window.cart.find(i => i.id === productId);
        if(item){
            item.cantidad -= 1;
            if(item.cantidad <= 0){
                window.cart = window.cart.filter(i => i.id !== productId);
            }
            if(typeof renderCart === 'function') renderCart();
            else updateInvoicePanel();
        }
    }

    window.removeInvoiceItem = function(productId){
        if(!window.cart) return;
        window.cart = window.cart.filter(i => i.id !== productId);
        if(typeof renderCart === 'function') renderCart();
        else updateInvoicePanel();
    }

    // Imprime la factura abriendo una nueva ventana con HTML simple
    function printInvoice(invoice){
        const w = window.open('', '_blank');
        if(!w) return;
        const clienteHtml = invoice.cliente ? `<div><strong>Cliente:</strong> ${invoice.cliente.nombre} — ${invoice.cliente.documento}</div>` : '';
        let itemsHtml = '<table style="width:100%; border-collapse: collapse;">';
        itemsHtml += '<thead><tr><th style="border-bottom:1px solid #ccc; text-align:left;">Producto</th><th style="border-bottom:1px solid #ccc; text-align:right;">Cant.</th><th style="border-bottom:1px solid #ccc; text-align:right;">Subtotal</th></tr></thead>';
        itemsHtml += '<tbody>';
        invoice.items.forEach(it => {
            itemsHtml += `<tr><td style="padding:6px 0;">${it.nombre}</td><td style="text-align:right">${it.cantidad}</td><td style="text-align:right">$${it.subtotal.toFixed(2)}</td></tr>`;
        });
        itemsHtml += '</tbody></table>';

        const html = `
            <html>
            <head>
                <title>Factura ${invoice.id}</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding:20px;">
                <h2>MamaYoli - Factura</h2>
                <div><strong>ID:</strong> ${invoice.id}</div>
                <div><strong>Fecha:</strong> ${new Date(invoice.fecha).toLocaleString()}</div>
                ${clienteHtml}
                <hr>
                ${itemsHtml}
                <hr>
                <div style="display:flex; justify-content:space-between; font-weight:700;">
                    <div>Subtotal</div><div>$${invoice.subtotal.toFixed(2)}</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <div>IVA</div><div>$${invoice.tax.toFixed(2)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:1.2em; font-weight:800; margin-top:8px;">
                    <div>Total</div><div>$${invoice.total.toFixed(2)}</div>
                </div>
                <hr>
                <div>Gracias por su compra.</div>
            </body>
            </html>
        `;

        w.document.open();
        w.document.write(html);
        w.document.close();
        w.print();
    }

    // Eventos
    function setupEventListeners(){
        if(generateInvoiceBtn){
            generateInvoiceBtn.addEventListener('click', () => {
                if(!window.cart || window.cart.length === 0){
                    showTemporaryMessage('No hay items en la factura', 1500);
                    return;
                }
                if(!clienteSelect || !clienteSelect.value){
                    showTemporaryMessage('Selecciona un cliente antes de generar', 1500);
                    return;
                }
                currentInvoice = buildInvoiceObject();
                setInvoiceAvailable(true);
                showTemporaryMessage('Factura generada en memoria', 1200);
            });
        }

        if(saveInvoiceBtn){
            saveInvoiceBtn.addEventListener('click', () => {
                if(!currentInvoice){ showTemporaryMessage('No hay factura generada', 1200); return; }
                if(!clienteSelect || !clienteSelect.value){ showTemporaryMessage('Selecciona un cliente antes de guardar', 1500); return; }
                saveInvoice(currentInvoice);
                setInvoiceAvailable(false);
                // Vaciar carrito después de guardar factura
                if(window.cart){ window.cart = []; if(typeof renderCart === 'function') renderCart(); else updateInvoicePanel(); }
                updateInvoicePanel();
                showTemporaryMessage('Factura guardada localmente', 1500);
            });
        }

        if(printInvoiceBtn){
            printInvoiceBtn.addEventListener('click', () => {
                if(!currentInvoice){ alert('No hay factura generada.'); return; }
                printInvoice(currentInvoice);
            });
        }

        if(clearCartBtn){
            clearCartBtn.addEventListener('click', () => {
                if(confirm('¿Deseas vaciar el carrito?')){
                    if(window.cart){ window.cart = []; if(typeof renderCart === 'function') renderCart(); }
                    updateInvoicePanel();
                }
            });
        }

        // Cuando se cambia el cliente, no hacemos validaciones por ahora
        if(clienteSelect){
            clienteSelect.addEventListener('change', () => {});
        }
    }

    // Inicialización
    function init(){
        populateClients();
        updateInvoicePanel();
        setupEventListeners();
        setInvoiceAvailable(false);

        // Si `renderCart` existe en Logica.js, lo usamos para actualizar cuando cambie
        if(typeof renderCart === 'function'){
            // Interceptamos la función para también actualizar el panel cuando el carrito cambia
            const originalRenderCart = renderCart;
            renderCart = function(){
                originalRenderCart();
                updateInvoicePanel();
            }
        }
        // Aseguramos exponer la función si no fue expuesta antes
        window.updateInvoicePanel = updateInvoicePanel;
    }

    // Mensaje temporal no bloqueante para confirmar acciones al usuario
    function showTemporaryMessage(text, timeout = 1500){
        const containerId = 'tempMsgContainer';
        let container = document.getElementById(containerId);
        if(!container){
            container = document.createElement('div');
            container.id = containerId;
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '1060';
            document.body.appendChild(container);
        }

        const msg = document.createElement('div');
        msg.className = 'alert alert-success shadow-sm';
        msg.style.opacity = '0.95';
        msg.style.marginBottom = '8px';
        msg.textContent = text;
        container.appendChild(msg);

        setTimeout(() => {
            msg.classList.add('fade');
            msg.style.transition = 'opacity 300ms ease';
            msg.style.opacity = '0';
            setTimeout(() => { try{ container.removeChild(msg); }catch(e){} }, 350);
        }, timeout);
    }

    // Exponer la función para que Logica.js la pueda usar
    window.showInvoiceMessage = showTemporaryMessage;

    // Ejecutar init al cargar DOM
    document.addEventListener('DOMContentLoaded', init);

})();
