# Usar imagen base de nginx para servir archivos estáticos
FROM nginx:alpine

# Copiar archivos estáticos al directorio de nginx
COPY . /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando por defecto de nginx (ya está en la imagen)
CMD ["nginx", "-g", "daemon off;"]

