# Spec: Escaneo de equipos canteranos por grupo

## Contexto y objetivo
CanteraPower escanea un grupo de Hattrick (por Series ID) para detectar qué equipos son canteranos. Un equipo canterano es aquel cuyos jugadores activos que han participado en partidos son canteranos (MotherClubBonus=True). El resultado se guarda localmente y los equipos nuevos quedan pendientes de publicación.

## Usuarios
- **Administrador**: ejecuta el escaneo y revisa los resultados.

## Historias de usuario
- Como administrador, quiero escanear un grupo por Series ID para detectar equipos canteranos.
- Como administrador, quiero ver un resumen con equipos escaneados, canteranos y no canteranos.
- Como administrador, quiero que los equipos nuevos se guarden como pendientes sin publicar.

## Requisitos funcionales
- **RF-1**: El sistema debe aceptar un Series ID como entrada para el escaneo.
  - *Criterio (EARS):* Cuando el administrador introduce un Series ID válido y pulsa "Actualizar", el sistema debe escanear todos los equipos del grupo.
- **RF-2**: El sistema debe obtener la lista de equipos del grupo mediante la API CHPP.
  - *Criterio (EARS):* Cuando se recibe un Series ID, el sistema debe llamar a `leagueDetails` y extraer los equipos.
- **RF-3**: El sistema debe determinar si un equipo es canterano según las reglas definidas.
  - *Criterio (EARS):* Si el equipo tiene ≤3 jugadores no canteranos activos en plantilla y ninguno de ellos ha jugado en los últimos 16 partidos (oficiales y amistosos, de toda la historia), entonces el equipo se marca como canterano.
- **RF-4**: El sistema debe guardar los resultados localmente.
  - *Criterio (EARS):* Cuando el escaneo termina, el sistema debe guardar únicamente los equipos que cumplen el criterio de canterano en `equipos.json` con su estado (publicado/pendiente), actualizando los datos de equipos ya existentes.
- **RF-5**: El sistema debe mostrar un resumen tras el escaneo sin alertas con información extra.
  - *Criterio (EARS):* Cuando el escaneo finaliza, el sistema debe mostrar un alert "Escaneo finalizado" (o "Escaneo finalizado con errores parciales" si hubo errores) y actualizar la lista de equipos mostrando: cabecera con id de grupo, país, división y grupo; nombre del equipo; número total de jugadores activos; número de jugadores canteranos; y botón "Publicar"/"Despublicar" o etiqueta "Equipo no canterano".
- **RF-6**: Los equipos nuevos deben quedar pendientes y notificar al administrador.
  - *Criterio (EARS):* Cuando se detecta un equipo no existente en la base, el sistema debe guardarlo como "pendiente" y mostrarlo en la lista de pendientes.
- **RF-7**: El sistema debe verificar si cada jugador es canterano consultando `playerDetails` con `version=3.3` y leyendo `<MotherClubBonus>`.
  - *Criterio (EARS):* Cuando se obtiene la plantilla de un equipo, el sistema debe llamar a `playerDetails` para cada jugador activo y marcarlo como canterano si `MotherClubBonus` es `True`.

## Requisitos no funcionales
- El escaneo debe usar únicamente endpoints XML de CHPP.
- El sistema debe manejar errores de API sin fallar silenciosamente; los errores parciales se registran en la consola.

## Casos límite
- Equipo sin partidos disputados: se miran los que tenga; si cumple, se considera canterano; si no tiene ninguno, se marca sin datos y se omite.
- Equipo con más de 3 no canteranos en plantilla: se marca como no canterano sin revisar partidos.
- API devuelve error: se marca el equipo como no canterano y se registra el error en consola.
- Jugadores retirados (TSI 0, salario 0, InjuryLevel 999): se excluyen del conteo.

## Fuera de alcance
- Escaneo por división completa o país completo.
- Publicación automática en git.
- Autocompletar de series/lígas.

## Criterios de finalización
- El escaneo de un grupo por Series ID funciona y muestra resumen.
- Los equipos que cumplen el criterio se guardan localmente con estado correcto.
- La lista muestra nombre, total de jugadores, canteranos y estado.

## Dudas abiertas
- (ninguna)