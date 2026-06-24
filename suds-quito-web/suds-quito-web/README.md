# Buscador de SUDS por barrio · Quito

App para dimensionar Sistemas Urbanos de Drenaje Sostenible (SUDS) usando
datos reales de lluvia de 12 estaciones de Quito (fuente: FONAG).

**Idea y desarrollo:** Paulina Lima

## Cómo subir esto a GitHub (desde la compu de la UCE)

1. Descomprime este .zip en una carpeta, por ejemplo `suds-quito`.
2. Abre una terminal (cmd o PowerShell en Windows) dentro de esa carpeta.
3. Si no tienes Git instalado, descárgalo de https://git-scm.com/downloads
4. Corre estos comandos, uno por uno:

```
git init
git add .
git commit -m "Primera versión de la app SUDS Quito"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/suds-quito.git
git push -u origin main
```

(Reemplaza `TU-USUARIO` por tu nombre de usuario de GitHub, y `suds-quito`
por el nombre que le diste al repositorio si fue distinto.)

## Cómo publicarlo gratis (Vercel)

1. Ve a https://vercel.com y entra con tu cuenta de GitHub.
2. Click en "Add New..." → "Project".
3. Selecciona el repositorio `suds-quito`.
4. Vercel detecta automáticamente que es un proyecto Vite — no cambies nada,
   solo dale "Deploy".
5. En 1-2 minutos te da una URL gratis tipo `suds-quito.vercel.app`.

Cada vez que vuelvas a hacer `git push`, el sitio se actualiza solo.

## Cómo ver visitas (opcional, después)

Cuando quieras saber cuánta gente visita el sitio, se puede agregar Google
Analytics o Plausible con un par de líneas en `index.html`. Pregúntale a
Claude cuando estés lista para ese paso.

## Actualizar los datos de lluvia

Los datos de las 12 estaciones están en `src/SudsApp.jsx`, en la constante
`STATIONS` al inicio del archivo. Ahí se reemplazan los valores `p90Duracion`
y `p95Extremos` (actualmente en `null`) por los valores reales calculados
con el script de R, una vez tengas el archivo `rainfall_stations_suds.json`.
