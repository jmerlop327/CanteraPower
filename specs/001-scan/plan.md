# Plan de implementación: Escaneo de equipos canteranos por grupo

## Archivos
- `server.js`: endpoint `/api/admin/scan` y helper `chppGet`. Responsabilidad: obtener datos CHPP y evaluar canteranos.
- `app.js`: interfaz admin. Responsabilidad: capturar Series ID, llamar scan, mostrar resumen.
- `index.html`: campo Series ID y panel de resultados.
- `tests/scan.test.js`: tests unitarios de la lógica pura.

## Funciones puras (lógica)
- `esCanterano(jugadores, partidosJugados)`: recibe lista de jugadores con `motherClubBonus` y set de IDs que jugaron. Devuelve boolean. Regla: ≤3 no-cant en plantilla y ninguno jugó en los últimos 16 partidos.
  - Cubre RF-3.
- `contarNoCanteranos(jugadores)`: devuelve número de jugadores con `motherClubBonus === false`.
  - Cubre RF-3.
- `filtrarEquiposCanteranos(equipos)`: devuelve solo equipos con `canterano === true`.
  - Cubre RF-4.

## Interfaz
- Campo de texto "Series ID".
- Botón "Actualizar" que llama `/api/admin/scan` con `{ seriesID }`.
- Alert con resumen: nº equipos escaneados, canteranos, no canteranos por equipo.

## Decisiones técnicas
- **Endpoint CHPP:** `leagueDetails` con `leagueLevelUnitID` (descartado `seriesdetails` que devuelve 401).
- **Detección de canterano:** `playerDetails` con `version=3.3` y `MotherClubBonus` (descartado scraping HTML, prohibido por CHPP).
- **Almacenamiento:** JSON local (`equipos.json`) en lugar de SQLite (evita dependencias nativas).

## Estrategia de tests (node --test)
- Test `esCanterano` con 0, 3 y 4 no-cant.
- Test `esCanterano` con no-cant que jugó.
- Test `filtrarEquiposCanteranos`.
- Cobertura: RF-3, RF-4.