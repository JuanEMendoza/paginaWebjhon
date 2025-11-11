using Api.context;
using Microsoft.AspNetCore.Cors;
using Microsoft.EntityFrameworkCore;

namespace Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Add the database
            builder.Services.AddDbContext<contextDB>(options =>
                options.UseMySql(
                    builder.Configuration.GetConnectionString("Connection_mysql"),
                    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("Connection_mysql"))));

            // ==========================================================
            // ? CONFIGURACIÓN DE CORS PARA FRONTEND EN RENDER
            // ==========================================================
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowRenderFrontend", policy =>
                {
                    policy.WithOrigins(
                        // ⚠️ IMPORTANTE: Reemplaza con la URL real de tu frontend en Render
                        // Ejemplo: "https://admin-panel-xyz.onrender.com"
                        "https://tu-app-admin.onrender.com",  // ⬅️ CAMBIA ESTO
        
                        // Desarrollo local
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "http://localhost:3000",
                        "http://localhost:8080",
                        "http://localhost:5000",
                        "http://localhost:8000",              // ⬅️ Agregado para servidor Python
                        "https://localhost:5500"
                      )
                      .AllowAnyMethod()                     // Permite GET, POST, PUT, DELETE, OPTIONS, PATCH, etc.
                      .AllowAnyHeader()                     // Permite cualquier header (Content-Type, Authorization, etc.)
                      .AllowCredentials();                  // Permite cookies y credenciales
                });

                // Política alternativa más permisiva para desarrollo (opcional)
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                    // ⚠️ Nota: No se puede usar AllowCredentials() con AllowAnyOrigin()
                });
            });

            // Habilitar el caché de respuestas
            builder.Services.AddResponseCaching();

            var app = builder.Build();

            // Configure the HTTP request pipeline
            // Activa Swagger siempre (en desarrollo y producción)
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1");
                c.RoutePrefix = "swagger";
            });

            // ==========================================================
            // ? ORDEN CRÍTICO DE MIDDLEWARES PARA CORS
            // ==========================================================
            // IMPORTANTE: CORS debe estar ANTES de UseRouting y UseAuthorization
            // ASP.NET Core maneja automáticamente las peticiones OPTIONS (preflight)
            // ==========================================================

            // Habilitar caché
            app.UseResponseCaching();

            // Routing (debe ir antes de CORS en .NET 6+)
            app.UseRouting();

            // ? CORS - DEBE IR DESPUÉS de UseRouting pero ANTES de UseAuthorization
            app.UseCors("AllowRenderFrontend");

            // Authorization (si lo necesitas)
            app.UseAuthorization();

            // Mapeo de controladores
            app.MapControllers();

            app.Run();
        }
    }
}

