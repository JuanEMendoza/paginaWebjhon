# Configuración CORS para API - Solución

## Problema Actual

Tu API tiene CORS configurado, pero solo permite orígenes locales (`localhost`). Cuando despliegues el frontend en Render, necesitas agregar el dominio de Render a la lista de orígenes permitidos.

## Solución 1: Agregar Dominio de Render (Recomendado)

Actualiza tu `Program.cs` para incluir el dominio de Render:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowRenderFrontend", policy =>
    {
        policy.WithOrigins(
            // Frontend en Render (PRODUCCIÓN) - REEMPLAZA con tu URL real
            "https://tu-app-admin.onrender.com",  // ⬅️ CAMBIA ESTO por tu URL de Render
            
            // Desarrollo local
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:5000",
            "http://localhost:8000",              // ⬅️ Agregar si usas el servidor Python
            "https://localhost:5500"
          )
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials();
    });
});
```

### Pasos:

1. **Despliega tu frontend en Render primero** para obtener la URL
2. **Copia la URL** (ejemplo: `https://admin-panel-xyz.onrender.com`)
3. **Agrega la URL** a `WithOrigins()` en tu API
4. **Redeploya tu API** en Render

## Solución 2: Permitir Cualquier Origen (Desarrollo/Pruebas)

Si quieres permitir cualquier origen (menos seguro, pero útil para pruebas):

```csharp
// Cambia esta línea:
app.UseCors("AllowRenderFrontend");

// Por esta:
app.UseCors("AllowAll");
```

Y asegúrate de que la política "AllowAll" esté definida (ya la tienes en tu código).

## Solución 3: Usar Variables de Entorno (Mejor Práctica)

Para mayor flexibilidad, usa variables de entorno:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowRenderFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("AllowedOrigins")
            .Get<string[]>() ?? new[] { "http://localhost:8000" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

Y en `appsettings.json`:

```json
{
  "AllowedOrigins": [
    "https://tu-app-admin.onrender.com",
    "http://localhost:8000",
    "http://localhost:5500"
  ]
}
```

## Verificación

Después de actualizar:

1. **Redeploya tu API** en Render
2. **Abre la consola del navegador** en tu frontend
3. **Intenta hacer login o cargar datos**
4. **No deberías ver errores CORS**

## Orden de Middlewares (Ya está correcto)

Tu orden actual es correcto:
```csharp
app.UseRouting();           // ✅ Primero
app.UseCors(...);           // ✅ Después de Routing
app.UseAuthorization();     // ✅ Después de CORS
app.MapControllers();       // ✅ Al final
```

## Nota Importante

- **AllowCredentials()** requiere orígenes específicos (no puedes usar `AllowAnyOrigin()` con `AllowCredentials()`)
- Si usas `AllowAnyOrigin()`, no puedes usar `AllowCredentials()`
- Para producción, siempre especifica los orígenes exactos

