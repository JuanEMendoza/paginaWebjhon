// Configuración de la API (evitar redeclaración)
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://apijhon.onrender.com';
}
if (typeof window.APP_ENDPOINTS === 'undefined') {
    window.APP_ENDPOINTS = typeof CONFIG !== 'undefined' ? CONFIG.ENDPOINTS : {
        usuarios: '/api/usuarios',
        productos: '/api/productos',
        pedidos: '/api/pedidos',
        pedido_detalle: '/api/pedido_detalle',
        pagos: '/api/pagos'
    };
}
const API_BASE_URL = window.API_BASE_URL;
const ENDPOINTS = window.APP_ENDPOINTS;

// Estado de la aplicación
const appState = {
    currentSection: 'dashboard',
    users: [],
    products: [],
    orders: [],
    orderDetails: [],
    payments: [],
    currentUser: null,
    currentProduct: null,
    currentOrder: null
};

// Funciones helper para mapear datos de la API
function mapUsuarioFromAPI(usuario) {
    return {
        id: usuario.id_usuario,
        name: usuario.nombre,
        email: usuario.correo,
        phone: usuario.telefono,
        password: usuario.contrasena,
        address: usuario.direccion,
        photo: usuario.foto_perfil,
        role: usuario.rol,
        status: usuario.estado === 'activo' ? 'active' : 'inactive',
        createdAt: usuario.fecha_registro
    };
}

function mapUsuarioToAPI(usuario) {
    return {
        nombre: usuario.name,
        correo: usuario.email,
        telefono: usuario.phone,
        contrasena: usuario.password,
        direccion: usuario.address || '',
        foto_perfil: usuario.photo || '',
        rol: usuario.role || 'usuario',
        estado: usuario.status === 'active' ? 'activo' : 'inactivo'
    };
}

function mapProductoFromAPI(producto) {
    return {
        id: producto.id_producto,
        name: producto.nombre,
        description: producto.descripcion,
        price: producto.precio,
        stock: producto.stock,
        category: producto.categoria,
        image: producto.imagen,
        status: producto.estado,
        createdAt: producto.fecha_creacion,
        sales: 0 // Se calculará desde pedido_detalle
    };
}

function mapProductoToAPI(producto) {
    return {
        nombre: producto.name,
        descripcion: producto.description,
        precio: producto.price,
        stock: producto.stock,
        categoria: producto.category || '',
        imagen: producto.image || '',
        estado: producto.status || 'activo'
    };
}

function mapPedidoFromAPI(pedido, usuario = null) {
    return {
        id: pedido.id_pedido,
        userId: pedido.id_usuario,
        userName: usuario ? usuario.nombre : `Usuario ${pedido.id_usuario}`,
        date: pedido.fecha_pedido,
        total: pedido.total,
        status: pedido.estado,
        address: pedido.direccion_envio,
        paymentMethodId: pedido.id_metodo,
        products: []
    };
}

// Función para hacer peticiones a la API
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Algunos endpoints pueden devolver texto vacío en DELETE
        const text = await response.text();
        if (!text) {
            return null;
        }

        return JSON.parse(text);
    } catch (error) {
        console.error('Error en petición API:', error);
        
        // Detectar errores de CORS
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.name === 'TypeError') {
            // Verificar si estamos en producción (Render) o desarrollo local
            const isProduction = window.location.protocol === 'https:' || 
                                window.location.hostname.includes('render.com') ||
                                window.location.hostname.includes('onrender.com');
            
            if (isProduction) {
                const corsError = new Error('Error de conexión: La API puede no tener CORS configurado. Verifica que la API permita peticiones desde este dominio.');
                corsError.isCorsError = true;
                throw corsError;
            } else {
                const corsError = new Error('Error de CORS: Debes abrir la aplicación desde un servidor local (http://localhost:8000). Ver README.md para instrucciones.');
                corsError.isCorsError = true;
                throw corsError;
            }
        }
        
        throw error;
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación antes de inicializar
    if (typeof window.auth === 'undefined') {
        window.location.href = 'login.html';
        return;
    }
    
    if (!window.auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Si está autenticado, inicializar la aplicación
    initializeApp();
    setupAuth();
});

// Configurar funcionalidades de autenticación
function setupAuth() {
    // Mostrar nombre del usuario
    const currentUser = window.auth.getCurrentUser();
    if (currentUser) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = currentUser.nombre || 'Administrador';
        }
    }

    // Configurar botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                window.auth.logout();
            }
        });
    }
}

function initializeApp() {
    setupNavigation();
    setupModals();
    setupForms();
    setupFilters();
    loadDashboard();
}

// Navegación
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
            
            // Actualizar clase activa
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Toggle sidebar en móvil
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Cerrar sidebar al hacer click fuera en móvil
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

function switchSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.add('active');
        document.getElementById('pageTitle').textContent = getSectionTitle(section);
        appState.currentSection = section;

        // Cargar datos según la sección
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'users':
                loadUsers();
                break;
            case 'products':
                loadProducts();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'reports':
                loadReports();
                break;
        }
    }
}

function getSectionTitle(section) {
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Gestión de Usuarios',
        'products': 'Gestión de Productos',
        'orders': 'Gestión de Pedidos',
        'reports': 'Reportes y Estadísticas'
    };
    return titles[section] || 'Dashboard';
}

// Modales
function setupModals() {
    // User Modal
    const userModal = document.getElementById('userModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const closeUserModal = document.getElementById('closeUserModal');
    const cancelUserBtn = document.getElementById('cancelUserBtn');

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserModal());
    }
    if (closeUserModal) {
        closeUserModal.addEventListener('click', () => closeModal('userModal'));
    }
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', () => closeModal('userModal'));
    }

    // Product Modal
    const productModal = document.getElementById('productModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeProductModal = document.getElementById('closeProductModal');
    const cancelProductBtn = document.getElementById('cancelProductBtn');

    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openProductModal());
    }
    if (closeProductModal) {
        closeProductModal.addEventListener('click', () => closeModal('productModal'));
    }
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => closeModal('productModal'));
    }

    // Order Detail Modal
    const closeOrderDetailModal = document.getElementById('closeOrderDetailModal');
    const cancelOrderDetailBtn = document.getElementById('cancelOrderDetailBtn');
    const updateOrderStatusBtn = document.getElementById('updateOrderStatusBtn');

    if (closeOrderDetailModal) {
        closeOrderDetailModal.addEventListener('click', () => closeModal('orderDetailModal'));
    }
    if (cancelOrderDetailBtn) {
        cancelOrderDetailBtn.addEventListener('click', () => closeModal('orderDetailModal'));
    }
    if (updateOrderStatusBtn) {
        updateOrderStatusBtn.addEventListener('click', () => updateOrderStatus());
    }

    // User History Modal
    const closeUserHistoryModal = document.getElementById('closeUserHistoryModal');
    if (closeUserHistoryModal) {
        closeUserHistoryModal.addEventListener('click', () => closeModal('userHistoryModal'));
    }

    // Confirm Modal
    const closeConfirmModal = document.getElementById('closeConfirmModal');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (closeConfirmModal) {
        closeConfirmModal.addEventListener('click', () => closeModal('confirmModal'));
    }
    if (cancelConfirmBtn) {
        cancelConfirmBtn.addEventListener('click', () => closeModal('confirmModal'));
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => executeDelete());
    }

    // Cerrar modal al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

async function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');
    
    if (user) {
        title.textContent = 'Editar Usuario';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userAddress').value = user.address || '';
        document.getElementById('userRole').value = user.role || 'cliente';
        document.getElementById('userStatus').value = user.status || 'active';
        document.getElementById('userPassword').required = false;
        document.getElementById('userPassword').placeholder = 'Dejar vacío para mantener la contraseña actual';
        document.getElementById('userPassword').value = '';
    } else {
        title.textContent = 'Agregar Usuario';
        form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('userPassword').placeholder = '';
        document.getElementById('userRole').value = 'cliente';
        document.getElementById('userStatus').value = 'active';
    }
    
    openModal('userModal');
}

function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    
    if (product) {
        title.textContent = 'Editar Producto';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productStock').value = product.stock || '';
        document.getElementById('productImage').value = product.image || '';
    } else {
        title.textContent = 'Agregar Producto';
        form.reset();
        document.getElementById('productId').value = '';
    }
    
    openModal('productModal');
}

// Formularios
function setupForms() {
    // User Form
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUser();
        });
    }

    // Product Form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProduct();
        });
    }
}

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('userPassword').value;
    
    try {
        if (userId) {
            // Actualizar usuario existente
            const usuario = await apiRequest(`${ENDPOINTS.usuarios}/${userId}`);
            if (!usuario) {
                alert('Usuario no encontrado');
                return;
            }

            // Actualizar solo los campos que han cambiado
            const updatedUser = {
                ...usuario,
                nombre: document.getElementById('userName').value,
                correo: document.getElementById('userEmail').value,
                telefono: document.getElementById('userPhone').value,
                direccion: document.getElementById('userAddress').value || '',
                rol: document.getElementById('userRole').value,
                estado: document.getElementById('userStatus').value === 'active' ? 'activo' : 'inactivo'
            };

            // Solo actualizar contraseña si se proporciona una nueva
            if (password && password.trim() !== '') {
                updatedUser.contrasena = password;
            }

            await apiRequest(`${ENDPOINTS.usuarios}/${userId}`, 'PUT', updatedUser);
            alert('Usuario actualizado correctamente');
        } else {
            // Crear nuevo usuario
            if (!password || password.trim() === '') {
                alert('La contraseña es requerida para nuevos usuarios');
                return;
            }

            const newUser = {
                nombre: document.getElementById('userName').value,
                correo: document.getElementById('userEmail').value,
                telefono: document.getElementById('userPhone').value,
                contrasena: password,
                direccion: document.getElementById('userAddress').value || '',
                rol: document.getElementById('userRole').value,
                estado: document.getElementById('userStatus').value === 'active' ? 'activo' : 'inactivo',
                foto_perfil: ''
            };

            await apiRequest(ENDPOINTS.usuarios, 'POST', newUser);
            alert('Usuario creado correctamente');
        }
        
        closeModal('userModal');
        loadUsers();
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        alert('Error al guardar usuario: ' + error.message);
    }
}

async function saveProduct() {
    const productId = document.getElementById('productId').value;
    
    try {
        if (productId) {
            // Actualizar producto existente
            const producto = await apiRequest(`${ENDPOINTS.productos}/${productId}`);
            if (!producto) {
                alert('Producto no encontrado');
                return;
            }

            const updatedProduct = {
                ...producto,
                nombre: document.getElementById('productName').value,
                descripcion: document.getElementById('productDescription').value,
                precio: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                imagen: document.getElementById('productImage').value || producto.imagen || ''
            };

            await apiRequest(`${ENDPOINTS.productos}/${productId}`, 'PUT', updatedProduct);
            alert('Producto actualizado correctamente');
        } else {
            // Crear nuevo producto
            const newProduct = {
                nombre: document.getElementById('productName').value,
                descripcion: document.getElementById('productDescription').value,
                precio: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                imagen: document.getElementById('productImage').value || '',
                categoria: '',
                estado: 'activo'
            };

            await apiRequest(ENDPOINTS.productos, 'POST', newProduct);
            alert('Producto creado correctamente');
        }
        
        closeModal('productModal');
        loadProducts();
    } catch (error) {
        console.error('Error al guardar producto:', error);
        alert('Error al guardar producto: ' + error.message);
    }
}

// Filtros y búsquedas
function setupFilters() {
    // User filters
    const userSearch = document.getElementById('userSearch');
    const userFilter = document.getElementById('userFilter');
    
    if (userSearch) {
        userSearch.addEventListener('input', () => filterUsers());
    }
    if (userFilter) {
        userFilter.addEventListener('change', () => filterUsers());
    }

    // Product filters
    const productSearch = document.getElementById('productSearch');
    const productFilter = document.getElementById('productFilter');
    
    if (productSearch) {
        productSearch.addEventListener('input', () => filterProducts());
    }
    if (productFilter) {
        productFilter.addEventListener('change', () => filterProducts());
    }

    // Order filters
    const orderSearch = document.getElementById('orderSearch');
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    
    if (orderSearch) {
        orderSearch.addEventListener('input', () => filterOrders());
    }
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', () => filterOrders());
    }
}

// Cargar datos
async function loadDashboard() {
    try {
        // Cargar datos en paralelo
        const [users, products, orders] = await Promise.all([
            apiRequest(ENDPOINTS.usuarios),
            apiRequest(ENDPOINTS.productos),
            apiRequest(ENDPOINTS.pedidos)
        ]);

        // Calcular estadísticas
        const totalUsers = users ? users.length : 0;
        const totalProducts = products ? products.length : 0;
        const totalOrders = orders ? orders.length : 0;
        const totalSales = orders ? orders.reduce((sum, order) => sum + (order.total || 0), 0) : 0;

        updateDashboardStats({
            totalUsers,
            totalProducts,
            totalOrders,
            totalSales
        });

        // Obtener pedidos recientes (últimos 5)
        let recentOrders = [];
        if (orders && orders.length > 0) {
            // Obtener información de usuarios para los pedidos
            const usersMap = {};
            if (users) {
                users.forEach(user => {
                    usersMap[user.id_usuario] = user;
                });
            }

            recentOrders = orders
                .sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido))
                .slice(0, 5)
                .map(order => mapPedidoFromAPI(order, usersMap[order.id_usuario]));
        }

        displayRecentOrders(recentOrders);

        // Obtener productos más vendidos
        // Necesitamos cargar pedido_detalle para calcular ventas
        try {
            const orderDetails = await apiRequest(ENDPOINTS.pedido_detalle);
            const productSales = {};
            
            if (orderDetails) {
                orderDetails.forEach(detail => {
                    if (!productSales[detail.id_producto]) {
                        productSales[detail.id_producto] = 0;
                    }
                    productSales[detail.id_producto] += detail.cantidad || 0;
                });
            }

            // Agregar ventas a productos
            let topProducts = [];
            if (products) {
                topProducts = products
                    .map(product => {
                        const mapped = mapProductoFromAPI(product);
                        mapped.sales = productSales[product.id_producto] || 0;
                        return mapped;
                    })
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5);
            }

            displayTopProducts(topProducts);
        } catch (error) {
            console.error('Error al cargar detalles de pedidos:', error);
            displayTopProducts([]);
        }
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        
        // Mostrar mensaje de error CORS si aplica
        if (error.isCorsError) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'card';
            errorDiv.style.cssText = 'background: #fee2e2; border: 2px solid #ef4444; padding: 20px; margin-bottom: 20px;';
            errorDiv.innerHTML = `
                <h3 style="color: #991b1b; margin-bottom: 10px;">⚠️ Error de CORS</h3>
                <p style="color: #991b1b; margin-bottom: 10px;">
                    La aplicación debe ejecutarse desde un servidor local para evitar errores de CORS.
                </p>
                <p style="color: #991b1b; margin-bottom: 10px;">
                    <strong>Soluciones:</strong>
                </p>
                <ul style="color: #991b1b; margin-left: 20px;">
                    <li>Ejecuta <code>python server.py</code> o <code>start-server.bat</code></li>
                    <li>Abre <a href="http://localhost:8000" target="_blank" style="color: #2563eb;">http://localhost:8000</a> en tu navegador</li>
                    <li>O usa: <code>python -m http.server 8000</code></li>
                </ul>
            `;
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                dashboard.insertBefore(errorDiv, dashboard.firstChild);
            }
        }
        
        updateDashboardStats({
            totalUsers: 0,
            totalProducts: 0,
            totalOrders: 0,
            totalSales: 0
        });
        displayRecentOrders([]);
        displayTopProducts([]);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
    document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
    document.getElementById('totalSales').textContent = `$${stats.totalSales?.toLocaleString() || 0}`;
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrders');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay pedidos recientes</p>';
        return;
    }

    container.innerHTML = orders.slice(0, 5).map(order => {
        const statusClass = getStatusBadgeClass(order.status);
        return `
        <div class="order-item">
            <div class="order-item-info">
                <h4>Pedido #${order.id}</h4>
                <p>${order.userName} - ${formatDate(order.date)}</p>
            </div>
            <div>
                <span class="badge ${statusClass}">${getStatusLabel(order.status)}</span>
                <strong>$${order.total?.toLocaleString()}</strong>
            </div>
        </div>
        `;
    }).join('');
}

function displayTopProducts(products) {
    const container = document.getElementById('topProducts');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = products.slice(0, 5).map(product => `
        <div class="product-item">
            <img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}">
            <div class="product-item-info">
                <h4>${product.name}</h4>
                <p>${product.description?.substring(0, 50)}...</p>
            </div>
            <div class="product-item-sales">${product.sales || 0} ventas</div>
        </div>
    `).join('');
}

async function loadUsers() {
    try {
        const usuarios = await apiRequest(ENDPOINTS.usuarios);
        const users = usuarios ? usuarios.map(mapUsuarioFromAPI) : [];
        appState.users = users;
        displayUsers(users);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        const errorMessage = error.isCorsError 
            ? 'Error de CORS: Abre la aplicación desde http://localhost:8000 usando el servidor local (ver README.md)'
            : 'Error al cargar usuarios: ' + error.message;
        document.getElementById('usersTableBody').innerHTML = 
            `<tr><td colspan="8" class="empty-state" style="color: #ef4444;">${errorMessage}</td></tr>`;
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay usuarios registrados</td></tr>';
        return;
    }

    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Crear filas con event listeners
    users.forEach(user => {
        const roleBadge = user.role === 'administrador' ? 'badge-info' : 'badge-secondary';
        const roleLabel = user.role === 'administrador' ? 'Administrador' : 'Cliente';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name || '-'}</td>
            <td>${user.email || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td><span class="badge ${roleBadge}">${roleLabel}</span></td>
            <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" data-action="history" data-id="${user.id}" title="Ver historial">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="action-btn edit" data-action="edit" data-id="${user.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn ${user.status === 'active' ? 'delete' : 'edit'}" 
                            data-action="${user.status === 'active' ? 'deactivate' : 'activate'}" 
                            data-id="${user.id}"
                            title="${user.status === 'active' ? 'Desactivar' : 'Activar'}">
                        <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="action-btn delete" data-action="delete" data-type="user" data-id="${user.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Agregar event listeners
        const buttons = row.querySelectorAll('[data-action]');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const id = parseInt(this.getAttribute('data-id'));
                const type = this.getAttribute('data-type');
                
                switch(action) {
                    case 'history':
                        viewUserHistory(id);
                        break;
                    case 'edit':
                        editUser(id);
                        break;
                    case 'activate':
                        activateUser(id);
                        break;
                    case 'deactivate':
                        deactivateUser(id);
                        break;
                    case 'delete':
                        confirmDelete(type || 'user', id);
                        break;
                }
            });
        });
        
        tbody.appendChild(row);
    });
}

function filterUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const filter = document.getElementById('userFilter').value;
    
    let filtered = appState.users.filter(user => {
        const matchesSearch = !search || 
            user.name?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.phone?.toLowerCase().includes(search) ||
            user.role?.toLowerCase().includes(search) ||
            user.address?.toLowerCase().includes(search);
        
        const matchesFilter = filter === 'all' || user.status === filter;
        
        return matchesSearch && matchesFilter;
    });
    
    displayUsers(filtered);
}

async function loadProducts() {
    try {
        const productos = await apiRequest(ENDPOINTS.productos);
        let products = productos ? productos.map(mapProductoFromAPI) : [];
        
        // Calcular ventas por producto desde pedido_detalle
        try {
            const orderDetails = await apiRequest(ENDPOINTS.pedido_detalle);
            const productSales = {};
            
            if (orderDetails) {
                orderDetails.forEach(detail => {
                    if (!productSales[detail.id_producto]) {
                        productSales[detail.id_producto] = 0;
                    }
                    productSales[detail.id_producto] += detail.cantidad || 0;
                });
            }

            // Agregar ventas a productos
            products = products.map(product => {
                product.sales = productSales[product.id] || 0;
                return product;
            });
        } catch (error) {
            console.error('Error al cargar ventas de productos:', error);
        }
        
        appState.products = products;
        displayProducts(products);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('productsTableBody').innerHTML = 
            '<tr><td colspan="8" class="empty-state">Error al cargar productos: ' + error.message + '</td></tr>';
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay productos registrados</td></tr>';
        return;
    }

    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Crear filas con event listeners
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}"></td>
            <td>${product.name || '-'}</td>
            <td>${product.description?.substring(0, 50)}${product.description?.length > 50 ? '...' : ''}</td>
            <td>$${product.price?.toLocaleString() || '0'}</td>
            <td><span class="badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}">${product.stock || 0}</span></td>
            <td>${product.sales || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" data-action="edit" data-id="${product.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-action="delete" data-type="product" data-id="${product.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Agregar event listeners
        const buttons = row.querySelectorAll('[data-action]');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const id = parseInt(this.getAttribute('data-id'));
                const type = this.getAttribute('data-type');
                
                if (action === 'edit') {
                    editProduct(id);
                } else if (action === 'delete') {
                    confirmDelete(type, id);
                }
            });
        });
        
        tbody.appendChild(row);
    });
}

function filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const filter = document.getElementById('productFilter').value;
    
    let filtered = appState.products.filter(product => {
        const matchesSearch = !search || 
            product.name?.toLowerCase().includes(search) ||
            product.description?.toLowerCase().includes(search);
        
        const matchesFilter = filter === 'all' || 
            (filter === 'in_stock' && product.stock > 0) ||
            (filter === 'out_of_stock' && product.stock === 0);
        
        return matchesSearch && matchesFilter;
    });
    
    displayProducts(filtered);
}

async function loadOrders() {
    try {
        const [pedidos, usuarios] = await Promise.all([
            apiRequest(ENDPOINTS.pedidos),
            apiRequest(ENDPOINTS.usuarios)
        ]);

        // Crear mapa de usuarios para búsqueda rápida
        const usersMap = {};
        if (usuarios) {
            usuarios.forEach(user => {
                usersMap[user.id_usuario] = user;
            });
        }

        const orders = pedidos ? pedidos.map(pedido => mapPedidoFromAPI(pedido, usersMap[pedido.id_usuario])) : [];
        appState.orders = orders;
        displayOrders(orders);
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        document.getElementById('ordersTableBody').innerHTML = 
            '<tr><td colspan="7" class="empty-state">Error al cargar pedidos: ' + error.message + '</td></tr>';
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay pedidos registrados</td></tr>';
        return;
    }

    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Crear filas con event listeners
    orders.forEach(order => {
        const statusClass = getStatusBadgeClass(order.status);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.userName || '-'}</td>
            <td>${formatDate(order.date)}</td>
            <td>$${order.total?.toLocaleString() || '0'}</td>
            <td><span class="badge ${statusClass}">${getStatusLabel(order.status)}</span></td>
            <td>${order.address?.substring(0, 30) || ''}${order.address && order.address.length > 30 ? '...' : ''}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" data-action="view" data-id="${order.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Agregar event listener
        const viewBtn = row.querySelector('[data-action="view"]');
        if (viewBtn) {
            viewBtn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                viewOrderDetail(id);
            });
        }
        
        tbody.appendChild(row);
    });
}

function filterOrders() {
    const search = document.getElementById('orderSearch').value.toLowerCase();
    const filter = document.getElementById('orderStatusFilter').value;
    
    let filtered = appState.orders.filter(order => {
        const matchesSearch = !search || 
            order.id.toString().includes(search) ||
            order.userName?.toLowerCase().includes(search);
        
        // Mapear filtros en inglés a estados en español
        const statusMap = {
            'pending': 'pendiente',
            'preparing': 'preparacion',
            'shipped': 'enviado',
            'delivered': 'entregado'
        };
        
        const orderStatusLower = order.status?.toLowerCase() || '';
        const filterStatusLower = statusMap[filter] || filter?.toLowerCase();
        
        const matchesFilter = filter === 'all' || 
            orderStatusLower === filterStatusLower ||
            orderStatusLower.includes(filterStatusLower);
        
        return matchesSearch && matchesFilter;
    });
    
    displayOrders(filtered);
}

async function loadReports() {
    try {
        // Cargar datos para reportes
        const [usuarios, productos, pedidos] = await Promise.all([
            apiRequest(ENDPOINTS.usuarios),
            apiRequest(ENDPOINTS.productos),
            apiRequest(ENDPOINTS.pedidos)
        ]);

        // Calcular estadísticas
        const totalSales = pedidos ? pedidos.reduce((sum, order) => sum + (order.total || 0), 0) : 0;
        const totalOrders = pedidos ? pedidos.length : 0;
        const activeUsers = usuarios ? usuarios.filter(u => u.estado === 'activo').length : 0;
        const totalProducts = productos ? productos.length : 0;

        updateReportStats({
            totalSales,
            totalOrders,
            activeUsers,
            totalProducts
        });

        // Obtener productos más vendidos
        try {
            const orderDetails = await apiRequest(ENDPOINTS.pedido_detalle);
            const productSales = {};
            
            if (orderDetails && productos) {
                orderDetails.forEach(detail => {
                    if (!productSales[detail.id_producto]) {
                        productSales[detail.id_producto] = 0;
                    }
                    productSales[detail.id_producto] += detail.cantidad || 0;
                });

                const topProducts = productos
                    .map(product => {
                        const mapped = mapProductoFromAPI(product);
                        mapped.sales = productSales[product.id_producto] || 0;
                        return mapped;
                    })
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5);

                displayReportTopProducts(topProducts);
            } else {
                displayReportTopProducts([]);
            }
        } catch (error) {
            console.error('Error al cargar productos más vendidos:', error);
            displayReportTopProducts([]);
        }
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        updateReportStats({
            totalSales: 0,
            totalOrders: 0,
            activeUsers: 0,
            totalProducts: 0
        });
        displayReportTopProducts([]);
    }
}

function updateReportStats(stats) {
    document.getElementById('reportTotalSales').textContent = `$${stats.totalSales?.toLocaleString() || 0}`;
    document.getElementById('reportTotalOrders').textContent = stats.totalOrders || 0;
    document.getElementById('reportActiveUsers').textContent = stats.activeUsers || 0;
    document.getElementById('reportTotalProducts').textContent = stats.totalProducts || 0;
}

function displayReportTopProducts(products) {
    const container = document.getElementById('reportTopProducts');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-item">
            <img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}">
            <div class="product-item-info">
                <h4>${product.name}</h4>
                <p>${product.description?.substring(0, 50)}...</p>
            </div>
            <div class="product-item-sales">${product.sales || 0} ventas</div>
        </div>
    `).join('');
}

// Acciones de usuarios
async function editUser(userId) {
    try {
        // Intentar obtener desde el estado primero
        let user = appState.users.find(u => u.id === userId);
        
        // Si no está en el estado, cargarlo desde la API
        if (!user) {
            const usuario = await apiRequest(`${ENDPOINTS.usuarios}/${userId}`);
            if (usuario) {
                user = mapUsuarioFromAPI(usuario);
            }
        }
        
        if (user) {
            openUserModal(user);
        } else {
            alert('Usuario no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        alert('Error al cargar usuario: ' + error.message);
    }
}

async function activateUser(userId) {
    try {
        // Obtener usuario actual
        const usuario = await apiRequest(`${ENDPOINTS.usuarios}/${userId}`);
        if (!usuario) {
            alert('Usuario no encontrado');
            return;
        }

        // Actualizar estado a activo
        const updatedUser = { ...usuario, estado: 'activo' };
        await apiRequest(`${ENDPOINTS.usuarios}/${userId}`, 'PUT', updatedUser);
        
        alert('Usuario activado correctamente');
        loadUsers();
    } catch (error) {
        console.error('Error al activar usuario:', error);
        alert('Error al activar usuario: ' + error.message);
    }
}

async function deactivateUser(userId) {
    try {
        // Obtener usuario actual
        const usuario = await apiRequest(`${ENDPOINTS.usuarios}/${userId}`);
        if (!usuario) {
            alert('Usuario no encontrado');
            return;
        }

        // Actualizar estado a inactivo
        const updatedUser = { ...usuario, estado: 'inactivo' };
        await apiRequest(`${ENDPOINTS.usuarios}/${userId}`, 'PUT', updatedUser);
        
        alert('Usuario desactivado correctamente');
        loadUsers();
    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        alert('Error al desactivar usuario: ' + error.message);
    }
}

async function viewUserHistory(userId) {
    try {
        const user = appState.users.find(u => u.id === userId);
        document.getElementById('userHistoryName').textContent = user?.name || 'Usuario';
        
        // Obtener todos los pedidos
        const pedidos = await apiRequest(ENDPOINTS.pedidos);
        
        // Filtrar pedidos del usuario
        const userOrders = pedidos ? pedidos.filter(p => p.id_usuario === userId) : [];
        
        // Mapear pedidos al formato esperado
        const orders = userOrders.map(pedido => ({
            id: pedido.id_pedido,
            date: pedido.fecha_pedido,
            status: pedido.estado,
            total: pedido.total
        }));
        
        displayUserHistory(orders);
        openModal('userHistoryModal');
    } catch (error) {
        console.error('Error al cargar historial:', error);
        alert('Error al cargar historial de compras: ' + error.message);
    }
}

function displayUserHistory(orders) {
    const container = document.getElementById('userHistoryContent');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay compras registradas</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-item-info">
                <h4>Pedido #${order.id}</h4>
                <p>${formatDate(order.date)} - ${getStatusLabel(order.status)}</p>
            </div>
            <div>
                <strong>$${order.total?.toLocaleString()}</strong>
            </div>
        </div>
    `).join('');
}

// Acciones de productos
async function editProduct(productId) {
    try {
        // Intentar obtener desde el estado primero
        let product = appState.products.find(p => p.id === productId);
        
        // Si no está en el estado, cargarlo desde la API
        if (!product) {
            const producto = await apiRequest(`${ENDPOINTS.productos}/${productId}`);
            if (producto) {
                product = mapProductoFromAPI(producto);
            }
        }
        
        if (product) {
            openProductModal(product);
        } else {
            alert('Producto no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar producto:', error);
        alert('Error al cargar producto: ' + error.message);
    }
}

// Acciones de pedidos
async function viewOrderDetail(orderId) {
    try {
        // Obtener pedido, detalles y productos
        const [pedido, detalles, productos, usuarios] = await Promise.all([
            apiRequest(`${ENDPOINTS.pedidos}/${orderId}`),
            apiRequest(ENDPOINTS.pedido_detalle),
            apiRequest(ENDPOINTS.productos),
            apiRequest(ENDPOINTS.usuarios)
        ]);

        if (!pedido) {
            alert('Pedido no encontrado');
            return;
        }

        // Obtener usuario del pedido
        const usuario = usuarios ? usuarios.find(u => u.id_usuario === pedido.id_usuario) : null;
        const order = mapPedidoFromAPI(pedido, usuario);

        // Obtener productos del pedido
        const orderDetails = detalles ? detalles.filter(d => d.id_pedido === orderId) : [];
        const productsMap = {};
        if (productos) {
            productos.forEach(producto => {
                productsMap[producto.id_producto] = producto;
            });
        }

        // Mapear productos del pedido
        order.products = orderDetails.map(detail => {
            const producto = productsMap[detail.id_producto];
            return {
                id: detail.id_producto,
                name: producto ? producto.nombre : `Producto ${detail.id_producto}`,
                quantity: detail.cantidad,
                price: detail.precio_unitario,
                image: producto ? producto.imagen : '',
                subtotal: detail.subtotal
            };
        });

        appState.currentOrder = order;
        displayOrderDetail(order);
        openModal('orderDetailModal');
    } catch (error) {
        console.error('Error al cargar detalle del pedido:', error);
        alert('Error al cargar detalle del pedido: ' + error.message);
    }
}

function displayOrderDetail(order) {
    document.getElementById('orderDetailId').textContent = order.id;
    document.getElementById('orderDetailUser').textContent = order.userName || '-';
    document.getElementById('orderDetailDate').textContent = formatDate(order.date);
    document.getElementById('orderDetailStatus').textContent = getStatusLabel(order.status);
    document.getElementById('orderDetailTotal').textContent = `$${order.total?.toLocaleString() || '0'}`;
    document.getElementById('orderDetailAddress').textContent = order.address || '-';
    
    // Mapear estado del pedido al valor del select (que usa valores en inglés)
    const statusMap = {
        'pendiente': 'pending',
        'preparacion': 'preparing',
        'en preparacion': 'preparing',
        'enviado': 'shipped',
        'entregado': 'delivered'
    };
    const orderStatus = order.status?.toLowerCase() || 'pending';
    document.getElementById('orderStatusChange').value = statusMap[orderStatus] || orderStatus || 'pending';

    // Mostrar productos
    const productsContainer = document.getElementById('orderDetailProducts');
    if (order.products && order.products.length > 0) {
        productsContainer.innerHTML = order.products.map(product => `
            <div class="product-item">
                <img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}">
                <div class="product-item-info">
                    <h4>${product.name}</h4>
                    <p>Cantidad: ${product.quantity} x $${product.price?.toLocaleString()}</p>
                </div>
                <div><strong>$${(product.quantity * product.price)?.toLocaleString()}</strong></div>
            </div>
        `).join('');
    } else {
        productsContainer.innerHTML = '<p class="empty-state">No hay productos</p>';
    }
}

async function updateOrderStatus() {
    const orderId = appState.currentOrder?.id;
    const newStatusEnglish = document.getElementById('orderStatusChange').value;

    if (!orderId) return;

    try {
        // Obtener pedido actual
        const pedido = await apiRequest(`${ENDPOINTS.pedidos}/${orderId}`);
        if (!pedido) {
            alert('Pedido no encontrado');
            return;
        }

        // Mapear estado del select (en inglés) al estado de la API (en español)
        const statusMapToSpanish = {
            'pending': 'pendiente',
            'preparing': 'preparacion',
            'shipped': 'enviado',
            'delivered': 'entregado'
        };
        const newStatusSpanish = statusMapToSpanish[newStatusEnglish] || newStatusEnglish;

        // Actualizar estado
        const updatedOrder = { ...pedido, estado: newStatusSpanish };
        await apiRequest(`${ENDPOINTS.pedidos}/${orderId}`, 'PUT', updatedOrder);
        
        alert('Estado del pedido actualizado correctamente');
        closeModal('orderDetailModal');
        loadOrders();
        
        // Si estamos en el dashboard, recargarlo también
        if (appState.currentSection === 'dashboard') {
            loadDashboard();
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar estado del pedido: ' + error.message);
    }
}

// Eliminar elementos
let deleteCallback = null;

function confirmDelete(type, id) {
    const messages = {
        'user': '¿Está seguro de que desea eliminar este usuario?',
        'product': '¿Está seguro de que desea eliminar este producto?',
        'order': '¿Está seguro de que desea eliminar este pedido?'
    };

    document.getElementById('confirmMessage').textContent = messages[type] || '¿Está seguro de que desea eliminar este elemento?';
    
    deleteCallback = async () => {
        try {
            let endpoint = '';
            switch(type) {
                case 'user':
                    endpoint = `${ENDPOINTS.usuarios}/${id}`;
                    break;
                case 'product':
                    endpoint = `${ENDPOINTS.productos}/${id}`;
                    break;
                case 'order':
                    endpoint = `${ENDPOINTS.pedidos}/${id}`;
                    break;
                default:
                    alert('Tipo de elemento no válido');
                    return;
            }

            await apiRequest(endpoint, 'DELETE');
            alert(`${type === 'user' ? 'Usuario' : type === 'product' ? 'Producto' : 'Pedido'} eliminado correctamente`);
            closeModal('confirmModal');
            
            // Recargar datos según el tipo
            switch(type) {
                case 'user':
                    loadUsers();
                    if (appState.currentSection === 'dashboard') {
                        loadDashboard();
                    }
                    break;
                case 'product':
                    loadProducts();
                    if (appState.currentSection === 'dashboard') {
                        loadDashboard();
                    }
                    break;
                case 'order':
                    loadOrders();
                    if (appState.currentSection === 'dashboard') {
                        loadDashboard();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error al eliminar ${type}:`, error);
            alert(`Error al eliminar ${type === 'user' ? 'usuario' : type === 'product' ? 'producto' : 'pedido'}: ` + error.message);
        }
    };
    
    openModal('confirmModal');
}

function executeDelete() {
    if (deleteCallback) {
        deleteCallback();
        deleteCallback = null;
    }
}

// Exportar reportes
document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
    // TODO: Implementar exportación a Excel
    alert('Funcionalidad de exportación a Excel en desarrollo');
});

document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
    // TODO: Implementar exportación a PDF
    alert('Funcionalidad de exportación a PDF en desarrollo');
});

// Utilidades
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Pendiente',
        'pendiente': 'Pendiente',
        'preparing': 'En Preparación',
        'preparacion': 'En Preparación',
        'en preparacion': 'En Preparación',
        'shipped': 'Enviado',
        'enviado': 'Enviado',
        'delivered': 'Entregado',
        'entregado': 'Entregado',
        'active': 'Activo',
        'activo': 'Activo',
        'inactive': 'Inactivo',
        'inactivo': 'Inactivo'
    };
    return labels[status?.toLowerCase()] || status || 'Desconocido';
}

function getStatusBadgeClass(status) {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'pendiente' || statusLower === 'pending') {
        return 'badge-pending';
    } else if (statusLower === 'preparacion' || statusLower === 'en preparacion' || statusLower === 'preparing') {
        return 'badge-preparing';
    } else if (statusLower === 'enviado' || statusLower === 'shipped') {
        return 'badge-shipped';
    } else if (statusLower === 'entregado' || statusLower === 'delivered') {
        return 'badge-delivered';
    } else if (statusLower === 'activo' || statusLower === 'active') {
        return 'badge-success';
    } else if (statusLower === 'inactivo' || statusLower === 'inactive') {
        return 'badge-danger';
    }
    return 'badge-info';
}

// Hacer funciones disponibles globalmente
window.editUser = editUser;
window.activateUser = activateUser;
window.deactivateUser = deactivateUser;
window.viewUserHistory = viewUserHistory;
window.editProduct = editProduct;
window.viewOrderDetail = viewOrderDetail;
window.confirmDelete = confirmDelete;

