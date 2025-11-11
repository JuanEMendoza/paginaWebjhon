// Configuración de la API
const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://apijhon.onrender.com';
const ENDPOINTS = typeof CONFIG !== 'undefined' ? CONFIG.ENDPOINTS : {
    usuarios: '/api/usuarios'
};

// Claves para localStorage
const AUTH_TOKEN_KEY = 'admin_auth_token';
const USER_DATA_KEY = 'admin_user_data';

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

        const text = await response.text();
        if (!text) {
            return null;
        }

        return JSON.parse(text);
    } catch (error) {
        console.error('Error en petición API:', error);
        
        // Detectar errores de CORS
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            const isProduction = window.location.protocol === 'https:' || 
                                window.location.hostname.includes('render.com') ||
                                window.location.hostname.includes('onrender.com');
            
            if (isProduction) {
                throw new Error('Error de conexión: Verifica que la API esté disponible y tenga CORS configurado.');
            } else {
                throw new Error('Error de CORS: Abre la aplicación desde http://localhost:8000 usando un servidor local.');
            }
        }
        
        throw error;
    }
}

// Función para autenticar usuario
async function authenticateUser(email, password) {
    try {
        // Obtener todos los usuarios
        const usuarios = await apiRequest(ENDPOINTS.usuarios);
        
        if (!usuarios || usuarios.length === 0) {
            throw new Error('No se pudo conectar con el servidor');
        }

        // Buscar usuario por email
        const usuario = usuarios.find(u => 
            u.correo && u.correo.toLowerCase() === email.toLowerCase()
        );

        if (!usuario) {
            throw new Error('Credenciales incorrectas');
        }

        // Verificar contraseña
        if (usuario.contrasena !== password) {
            throw new Error('Credenciales incorrectas');
        }

        // Verificar que sea administrador
        if (usuario.rol !== 'administrador') {
            throw new Error('No tienes permisos de administrador');
        }

        // Verificar que esté activo
        if (usuario.estado !== 'activo') {
            throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
        }

        // Usuario autenticado correctamente
        return {
            id: usuario.id_usuario,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            estado: usuario.estado
        };
    } catch (error) {
        throw error;
    }
}

// Función para guardar sesión
function saveSession(userData) {
    // Crear un token simple (en producción usar JWT)
    const token = btoa(JSON.stringify({
        userId: userData.id,
        email: userData.correo,
        timestamp: Date.now()
    }));
    
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// Función para obtener datos del usuario actual
function getCurrentUser() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (!userData) {
        return null;
    }
    
    try {
        return JSON.parse(userData);
    } catch (error) {
        return null;
    }
}

// Función para verificar si hay sesión activa
function isAuthenticated() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = getCurrentUser();
    
    if (!token || !userData) {
        return false;
    }

    // Verificar que el usuario sea administrador
    if (userData.rol !== 'administrador') {
        logout();
        return false;
    }

    return true;
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    window.location.href = 'login.html';
}

// Función para proteger rutas
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Manejo del formulario de login
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginButtonLoader = document.getElementById('loginButtonLoader');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validación básica
        if (!email || !password) {
            showError('Por favor completa todos los campos');
            return;
        }

        // Deshabilitar botón y mostrar loading
        loginButton.disabled = true;
        loginButtonText.style.display = 'none';
        loginButtonLoader.style.display = 'inline-block';
        errorMessage.classList.remove('show');

        try {
            // Autenticar usuario
            const userData = await authenticateUser(email, password);
            
            // Guardar sesión
            saveSession(userData);
            
            // Redirigir al panel
            window.location.href = 'index.html';
        } catch (error) {
            // Mostrar error
            showError(error.message || 'Error al iniciar sesión. Intenta nuevamente.');
            
            // Restaurar botón
            loginButton.disabled = false;
            loginButtonText.style.display = 'inline';
            loginButtonLoader.style.display = 'none';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        
        // Remover error después de 5 segundos
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }

    // Permitir Enter para enviar
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
}

// Exportar funciones para uso en otros archivos
if (typeof window !== 'undefined') {
    window.auth = {
        isAuthenticated,
        getCurrentUser,
        logout,
        requireAuth,
        saveSession
    };
}

