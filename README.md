# SUDS Quito · Buscador de SUDS por barrio

Aplicación web para el **dimensionamiento preliminar de Sistemas Urbanos de
Drenaje Sostenible (SUDS)** en Quito, a partir de datos reales de lluvia de 12
estaciones del FONAG (2020-2026).

**Idea, metodología y desarrollo:** Paulina Lima · © 2026, todos los derechos reservados.
**En línea:** https://suds-quito.vercel.app · **Versión:** 2.1.1

## Qué hace

1. Ubica el proyecto: estación de lluvia más cercana o punto exacto en el mapa
   (interpolación IDW).
2. Elige la lluvia de diseño: P90/P95 de eventos (control de volumen) o
   períodos de retorno TR 2–25 años (Gumbel, 2 h), o un valor propio.
3. Calcula el volumen de escorrentía (coeficiente C o número de curva NRCS).
4. Dimensiona biorretención, pavimento permeable, zanja o depósito de
   infiltración y cisterna; estima el tiempo de vaciado según el suelo.
5. Calcula el tanque de retención obligatorio según la norma municipal de
   agua lluvia (OM 060-2023 Verde-Azul y estándar del PUGS).
6. Entrega presupuesto referencial, análisis técnico (estacionalidad, El Niño,
   hietograma, método) y una memoria de cálculo imprimible.

Dos modos de lectura: **explicación simple** (ciudadanía) y **vista técnica**
(arquitectura e ingeniería).

## Estructura del código

```
src/
  SudsApp.jsx              aplicación principal (estado y pasos 01–06)
  version.js               nombre y versión
  data/stations.js         12 estaciones FONAG: parámetros de diseño y climatología
  data/catalogs.js         superficies, tipos de SUDS, suelos, escenarios
  data/prices.js           precios unitarios (Rumiñahui, jun. 2026)
  data/normaQuito.js       tablas del estándar municipal de agua lluvia e IDF EMAAP-Q
  lib/hydrology.js         escorrentía, dimensionamiento, infiltración, Gumbel
  lib/budget.js            presupuesto por tipo de SUDS
  lib/climate.js           lluvia de diseño, IDW, climatología
  lib/normaQuito.js        tanque de retención normativo
  lib/compute.js           cálculo completo de un caso
  lib/urlState.js          enlace compartible
  lib/calculos.test.js     pruebas automáticas
  components/              interfaz (mapa, resultados, análisis, memoria)
```

## Comandos

```
npm install      # instalar dependencias
npm run dev      # servidor local de desarrollo
npm test         # pruebas del núcleo de cálculo
npm run build    # compilación para producción (carpeta dist/)
```

## Publicación

El repositorio está conectado a Vercel: cada `git push` a `main` actualiza
https://suds-quito.vercel.app automáticamente.

## Mantenimiento

- **Análisis de lluvias (cada año, en junio):** volver a correr el script de R
  de la autora con los registros nuevos, reemplazar los valores de `STATIONS` en
  `src/data/stations.js` y actualizar la constante `ANALYSIS` (fecha, período y
  próxima actualización). Análisis vigente: junio de 2026; próximo: junio de 2027.
- **Precios:** `src/data/prices.js`, actualizar cada 6 meses.
- Tras cualquier cambio en cálculos: `npm test`.

## Aviso

Resultados orientativos para anteproyecto. No reemplazan el diseño hidráulico
detallado ni la revisión de un profesional responsable.

Ver `LICENSE`, `NOTICE.md` (componentes de terceros) y `CHANGELOG.md`.
