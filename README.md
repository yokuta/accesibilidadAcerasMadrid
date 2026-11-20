# Madrid a pie

**Madrid a pie** es un storymap interactivo sobre la **anchura geométrica estimada de las aceras de Madrid**. Combina una visión del conjunto de la ciudad, la exploración por distritos y el caso original de **Candelaria Mora**.

Este repositorio incluye tanto la visualización web como un **Jupyter Notebook para reproducir el cálculo de la anchura** a partir de un GeoJSON de polígonos de aceras.

## 1. Ver el storymap en local

Desde la carpeta raíz del repositorio, ejecuta:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Abre [http://127.0.0.1:8765/](http://127.0.0.1:8765/) en el navegador. La carga de datos requiere un servidor HTTP: abrir `index.html` directamente como archivo no es suficiente.

### Qué permite hacer

- Recorrer la historia mediante un contador de apertura y un mapa a pantalla completa con siete paradas al desplazarse.
- Explorar los **21 distritos de Madrid**, consultar las mediciones y activar el modo **«Ver solo el mapa»**.
- Comparar dos distritos por proporción y cantidad de puntos, con referencia al conjunto de Madrid.
- Compartir enlaces que recuperan la comparación o el distrito, el centro y el zoom del mapa.
- Descargar los datos CSV de los distritos seleccionados y la referencia de Madrid.
- Consultar la escena original de Candelaria Mora y utilizar la adaptación a movimiento reducido.

## 2. Cómo se calcula la anchura de las aceras

El notebook [`calculo_anchura_aceras_desde_geojson.ipynb`](calculo_anchura_aceras_desde_geojson.ipynb) contiene el proceso geométrico independiente de la interfaz del storymap. Parte de un **GeoJSON con polígonos de aceras**, no de líneas del viario ni de imágenes, y estima una anchura local aproximadamente cada **1 metro**.

El procedimiento es:

1. Cargar los polígonos de las aceras y reproyectarlos a **EPSG:25830** para trabajar en metros.
2. Estimar el **eje central** de cada polígono mediante `pygeoops.centerline()`.
3. Generar puntos de muestreo a intervalos de 1 metro a lo largo del eje.
4. Construir una **línea perpendicular** al eje en cada punto.
5. Intersectar esa perpendicular con el polígono de la acera y medir la longitud del segmento que pasa por el punto de muestreo.
6. Filtrar cortes no válidos y exportar las medidas y un resumen por acera.

El método procede de la celda 31 de `Accesibilidad (2).ipynb`, contrastada con la celda 3 de `Calles (1).ipynb` (numeración de celdas desde 1). La versión publicada aquí se ha simplificado para que **no necesite un archivo de portales ni otras capas auxiliares**. Incluye una mejora para no sumar segmentos separados cuando una sección perpendicular corta varias partes del polígono.

### Ejecutar el notebook

Necesitas Python y Jupyter. Instala las dependencias:

```sh
python -m pip install notebook geopandas pygeoops shapely numpy pandas tqdm matplotlib
```

Coloca `aceras_madrid.geojson` en la misma carpeta que el notebook, o edita la variable `RUTA_ACERAS` para indicar su ubicación. Después, abre Jupyter:

```sh
python -m notebook calculo_anchura_aceras_desde_geojson.ipynb
```

Ejecuta las celdas en orden. En la sección de configuración puedes modificar:

- `RUTA_ACERAS`: ruta del GeoJSON de entrada, con geometrías `Polygon` o `MultiPolygon` y un CRS correctamente definido.
- `PASO_M = 1.0`: distancia entre puntos de medición, en metros.
- `MAX_ACERAS = 20`: opción para probar con 20 aceras antes de procesar toda la ciudad; `None` procesa todas.
- `EXPORTAR_CORTES` y `EXPORTAR_EJES`: opciones para guardar geometrías auxiliares y revisar el método en QGIS.

### Resultados

El notebook crea automáticamente la carpeta `salidas/` con:

| Archivo | Contenido |
| --- | --- |
| `anchura_aceras_puntos_1m.gpkg` | Puntos de muestreo georreferenciados, con `acera_id`, distancia al inicio del eje (`dist_m`) y anchura (`anchura_m`), entre otros campos. |
| `resumen_anchura_por_acera.csv` | Número de puntos, anchura media, mínima y máxima, y porcentaje de mediciones por debajo de 1,80 m, para cada acera. |

Si se activan las opciones correspondientes, también se exportan `anchura_aceras_cortes_1m.geojson` y `ejes_centrales_aceras.geojson`.

**Importante:** el notebook produce mediciones geométricas y archivos de análisis. **No genera por sí mismo `data/accesibilidad/manifest.json` ni actualiza automáticamente los datos publicados en el storymap.** La preparación de los datos de la visualización es un paso separado.

## 3. Estructura y publicación del proyecto

- `index.html`: versión actual del storymap; utiliza los estilos y herramientas de `assets/`.
- `indexv1.html`: versión inicial, conservada como referencia.
- `assets/`: recursos de la interfaz.
- `data/accesibilidad/`: datos preparados para la visualización; `manifest.json` alimenta el contador y el comparador.
- GeoJSON originales de la raíz: utilizados en la escena de Candelaria Mora.
- `calculo_anchura_aceras_desde_geojson.ipynb`: procedimiento reproducible de estimación de anchuras.
- `salidas/`: carpeta que genera el notebook al ejecutarse; no es necesaria para mostrar la versión web si ya están publicados sus datos preparados.

Al publicar la web, conserva las rutas relativas utilizadas por `index.html`. Leaflet, las fuentes y los mapas base se cargan desde servicios externos y requieren conexión a Internet.

## 4. Interpretación y limitaciones

Las cifras muestran **estimaciones geométricas**, no mediciones topográficas certificadas ni una evaluación integral de accesibilidad. La anchura calculada depende de la geometría y calidad del GeoJSON: no resta mobiliario urbano, árboles u otros obstáculos que no estén representados en los polígonos. En cruces, esquinas, ensanchamientos y bifurcaciones los cortes pueden resultar menos estables.

La etiqueta de **1,80 m** sirve como referencia para clasificar mediciones de anchura, pero **no acredita por sí sola el cumplimiento de la normativa de accesibilidad**. El notebook descarta cortes fuera de los límites configurados, por lo que sus resultados deben interpretarse teniendo en cuenta esos filtros. Las fuentes, criterios y limitaciones de la visualización se explican también al final del storymap.

## 5. Diseño y autoría

La presentación utiliza el azul `#0055A0` y la tipografía **DM Sans** como referencias de la [guía de color municipal](https://identidad.madrid.es/wp-content/uploads/2026/01/COLOR.pdf) y las [tipografías del Ayuntamiento de Madrid](https://identidad.madrid.es/tipografias/). **La autoría y el análisis son independientes**.
