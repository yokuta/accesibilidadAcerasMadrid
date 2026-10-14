# Madrid a pie

Storymap sobre la anchura estimada de las aceras de Madrid, con un recorrido desde la ciudad hasta el caso original de Candelaria Mora.

Para verlo en local, ejecuta desde esta carpeta:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Abre http://127.0.0.1:8765/. La carga de los datos necesita un servidor HTTP; abrir el HTML directamente como archivo no es suficiente.

Funciones de la historia:

- Contador de apertura y mapa a pantalla completa con siete paradas al desplazarse.
- Exploración de los 21 distritos, detalle de las mediciones y modo «Ver solo el mapa».
- Comparación de dos distritos: proporción, cantidad de puntos y referencia del conjunto de Madrid.
- Enlaces que recuperan la comparación o el distrito, centro y zoom del mapa.
- Descarga CSV de los distritos seleccionados y la referencia de Madrid.
- Escena original de Candelaria Mora y adaptación a movimiento reducido.

`indexv1.html` conserva la versión inicial. `index.html` utiliza los estilos y herramientas de `assets/`, la exportación de `data/accesibilidad/` y los GeoJSON originales de la raíz para Candelaria. Al publicar, conserva estas rutas. Leaflet, las fuentes y los mapas base se cargan desde servicios externos.

El contador y el comparador utilizan `data/accesibilidad/manifest.json`. Las cifras describen anchuras geométricas estimadas y no certifican la accesibilidad integral de un itinerario; las fuentes, filtros y limitaciones se explican al final de la página.

La presentación utiliza el azul `#0055A0` y DM Sans como referencias de la [guía de color municipal](https://identidad.madrid.es/wp-content/uploads/2026/01/COLOR.pdf) y las [tipografías del Ayuntamiento](https://identidad.madrid.es/tipografias/). La autoría y el análisis son independientes.
