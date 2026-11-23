# AGENTS.md

## Proyecto
CanteraPower: app web para gestionar equipos canteranos de Hattrick.org mediante CHPP.

## Ejecución
- Requiere Node.js 18+.
- Instalar dependencias: `npm install`
- Iniciar servidor: `npm start` → http://localhost:3000
- No hay tests configurados.

## Estructura
- `server.js`: backend Express + OAuth 1.0a CHPP + proxy de endpoints (`/api/team`, `/api/players`, `/api/series`).
- `index.html`, `styles.css`, `app.js`: frontend estático servido por Express.
- Credenciales en `.env` (copiar de `.env.example`): `CHPP_CONSUMER_KEY`, `CHPP_CONSUMER_SECRET`.

## Convenciones
- Textos de interfaz en español.
- Diseño responsive, sin frameworks.
- El consumer secret nunca debe ir al cliente; solo en backend.
- Tokens de acceso se guardan en `localStorage` del navegador.
- Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- No levantes el servidor de la app después de los cambios, yo lo haré manualmente.

## Gotchas
- Sin `.env` con credenciales CHPP válidas, la autenticación falla.
- El callback OAuth redirige con token en la URL (solo desarrollo local).
- El frontend depende del backend; no funciona abriendo `index.html` con doble clic.

## Comandos
- Tests: `node --test`

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).