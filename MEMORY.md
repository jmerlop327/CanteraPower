# Memoria del proyecto

## Estado actual
- App local Node.js con OAuth CHPP funcionando (request token OK).
- Token CHPP persistido en chpp_token.json.
- Scan de grupo concreto implementado con optimización (<=3 no-cant en plantilla).
- Error 500 en scan era por endpoint incorrecto (seriesdetails -> leagueDetails). Corregido y verificado con datos reales.

## Decisiones
- Almacenamiento en JSON (equipos.json), no SQLite (evita dependencias nativas).
- OAuth con librería `oauth` (npm) porque oauth-1.0a fallaba firma.
- No levantar servidor manualmente (el usuario lo hace).

## Errores a evitar
- No usar better-sqlite3 (native bindings fail en Node 26).
- Token expira; si scan devuelve 401, reconectar con Hattrick.