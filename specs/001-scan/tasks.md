# Tareas: Escaneo de equipos canteranos por grupo

- [x] **T1** Crear funciones puras `esCanterano`, `contarNoCanteranos`, `filtrarEquiposCanteranos` en `server.js`. Cubre RF-3, RF-4.
  - Hecho cuando: las funciones existen y se exportan para tests.
- [x] **T2** Implementar endpoint `/api/admin/scan` usando `leagueDetails` con `leagueLevelUnitID`. Cubre RF-1, RF-2.
  - Hecho cuando: devuelve lista de equipos del grupo.
- [x] **T3** Para cada equipo, obtener plantilla vía `players` y verificar `MotherClubBonus` vía `playerDetails` v3.3. Cubre RF-3.
  - Hecho cuando: cada jugador tiene campo `motherClubBonus`.
- [x] **T4** Obtener últimos 16 partidos (oficiales y amistosos) y extraer jugadores que participaron. Cubre RF-3.
  - Hecho cuando: se obtiene set de PlayerIDs que jugaron.
- [x] **T5** Aplicar regla de canterano (≤3 no-cant en plantilla y ninguno jugó). Cubre RF-3.
  - Hecho cuando: `esCanterano` devuelve resultado correcto.
- [x] **T6** Guardar solo equipos canteranos en `equipos.json` con estado pendiente. Cubre RF-4, RF-6.
  - Hecho cuando: equipos.json contiene solo canteranos nuevos.
- [x] **T7** Devolver resumen en respuesta del scan (nº escaneados, canteranos, no-cant por equipo). Cubre RF-5.
  - Hecho cuando: la respuesta incluye `resumen`.
- [x] **T8** Actualizar UI: campo Series ID y mostrar resumen. Cubre RF-1, RF-5.
  - Hecho cuando: el admin ve el resumen tras escanear.
- [x] **T9** Crear tests en `tests/scan.test.js` con `node --test`. Cubre RF-3, RF-4.
  - Hecho cuando: `node --test` pasa todos los tests.