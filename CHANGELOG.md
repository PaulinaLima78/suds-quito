# Historial de versiones

## 2.1.1 — octubre de 2026
- Se indica la fecha del análisis de lluvias (junio de 2026, serie 2020-2026) y
  que se actualiza cada año (próxima: junio de 2027), en la app, el panel
  «Acerca de», la tabla de lluvias y la memoria de cálculo.
- Aviso automático en la app cuando vence la fecha de actualización.

## 2.1.0 — octubre de 2026

### Nuevo
- **Tanque de retención según la norma de Quito:** implementa el *Estándar de
  recolección y reutilización de agua lluvia* (apéndice del PUGS-DMQ, EPMAPS),
  al que remite el Art. 26 e) de la Ordenanza Metropolitana 060-2023 de
  Infraestructura Verde-Azul:
  - volumen V = (Cu − Co)·I·A/6·T_RET con coeficientes ponderados (Tabla 4);
  - intensidad con las ecuaciones IDF de la EMAAP-Q (Tabla 3), con estación
    sugerida según las recomendaciones del estándar;
  - período de retorno por tipo de ocupación (Tabla 2);
  - volumen mínimo por área de lote (Tabla 1, mínimo 5 m³);
  - dimensiones con volumen muerto 0,40 m y borde libre 0,50 m;
  - diámetros de descarga y desborde (Tablas 5 y 6) y tiempo de vaciado;
  - aviso de reúso obligatorio (> 12 pisos o > 2500 m² útiles).
- Memoria de cálculo imprimible con el cálculo normativo paso a paso.
- Aviso en SUDS de infiltración: el estándar solo permite infiltrar en suelos
  granulares.

## 2.0.0 — octubre de 2026

### Nuevo
- **Punto exacto en el mapa:** se puede marcar el sitio del proyecto (o usar la
  ubicación del teléfono) y la lluvia de diseño se interpola por distancia
  inversa (IDW) desde las 4 estaciones más cercanas. Muestra pesos, distancias
  y advierte si el punto está lejos de toda estación.
- **Tiempo de vaciado por infiltración:** nuevo selector de tipo de suelo (o tasa
  medida en ensayo) para biorretención, pavimento, zanja y depósito, con criterio
  ≤ 48 h / 72 h y comparación con el tiempo seco entre eventos.
- **Método NRCS (número de curva)** como alternativa al coeficiente de escorrentía
  en la vista técnica.
- **Memoria de cálculo imprimible** (Guardar como PDF) con datos de entrada,
  resultados, presupuesto y supuestos.
- **Enlace compartible:** la URL guarda los datos ingresados.
- Área de pavimento permeable independiente del área aportante, con aviso si la
  relación supera 2:1.
- Pruebas automáticas del núcleo de cálculo (`npm test`).

### Corregido
- Presupuesto: la excavación y los materiales de biorretención, pavimento
  permeable y cisterna se calculaban con el volumen de agua y no con la
  geometría; ahora se usa la geometría real (la excavación de biorretención
  pasa a ser área × 0,80 m).
- Zonas de las estaciones Rumihurco (P03), Collaloma Medio (P71) y Colinas del
  Alto (P72): están en el norte de Quito, no en el sur.
- Tabla de El Niño: los años con meses sin registro (Rumihurco 2023 y 2024,
  Izobamba 2024) se marcan con asterisco; su "déficit" era un efecto de datos
  faltantes. El gráfico ya no une puntos a través de meses sin dato.
- Hietograma: se aclara que muestra las 2 horas más intensas del evento P90 (no
  el evento completo).
- Fórmula de Gumbel en "Método de cálculo": el parámetro de ubicación es
  u = x̄ − 0,5772·β (antes decía "μ = media").
- El método de volumen ya no se rotula como "NRCS TR-55".
- El mapa actualiza las etiquetas al cambiar de escenario y ya no se superpone
  al encabezado al desplazarse. Leaflet se instala con el proyecto (antes se
  cargaba desde un CDN externo).
- Algunos fondos de tablas no se mostraban por clases de Tailwind inválidas.

### Interno
- Código reorganizado en módulos: `src/data`, `src/lib`, `src/components`.

## 1.0 — junio de 2026
- Primera versión publicada en suds-quito.vercel.app.
