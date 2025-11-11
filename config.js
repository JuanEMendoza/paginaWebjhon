// Configuración de la API (evitar redeclaración)
if (typeof window.CONFIG === 'undefined') {
    window.CONFIG = {
    API_BASE_URL: 'https://apijhon.onrender.com', // URL base de la API
    
    // Configuración de endpoints de la API
    ENDPOINTS: {
        usuarios: '/api/usuarios',
        productos: '/api/productos',
        pedidos: '/api/pedidos',
        pedido_detalle: '/api/pedido_detalle',
        pagos: '/api/pagos',
        carrito: '/api/carrito',
        carrito_detalle: '/api/carrito_detalle',
        favoritos: '/api/favoritos',
        metodos_pago: '/api/metodos_pago',
        reportes: '/api/reportes'
    },
    
    // Configuración de paginación
    PAGINATION: {
        itemsPerPage: 10
    },
    
    // Configuración de formato de fecha
    DATE_FORMAT: 'es-ES',
    
    // Configuración de moneda
    CURRENCY: 'USD',
    CURRENCY_SYMBOL: '$'
    };
}
const CONFIG = window.CONFIG;

// Exportar configuración (si se usa como módulo)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

