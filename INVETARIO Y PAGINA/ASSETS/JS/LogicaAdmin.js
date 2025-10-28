// ---------------------------------------------
        // ESTRUCTURA DE DATOS Y ESTADO GLOBAL (SIMULADO)
        // ---------------------------------------------
        
        let PRODUCTS = [
            // **IMPORTANTE:** Se añadió el campo 'costo' para la gestión administrativa.
            { id: 1, nombre: "Collar Dije de Luna", precio: 29.50, costo: 12.00, categoria: "Collares", stock: 5, descripcion: "Delicado collar plateado con dije de luna creciente y pequeña gema. Ideal para un look minimalista y elegante.", imagenesUrls: ["https://placehold.co/600x400/FBE5E6/D4AF37?text=MamaYoli+Collar+Luna", "https://placehold.co/600x400/E88D92/ffffff?text=Detalle+Gema", "https://placehold.co/600x400/D4AF37/ffffff?text=Puesto+en+Modelo"], activo: true },
            { id: 2, nombre: "Set de Aretes Minimalistas", precio: 18.00, costo: 6.50, categoria: "Aretes", stock: 12, descripcion: "Set de tres pares de pendientes de acero inoxidable en tonos dorados. Perfecto para perforaciones múltiples.", imagenesUrls: ["https://placehold.co/600x400/D4AF37/ffffff?text=MamaYoli+Aretes+Set", "https://placehold.co/600x400/FBE5E6/333333?text=Aretes+Minimal"], activo: true },
            { id: 3, nombre: "Pulsera de Cuentas Rosadas", precio: 8.50, costo: 3.00, categoria: "Pulseras", stock: 25, descripcion: "Pulsera elástica de cuentas de cuarzo rosa con un dije de corazón dorado. Combina con cualquier atuendo casual.", imagenesUrls: ["https://placehold.co/600x400/E88D92/ffffff?text=Pulsera+Cuarzo"], activo: true },
            { id: 4, nombre: "Anillo Ajustable de Flor", precio: 15.00, costo: 7.00, categoria: "Anillos", stock: 18, descripcion: "Anillo de plata con diseño floral ajustable, ideal para regalo. Suave y cómodo de llevar.", imagenesUrls: ["https://placehold.co/600x400/FBE5E6/D4AF37?text=Anillo+Flor"], activo: true },
            { id: 5, nombre: "Gargantilla de Perlas", precio: 35.00, costo: 15.00, categoria: "Collares", stock: 3, descripcion: "Gargantilla clásica con pequeñas perlas sintéticas y broche dorado. Elegancia atemporal.", imagenesUrls: ["https://placehold.co/600x400/D4AF37/ffffff?text=Gargantilla+Perlas"], activo: true },
            { id: 6, nombre: "Reloj Minimalista Rosado", precio: 59.99, costo: 25.00, categoria: "Accesorios", stock: 50, descripcion: "Reloj de pulsera con correa de cuero sintético rosado y marco dorado. Estilo discreto y moderno.", imagenesUrls: ["https://placehold.co/600x400/E88D92/ffffff?text=Reloj+Rosado"], activo: true },
            { id: 7, nombre: "Broche de Gema Grande (INACTIVO)", precio: 40.00, costo: 20.00, categoria: "Accesorios", stock: 1, descripcion: "Broche de solapa con una gran gema facetada en tonos amatistas.", imagenesUrls: ["https://placehold.co/600x400/FBE5E6/333333?text=Broche+Gema"], activo: false }, // Producto inactivo
            { id: 8, nombre: "Tobillera de Conchas", precio: 12.00, costo: 4.00, categoria: "Pulseras", stock: 0, descripcion: "Tobillera estilo playero con pequeñas conchas y detalles dorados.", imagenesUrls: ["https://placehold.co/600x400/D4AF37/ffffff?text=Tobillera+Conchas"], activo: true } // Producto agotado
        ];
        
        let CATEGORIES = ['Collares', 'Aretes', 'Pulseras', 'Anillos', 'Accesorios', 'Pendientes'];
        let currentProductMode = 'create'; // 'create' o 'edit'
        let currentEditingId = null; 
        
        const STOCK_LOW_THRESHOLD = 5;
        
        // Referencias del DOM
        const inventoryTableBody = document.getElementById('inventoryTableBody');
        const productCrudModal = new bootstrap.Modal(document.getElementById('productCrudModal'));
        const categoriesModal = new bootstrap.Modal(document.getElementById('categoriesModal'));
        const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));

        // ---------------------------------------------
        // AUTENTICACIÓN Y SEGURIDAD (Simulación)
        // ---------------------------------------------
        
        // Función para verificar si el usuario está autenticado (Simulación)
        function checkAuth() {
            // En una aplicación real, aquí se verificaría un token de sesión.
            // Para la prueba local, asumimos que si llega aquí es porque pasó el login.
            // Sin embargo, por seguridad, si no hay un estado de sesión, redirigir.
            // Nota: Como la redirección se hizo en login.html, aquí solo inicializamos.
        }

        /**
         * Simula el cierre de sesión y redirige.
         */
        window.logout = function() {
            // En una app real: limpiar token/sesión de Firebase Auth
            console.log("Sesión cerrada. Redirigiendo a login.html...");
            window.location.href = 'login.html';
        };

        // ---------------------------------------------
        // INICIALIZACIÓN
        // ---------------------------------------------

        document.addEventListener('DOMContentLoaded', () => {
            checkAuth(); // Verifica la sesión (simulada)
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
            
            loadAllData();
            
            // Asignar listeners
            document.getElementById('productForm').addEventListener('submit', handleProductFormSubmit);
            document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
            document.getElementById('adminSearchInput').addEventListener('input', (e) => filterProducts(e.target.value.trim()));
            document.getElementById('productCrudModal').addEventListener('hidden.bs.modal', clearProductForm);
        });

        function loadAllData() {
            renderProductTable(PRODUCTS);
            updateDashboardMetrics();
            renderCategoryOptions(); // Actualiza el dropdown
            renderCategoryList(); // Actualiza el modal de categorías
        }

        // ---------------------------------------------
        // GESTIÓN DE PRODUCTOS (CRUD)
        // ---------------------------------------------

        /**
         * Renderiza la tabla de productos en el DOM.
         * @param {Array<Object>} productList Lista de productos a mostrar.
         */
        function renderProductTable(productList) {
            inventoryTableBody.innerHTML = ''; // Limpiar tabla
            
            if (productList.length === 0) {
                document.getElementById('noResultsAdmin').classList.remove('d-none');
                return;
            } else {
                document.getElementById('noResultsAdmin').classList.add('d-none');
            }

            productList.forEach(product => {
                const isLowStock = product.stock <= STOCK_LOW_THRESHOLD && product.stock > 0;
                const isOutOfStock = product.stock === 0;

                const stockClass = isOutOfStock ? 'text-danger fw-bold' : (isLowStock ? 'text-stock-low' : 'text-success');
                const stockText = isOutOfStock ? 'AGOTADO' : product.stock;
                
                const publishedIcon = product.activo 
                    ? `<i data-lucide="eye" class="text-success" style="width: 18px;"></i> Sí` 
                    : `<i data-lucide="eye-off" class="text-danger" style="width: 18px;"></i> No`;

                const row = `
                    <tr onclick="viewDetails(${product.id})" style="cursor: pointer;">
                        <th scope="row">${product.id}</th>
                        <td><img src="${product.imagenesUrls[0] || 'https://placehold.co/50x50'}" alt="${product.nombre}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                        <td>${product.nombre}</td>
                        <td>${product.categoria}</td>
                        <td class="${stockClass}">${stockText}</td>
                        <td>$${product.precio.toFixed(2)}</td>
                        <td>${publishedIcon}</td>
                        <td></td>
                    </tr>
                `;
                inventoryTableBody.insertAdjacentHTML('beforeend', row);
            });
            
            // Re-crear iconos
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }
        
        /**
         * Abre el modal de producto en modo Crear o Editar.
         * @param {string} mode 'create' o 'edit'.
         * @param {number} [productId] ID del producto si es modo 'edit'.
         */
        window.openProductModal = function(mode, productId = null) {
            currentProductMode = mode;
            currentEditingId = productId;
            clearProductForm();
            
            const modalTitle = document.getElementById('productCrudModalLabel');
            const deleteBtn = document.getElementById('deleteProductBtn');

            if (mode === 'edit') {
                modalTitle.textContent = 'Editar Producto Existente';
                deleteBtn.style.display = 'inline-block';
                loadProductData(productId);
            } else {
                modalTitle.textContent = 'Crear Nuevo Producto';
                deleteBtn.style.display = 'none';
            }
            
            productCrudModal.show();
        };

        /**
         * Carga los datos de un producto en el formulario para editar.
         * @param {number} id 
         */
        function loadProductData(id) {
            const product = PRODUCTS.find(p => p.id === id);
            if (!product) return;

            document.getElementById('productIdHidden').value = product.id;
            document.getElementById('productName').value = product.nombre;
            document.getElementById('productCategory').value = product.categoria;
            document.getElementById('productCosto').value = product.costo.toFixed(2);
            document.getElementById('productPrecio').value = product.precio.toFixed(2);
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productDescription').value = product.descripcion;
            document.getElementById('productActivo').checked = product.activo;

            // Renderizar carrusel de imágenes en el modal admin
            renderAdminImageCarousel(product.imagenesUrls);

            calculateProfit();
        }

        // Renderiza el carrusel editable de imágenes en el modal admin
        function renderAdminImageCarousel(imageUrls) {
            const container = document.getElementById('adminImageCarouselContainer');
            if (!container) return;
            let html = '';
            if (!imageUrls || imageUrls.length === 0) {
                html = `<div class="d-flex justify-content-center align-items-center" style="width:100%;aspect-ratio:1/1;min-height:250px;background:#f3f3f3;border-radius:1rem;">
                    <i data-lucide="image" style="width:64px;height:64px;color:#ccc;"></i>
                </div>`;
            } else {
                html += `<div id="adminImageCarousel" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-inner">
                `;
                imageUrls.forEach((url, idx) => {
                    html += `
                        <div class="carousel-item${idx === 0 ? ' active' : ''}">
                            <div class="position-relative text-center">
                                <img src="${url}" class="d-block w-100 rounded-3" style="max-height: 250px; object-fit: cover; margin:auto;">
                                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2" onclick="removeAdminImage(${idx})" title="Eliminar Imagen">
                                    <i data-lucide='trash' style='width:16px;'></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
                if (imageUrls.length > 1) {
                    html += `
                        <button class="carousel-control-prev" type="button" data-bs-target="#adminImageCarousel" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Anterior</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#adminImageCarousel" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Siguiente</span>
                        </button>
                    `;
                }
                html += `</div>`;
            }
            container.innerHTML = html;
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }

        // Elimina una imagen del producto en edición
        window.removeAdminImage = function(idx) {
            const id = document.getElementById('productIdHidden').value;
            const product = PRODUCTS.find(p => p.id == id);
            if (!product) return;
            product.imagenesUrls.splice(idx, 1);
            renderAdminImageCarousel(product.imagenesUrls);
        }

        // Listener para agregar nueva imagen
        document.addEventListener('DOMContentLoaded', () => {
            const addImageBtn = document.getElementById('addImageToCarouselBtn');
            if (addImageBtn) {
                addImageBtn.onclick = function() {
                    const id = document.getElementById('productIdHidden').value;
                    const product = PRODUCTS.find(p => p.id == id);
                    if (!product) return;
                    if (product.imagenesUrls.length >= 10) {
                        alert('Máximo 10 imágenes por producto.');
                        return;
                    }
                    const url = prompt('Ingrese la URL de la nueva imagen:');
                    if (url && url.trim().length > 0) {
                        product.imagenesUrls.push(url.trim());
                        renderAdminImageCarousel(product.imagenesUrls);
                    }
                };
            }
        });

        /**
         * Maneja el envío del formulario (Crear o Editar).
         */
        function handleProductFormSubmit(e) {
            e.preventDefault();
            
            const form = e.target;
            const id = form.productIdHidden.value ? parseInt(form.productIdHidden.value) : null;
            const costo = parseFloat(form.productCosto.value);
            const precio = parseFloat(form.productPrecio.value);
            
            // Validaciones básicas
            if (costo > precio) {
                alert('El precio de venta no puede ser menor al costo.');
                return;
            }

            // Recoger URLs de imágenes (limpiar vacías)
            const imageUrls = Array.from(document.querySelectorAll('#imageUrlsContainer input'))
                .map(input => input.value.trim())
                .filter(url => url.length > 0);

            const newProductData = {
                id: id || Date.now(), // Usar timestamp como ID temporal para nuevos productos
                nombre: form.productName.value.trim(),
                categoria: form.productCategory.value,
                costo: costo,
                precio: precio,
                stock: parseInt(form.productStock.value),
                descripcion: form.productDescription.value.trim(),
                activo: form.productActivo.checked,
                imagenesUrls: imageUrls
            };

            if (currentProductMode === 'create') {
                PRODUCTS.push(newProductData);
                console.log("Producto Creado:", newProductData);
            } else {
                const index = PRODUCTS.findIndex(p => p.id === currentEditingId);
                if (index !== -1) {
                    PRODUCTS[index] = newProductData;
                    console.log("Producto Editado:", newProductData);
                }
            }

            productCrudModal.hide();
            loadAllData(); // Refrescar la tabla y métricas
        }

        /**
         * Limpia el formulario y lo resetea al modo crear.
         */
        function clearProductForm() {
            document.getElementById('productForm').reset();
            document.getElementById('productIdHidden').value = '';
            document.getElementById('productGanancia').value = '';
            // Limpiar campos de URL
            document.querySelectorAll('#imageUrlsContainer input').forEach(input => input.value = '');
        }

        /**
         * Muestra el modal de confirmación de eliminación.
         * @param {number} id 
         * @param {string} name 
         */
        window.showConfirmDeleteModal = function(id = currentEditingId, name = '') {
            if (!id) return;
            
            const productToDelete = PRODUCTS.find(p => p.id === id);
            
            // Si viene desde la tabla, actualiza el currentEditingId
            if (id !== currentEditingId) {
                currentEditingId = id;
            }

            document.getElementById('productToDeleteName').textContent = productToDelete.nombre;
            confirmDeleteModal.show();
            // Cerrar el modal de CRUD si está abierto
            productCrudModal.hide();
        };

        /**
         * Ejecuta la eliminación del producto.
         */
        window.deleteProductConfirmed = function() {
            PRODUCTS = PRODUCTS.filter(p => p.id !== currentEditingId);
            
            confirmDeleteModal.hide();
            loadAllData();
            currentEditingId = null;
            console.log("Producto eliminado.");
        };

        /**
         * Filtra la tabla de productos basándose en la búsqueda.
         */
        function filterProducts(searchTerm = '') {
            let filtered;
            if (searchTerm === 'stockbajo') {
                filtered = PRODUCTS.filter(product => product.stock <= 5 || product.stock === 0);
            } else if (searchTerm === 'unpublished') {
                filtered = PRODUCTS.filter(product => !product.activo);
            } else {
                const term = searchTerm.toLowerCase();
                filtered = PRODUCTS.filter(product => 
                    product.nombre.toLowerCase().includes(term) ||
                    product.categoria.toLowerCase().includes(term) ||
                    product.id.toString().includes(term) ||
                    product.descripcion.toLowerCase().includes(term)
                );
            }
            renderProductTable(filtered);
        }

        // ---------------------------------------------
        // GESTIÓN DE CATEGORÍAS
        // ---------------------------------------------
        
        /**
         * Renderiza el dropdown de categorías.
         */
        function renderCategoryOptions() {
            const select = document.getElementById('productCategory');
            if (!select) return;

            select.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
            CATEGORIES.sort().forEach(cat => {
                select.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
            document.getElementById('totalCategoriesCount').textContent = CATEGORIES.length;
        }

        /**
         * Renderiza la lista en el modal de categorías.
         */
        function renderCategoryList() {
            const list = document.getElementById('categoriesList');
            if (!list) return;

            list.innerHTML = '';
            CATEGORIES.sort().forEach(cat => {
                const item = `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${cat}
                        <button class="btn btn-sm btn-danger btn-circle" onclick="removeCategory('${cat}')" title="Eliminar Categoría">
                            <i data-lucide="x" style="width: 16px;"></i>
                        </button>
                    </li>
                `;
                list.insertAdjacentHTML('beforeend', item);
            });
            // Re-crear iconos de Lucide
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }
        
        /**
         * Agrega una nueva categoría.
         */
        function addCategory() {
            const input = document.getElementById('newCategoryInput');
            const newCat = input.value.trim();
            if (newCat && !CATEGORIES.includes(newCat)) {
                CATEGORIES.push(newCat);
                input.value = '';
                loadAllData();
                console.log("Categoría añadida:", newCat);
            } else if (newCat) {
                alert(`La categoría "${newCat}" ya existe.`);
            }
        }
        
        /**
         * Elimina una categoría si no está en uso.
         * NOTA: En un proyecto real, se debe prevenir la eliminación si hay productos vinculados. Aquí no se previene.
         */
        window.removeCategory = function(cat) {
            if (confirm(`¿Seguro que quieres eliminar la categoría "${cat}"? Los productos asociados quedarán sin categoría.`)) {
                CATEGORIES = CATEGORIES.filter(c => c !== cat);
                loadAllData();
                console.log("Categoría eliminada:", cat);
            }
        }

        // ---------------------------------------------
        // MÉTRICAS Y UTILIDADES
        // ---------------------------------------------

        /**
         * Calcula y muestra la ganancia en el formulario.
         */
        window.calculateProfit = function() {
            const costo = parseFloat(document.getElementById('productCosto').value);
            const precio = parseFloat(document.getElementById('productPrecio').value);
            const gananciaInput = document.getElementById('productGanancia');
            
            if (!isNaN(costo) && !isNaN(precio)) {
                const ganancia = precio - costo;
                gananciaInput.value = `$${ganancia.toFixed(2)}`;
                gananciaInput.classList.remove('bg-danger', 'text-white');
                gananciaInput.classList.add(ganancia >= 0 ? 'bg-light' : 'bg-danger', ganancia >= 0 ? 'text-dark' : 'text-white');
            } else {
                gananciaInput.value = '';
            }
        }

        /**
         * Actualiza los contadores del dashboard.
         */
        function updateDashboardMetrics() {
            const total = PRODUCTS.length;
            const lowStock = PRODUCTS.filter(p => p.stock <= STOCK_LOW_THRESHOLD).length;
            const published = PRODUCTS.filter(p => p.activo).length;
            const unpublished = PRODUCTS.filter(p => !p.activo).length;

            document.getElementById('totalProductsCount').textContent = total;
            document.getElementById('lowStockCount').textContent = lowStock;
            document.getElementById('publishedCount').textContent = published;
            document.getElementById('unpublishedCount').textContent = unpublished;
            document.getElementById('totalCategoriesCount').textContent = CATEGORIES.length;
        }

        /**
         * Genera los campos de URL para las imágenes.
         * @param {number} count Número de campos a generar.
         */
        function generateImageURLFields(count) {
            const container = document.getElementById('imageUrlsContainer');
            let html = '';
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="mb-2">
                        <label for="imageUrl${i}" class="form-label small text-muted">URL Imagen ${i + 1}${i === 0 ? ' (Principal)' : ''}</label>
                        <input type="url" class="form-control rounded-pill" id="imageUrl${i}">
                    </div>
                `;
            }
            container.innerHTML = html;
        }
        
        /**
         * Muestra el detalle de un producto en un modal (versión simplificada para admin).
         * @param {number} id - ID del producto.
         */
        window.viewDetails = function(id) {
            // En la administración, "Ver Detalle" es simplemente abrir el modal en modo edición.
            openProductModal('edit', id);
        }