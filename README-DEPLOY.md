# Despliegue en Render con Docker

Esta aplicación está lista para desplegarse en Render usando Docker.

## 🚀 Despliegue Rápido en Render

### Opción 1: Desde el Repositorio Git (Recomendado)

1. **Sube tu código a GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <tu-repositorio>
   git push -u origin main
   ```

2. **En Render:**
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio
   - Render detectará automáticamente el `Dockerfile`
   - Configura:
     - **Name**: admin-panel (o el nombre que prefieras)
     - **Environment**: Docker
     - **Build Command**: (dejar vacío, Render lo detecta automáticamente)
     - **Start Command**: (dejar vacío, está en el Dockerfile)
   - Click en "Create Web Service"

3. **Espera a que se complete el build** (2-3 minutos)

4. **Tu aplicación estará disponible en**: `https://tu-app.onrender.com`

### Opción 2: Usando render.yaml

Si tienes el archivo `render.yaml` en tu repositorio:

1. Render detectará automáticamente la configuración
2. Solo necesitas conectar el repositorio y Render hará el resto

## 📋 Requisitos Previos

- Cuenta en [Render](https://render.com)
- Repositorio Git (GitHub, GitLab o Bitbucket)
- Docker (solo para pruebas locales)

## 🧪 Prueba Local con Docker

Antes de desplegar, puedes probar localmente:

### Construir la imagen:
```bash
docker build -t admin-panel .
```

### Ejecutar el contenedor:
```bash
docker run -p 8080:80 admin-panel
```

### O usar docker-compose:
```bash
docker-compose up
```

Luego abre: http://localhost:8080

## 🔧 Configuración

### ⚠️ IMPORTANTE: Configurar CORS en la API

**Antes de desplegar**, asegúrate de que tu API tenga CORS configurado para permitir tu dominio de Render.

1. **Despliega el frontend primero** para obtener la URL (ej: `https://admin-panel-xyz.onrender.com`)
2. **Actualiza tu API** (`Program.cs`) para incluir tu dominio:
   ```csharp
   policy.WithOrigins(
       "https://admin-panel-xyz.onrender.com",  // ⬅️ Tu URL de Render
       "http://localhost:8000",
       // ... otros orígenes
   )
   ```
3. **Redeploya tu API** en Render

Ver `API-CORS-FIX.md` para instrucciones detalladas.

### Variables de Entorno (Opcional)

Si necesitas cambiar la URL de la API en producción, puedes:

1. **Editar `config.js` directamente** antes de hacer commit
2. **O usar variables de entorno** (requiere modificar el código)

### Cambiar la URL de la API

Edita el archivo `config.js`:
```javascript
const CONFIG = {
    API_BASE_URL: 'https://apijhon.onrender.com', // Cambia aquí
    // ...
};
```

## 📁 Estructura del Proyecto

```
.
├── Dockerfile              # Configuración de Docker
├── docker-compose.yml      # Para pruebas locales
├── nginx.conf              # Configuración de nginx
├── render.yaml             # Configuración de Render (opcional)
├── .dockerignore           # Archivos a ignorar en Docker
├── index.html              # Aplicación principal
├── styles.css              # Estilos
├── script.js               # Lógica JavaScript
└── config.js               # Configuración de la API
```

## 🐳 Detalles del Dockerfile

- **Imagen base**: `nginx:alpine` (ligera y eficiente)
- **Puerto**: 80 (Render lo mapea automáticamente)
- **Archivos**: Se copian todos los archivos estáticos
- **Configuración**: nginx configurado con CORS y compresión

## 🔒 Seguridad

El nginx.conf incluye:
- Headers de seguridad (X-Frame-Options, X-Content-Type-Options, etc.)
- Configuración CORS para permitir peticiones a la API
- Compresión gzip para mejor rendimiento

## 📊 Monitoreo

Render proporciona:
- Logs en tiempo real
- Métricas de uso
- Health checks automáticos

## 🐛 Solución de Problemas

### El build falla
- Verifica que el Dockerfile esté en la raíz del proyecto
- Revisa los logs de build en Render

### La aplicación no carga
- Verifica que `index.html` esté en la raíz
- Revisa los logs del contenedor en Render

### Errores de CORS
- La configuración de nginx ya incluye CORS
- Verifica que la API también permita CORS

### Cambios no se reflejan
- Render reconstruye automáticamente en cada push
- Espera 2-3 minutos después del push

## 💰 Plan Gratuito de Render

- **Builds**: Ilimitados
- **Ancho de banda**: 100 GB/mes
- **Tiempo de inactividad**: El servicio se "duerme" después de 15 min de inactividad
- **Tiempo de arranque**: ~30 segundos después de estar dormido

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Haz cambios en tu código local
2. Commit y push a tu repositorio
3. Render detectará los cambios y reconstruirá automáticamente

## 📝 Notas

- El servicio gratuito de Render puede tardar ~30 segundos en arrancar si está dormido
- Para producción, considera el plan de pago para evitar tiempos de inactividad
- Los archivos estáticos se sirven con cache de 1 año
- El HTML no se cachea para asegurar actualizaciones inmediatas

---

¿Necesitas ayuda? Revisa la [documentación de Render](https://render.com/docs) o los logs de tu servicio.

