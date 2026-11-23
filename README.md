# CanteraPower (Local + Web estática)

## Módulo local
- Requiere Node.js 18+.
- Instalar: `npm install`
- Configurar `.env` (copiar de `.env.example`): `ADMIN_PASS`, `GIT_REPO`.
- Ejecutar: `npm start` → http://localhost:3000
- Panel admin: contraseña (por defecto `admin`).
- Botones: Actualizar (escaneo demo), Recolocar, Generar web estática, Publicar en git (con confirmación).

## Módulo web estática
- Carpeta `public/` contiene los archivos generados (index.html, styles.css).
- Subir el contenido de `public/` al servidor o repo configurado.

## Notas
- Sin claves CHPP, el escaneo usa datos demo.
- La publicación en git requiere `GIT_REPO` configurado y confirmación del admin.