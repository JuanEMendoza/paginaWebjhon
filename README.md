# Panel de Administración - Tienda

Panel de administración completo para gestionar usuarios, productos, pedidos y reportes de una tienda online.

## ⚠️ IMPORTANTE: Error de CORS

**NO abras el archivo `index.html` directamente desde el explorador de archivos.** Esto causará errores de CORS.

### Solución: Usar un servidor local

Tienes varias opciones:

#### Opción 1: Usar el servidor Python incluido (Recomendado)

1. **Windows**: Doble clic en `start-server.bat`
2. **Linux/Mac**: Ejecuta en la terminal:
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```
3. O ejecuta directamente:
   ```bash
   python server.py
   ```
4. Abre tu navegador en: **http://localhost:8000**

#### Opción 2: Usar el servidor HTTP de Python

```bash
python -m http.server 8000
```

Luego abre: **http://localhost:8000**

#### Opción 3: Usar Node.js (si lo tienes instalado)

```bash
npx http-server
```

#### Opción 4: Usar PHP (si lo tienes instalado)

```bash
php -S localhost:8000
```

## Características

### 1. Gestión de Usuarios
- Ver lista de usuarios registrados
- Agregar nuevos usuarios
- Editar información de usuarios
- Activar/Desactivar cuentas
- Eliminar usuarios
- Consultar historial de compras por usuario
- Buscar y filtrar usuarios

### 2. Gestión de Productos
- Ver catálogo de productos
- Agregar nuevos productos
- Editar productos existentes
- Eliminar productos
- Cargar imágenes de productos
- Gestionar precios, descripciones y stock
- Filtrar productos por stock
- Ver estadísticas de ventas por producto

### 3. Gestión de Pedidos
- Ver lista de pedidos
- Ver detalles completos de cada pedido
- Cambiar estado del pedido (Pendiente, En Preparación, Enviado, Entregado)
- Consultar información de pago y dirección de envío
- Filtrar pedidos por estado
- Buscar pedidos

### 4. Reportes y Estadísticas
- Dashboard con estadísticas generales
- Visualización de ventas totales
- Productos más vendidos
- Usuarios activos
- Exportación de reportes (Excel/PDF - próximamente)

## Estructura del Proyecto

```
.
├── index.html          # Estructura HTML principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── config.js           # Configuración de la API
├── server.py           # Servidor local Python
├── start-server.bat    # Script para iniciar servidor (Windows)
├── start-server.sh     # Script para iniciar servidor (Linux/Mac)
└── README.md           # Este archivo
```

## Configuración de la API

La aplicación está configurada para usar la API en:
- **URL Base**: `https://apijhon.onrender.com`
- **Endpoints**:
  - `/api/usuarios` - Gestión de usuarios
  - `/api/productos` - Gestión de productos
  - `/api/pedidos` - Gestión de pedidos
  - `/api/pedido_detalle` - Detalles de pedidos
  - `/api/pagos` - Información de pagos

Si necesitas cambiar la URL de la API, edita el archivo `config.js`.

## Formato de Datos Esperado

### Usuario
```json
{
  "id_usuario": 1,
  "nombre": "Juan Pérez",
  "correo": "juan@ejemplo.com",
  "telefono": "3001234567",
  "contrasena": "1234",
  "direccion": "Calle 10 #5-30",
  "foto_perfil": "juan.jpg",
  "rol": "cliente",
  "estado": "activo",
  "fecha_registro": "2025-11-10T23:57:06"
}
```

### Producto
```json
{
  "id_producto": 1,
  "nombre": "Producto Ejemplo",
  "descripcion": "Descripción del producto",
  "precio": 99.99,
  "stock": 100,
  "categoria": "Electrónica",
  "imagen": "https://ejemplo.com/imagen.jpg",
  "estado": "activo",
  "fecha_creacion": "2025-11-10T23:57:06"
}
```

### Pedido
```json
{
  "id_pedido": 1,
  "id_usuario": 1,
  "fecha_pedido": "2025-11-10T23:57:06",
  "total": 199.98,
  "estado": "pendiente",
  "direccion_envio": "Calle Ejemplo 123",
  "id_metodo": 1
}
```

## Características del Diseño

- Diseño moderno y responsivo
- Interfaz intuitiva y fácil de usar
- Navegación lateral con menú colapsable en móvil
- Modales para formularios y detalles
- Tablas con búsqueda y filtros
- Badges de estado con colores distintivos
- Animaciones suaves
- Compatible con dispositivos móviles y tablets

## Tecnologías Utilizadas

- HTML5
- CSS3 (con variables CSS y Grid/Flexbox)
- JavaScript (Vanilla JS)
- Font Awesome (iconos)
- Python (servidor local opcional)

## Solución de Problemas

### Error de CORS
Si ves errores de CORS, asegúrate de:
1. Usar un servidor local (no abrir el HTML directamente)
2. Acceder a través de `http://localhost:8000`
3. No usar `file://` para abrir el archivo

### La API no responde
- Verifica que la URL de la API sea correcta en `config.js`
- Revisa la consola del navegador para ver errores específicos
- Verifica que la API esté en línea

### Los datos no se cargan
- Abre la consola del navegador (F12) para ver errores
- Verifica la conexión a internet
- Comprueba que la API esté funcionando correctamente

## Próximas Mejoras

- [ ] Exportación a Excel
- [ ] Exportación a PDF
- [ ] Gráficos interactivos para reportes
- [ ] Autenticación y autorización
- [ ] Paginación en tablas
- [ ] Carga de imágenes mediante upload
- [ ] Notificaciones en tiempo real
- [ ] Modo oscuro

## Soporte

Para cualquier pregunta o problema, por favor contacta al equipo de desarrollo.

---

Desarrollado con ❤️ para la gestión de tiendas online
