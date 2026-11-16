# Instrucciones para Agentes

Antes de cambiar nada del despliegue, lee [DESPLIEGUE.md](./DESPLIEGUE.md).

- **Tipo de aplicación en el panel:** `estatica` (sitio Astro construido estáticamente y servido con Nginx en el puerto `8080`).
- **Seguridad del contenedor:** Ejecuta con `UID:GID 10001:10001`, puerto `8080` y sistema de ficheros raíz en solo lectura (escribiendo únicamente en `/tmp`).
