# Resumen del proyecto: El Profe Que Aprende

Fecha de revision local: 2026-05-18

Este documento resume la estructura actual del proyecto para compartirlo con ChatGPT u otra IA y orientar mejoras de diseño, contenido, arquitectura o mantenimiento.

## 1. Vision general

El proyecto es un sitio web educativo llamado **El Profe Que Aprende**, enfocado en docentes, estudiantes e instituciones. Su propuesta actual combina:

- Paginas informativas del sitio principal.
- Recursos educativos offline listos para abrir en navegador o descargar.
- Herramientas TIC y guias para docentes.
- Secciones de maker, secuencias, contacto y perfil.
- Algunas versiones PHP dinamicas y versiones HTML estaticas.

El sitio esta hecho principalmente con **HTML, CSS, JavaScript vanilla, Bootstrap 5.3.3 y Bootstrap Icons**. Tambien existen paginas PHP dentro de `pages/` y un helper PHP para contador de visitas.

## 2. Estructura principal

```text
ELPROFEQUEAPRENDE/
|-- index.html
|-- about.html
|-- contact.html
|-- resources.html
|-- maker.html
|-- sequences.html
|-- tools.html
|-- README.md
|-- setup_profequeaprende.sh
|-- RESUMEN_PROYECTO_PARA_CHATGPT.md
|-- assets/
|   |-- css/
|   |   `-- style.css
|   |-- js/
|   |   `-- scripts.js
|   |-- img/
|   |   `-- profile.png
|   `-- files/
|       `-- EDUTECH OFFLINE/
|           |-- algebra visual/
|           |-- aprendo_teclado/
|           |-- carreras/
|           |-- dado/
|           |-- grupos_suspenso/
|           |-- hala_cuerda_matematico/
|           |-- horarios_campeonatos/
|           |-- moneda/
|           |-- puzzleMath/
|           |-- quizzoffline/
|           |-- ruleta_aleatoria/
|           |-- simulador_arduino_didactico/
|           |-- simulador_palancas/
|           |-- vectores/
|           `-- descargas/
|-- includes/
|   `-- visit_counter.php
`-- pages/
    |-- home.php
    |-- resources.php
    |-- maker.php
    |-- sequences.php
    |-- tools.php
    |-- about.php
    |-- contact.php
    |-- algebra visual/
    |-- image_rec_template/
    `-- image_rec_template copy/
```

## 3. Paginas principales HTML

Estas paginas parecen ser la version publica estatica principal:

- `index.html`: pagina de inicio. Presenta servicios, recursos, clases, tutoriales, opiniones y enlaces a redes.
- `resources.html`: biblioteca de recursos offline. Tiene tarjetas por categorias y enlaces para abrir o descargar recursos.
- `maker.html`: seccion de laboratorio maker y proyectos STEAM.
- `sequences.html`: seccion de secuencias o rutas formativas.
- `tools.html`: guias TIC para docentes, como Word a PDF, Excel, IA en clase y organizacion de archivos.
- `about.html`: pagina de presentacion personal o institucional.
- `contact.html`: pagina de contacto.

Todas usan una navegacion similar, Bootstrap desde CDN, Bootstrap Icons y el archivo comun `assets/css/style.css`.

## 4. Assets compartidos

### CSS

Archivo principal:

```text
assets/css/style.css
```

Contiene la identidad visual del sitio: fondo oscuro, estilo educativo/tecnologico, tarjetas, botones, cabecera, footer, grillas, animaciones y componentes reutilizados por varias paginas.

### JavaScript

Archivo principal:

```text
assets/js/scripts.js
```

Funciones actuales:

- Animacion de contadores.
- Fondo animado tipo red/nodos para paginas que no tienen la clase `stem-playground`.
- Animaciones de aparicion con `IntersectionObserver`.
- Marcado automatico del enlace activo del menu.
- Contador publico de visitas usando `countapi.xyz`.
- Fallback del contador en `localStorage` si falla la API externa.

### Imagenes

```text
assets/img/profile.png
```

Imagen de perfil usada en la version PHP y posiblemente en paginas de presentacion.

## 5. Recursos offline

La carpeta mas importante del contenido educativo es:

```text
assets/files/EDUTECH OFFLINE/
```

Incluye herramientas o juegos independientes, casi todos con su propio `index.html`. Los recursos detectados son:

- `algebra visual`: herramienta para representar/factorizar expresiones con apoyo visual.
- `aprendo_teclado`: practica de teclado.
- `carreras`: juego de calculo mental o competencia por velocidad.
- `dado`: simulador de dado para actividades de azar.
- `grupos_suspenso`: formador de grupos con dinamica visual.
- `hala_cuerda_matematico`: competencia matematica por equipos.
- `horarios_campeonatos`: programador de jornadas deportivas.
- `moneda`: simulador de lanzamiento de moneda.
- `puzzleMath`: rompecabezas matematico.
- `quizzoffline`: evaluacion o banco de preguntas sin internet.
- `ruleta_aleatoria`: ruleta para preguntas, turnos o retos.
- `simulador_arduino_didactico`: simulador visual de Arduino.
- `simulador_palancas`: simulador de fisica sobre palancas.
- `vectores`: visualizador de vectores.

La carpeta `descargas/` contiene paquetes `.zip` para descargar estos recursos y usarlos offline.

## 6. Modulo destacado: horarios_campeonatos

Ubicacion:

```text
assets/files/EDUTECH OFFLINE/horarios_campeonatos/
```

Estructura:

```text
horarios_campeonatos/
├── index.html
├── styles.css
├── app.js
├── scheduler.js
├── ui.js
├── excel.js
├── utils.js
├── README.md
└── sample-data/
```

Resumen:

- Es una herramienta para programar una fecha de jornadas deportivas.
- Permite capturar datos manualmente o importar Excel.
- Usa hojas esperadas como `CONFIG`, `CATEGORIAS`, `TECNICOS`, `EQUIPOS`, `HORARIOS`.
- Exporta a Excel o PDF.
- Tecnologias: HTML, CSS, JavaScript modular, SheetJS, jsPDF y autoTable.

## 7. Version PHP dinamica

Existe una version PHP dentro de `pages/`:

- `pages/home.php`
- `pages/resources.php`
- `pages/maker.php`
- `pages/sequences.php`
- `pages/tools.php`
- `pages/about.php`
- `pages/contact.php`

El archivo `pages/resources.php` genera dinamicamente la lista de recursos desde `assets/files/EDUTECH OFFLINE/`, asignando iconos, descripciones, orden y enlaces de descarga. Esto es mas mantenible que escribir todas las tarjetas manualmente en HTML.

Tambien existe:

```text
includes/visit_counter.php
```

Este archivo incrementa visitas en un archivo JSON local, con bloqueo de archivo (`flock`) y conteo diario. Mantiene hasta 180 dias de datos.

Nota importante: en el estado actual de Git aparecen eliminados `index.php`, `header.php` y `footer.php`, aunque siguen existiendo paginas PHP. Conviene decidir si el proyecto sera principalmente estatico o PHP dinamico.

## 8. Estado tecnico actual

### Fortalezas

- El proyecto ya tiene una identidad clara: recursos educativos practicos para docentes.
- Hay varias herramientas offline reales, no solo paginas informativas.
- La pagina `resources.html` ya organiza los recursos por categorias entendibles.
- Existe una version PHP que puede listar recursos automaticamente.
- El modulo `horarios_campeonatos` esta mejor separado en archivos JS por responsabilidad.
- Se usan librerias comunes y faciles de desplegar: Bootstrap, Bootstrap Icons, JS vanilla.

### Riesgos o puntos debiles

- Hay duplicacion entre paginas HTML estaticas y paginas PHP dentro de `pages/`.
- El README actual no representa bien el estado real del proyecto y tiene caracteres mal codificados.
- Hay archivos con espacios en nombres de carpetas, por ejemplo `EDUTECH OFFLINE` y `algebra visual`, lo que puede complicar rutas, despliegues y automatizaciones.
- Algunas paginas HTML tienen mucho codigo repetido: header, footer, enlaces CSS/JS y menu.
- El contador de visitas en HTML depende de una API externa (`countapi.xyz`), mientras que PHP tiene un contador local diferente.
- Hay recursos comprimidos `.zip` dentro del repositorio, lo que puede aumentar mucho el peso del proyecto.
- El proyecto parece estar en transicion: hay muchos cambios sin confirmar en Git y algunos archivos eliminados.

## 9. Recomendaciones de mejora

### Prioridad alta

- Decidir arquitectura principal: sitio estatico o sitio PHP.
- Actualizar el `README.md` con instrucciones reales de instalacion, estructura, despliegue y mantenimiento.
- Unificar header, footer y navegacion para evitar editar muchas paginas cuando cambie el menu.
- Revisar codificacion UTF-8 en textos con tildes y caracteres especiales.
- Verificar todos los enlaces de abrir/descargar en `resources.html`.

### Prioridad media

- Convertir la lista de recursos a una fuente unica de datos, por ejemplo JSON o PHP, para no duplicar tarjetas.
- Renombrar carpetas nuevas sin espacios, si es posible, o mantener una convencion clara.
- Crear una pagina o documento de inventario de recursos con descripcion, area, grado sugerido, modo offline y archivo de descarga.
- Revisar accesibilidad: textos alternativos, foco visible, contraste, etiquetas ARIA y navegacion por teclado.
- Optimizar rendimiento: peso de imagenes, cantidad de CSS no usado, zips en repo y dependencias por CDN.

### Prioridad baja

- Agregar capturas o miniaturas por recurso.
- Crear fichas pedagogicas descargables para cada herramienta.
- Agregar analitica propia o simplificar el sistema de visitas.
- Automatizar generacion de paquetes `.zip` en lugar de guardarlos manualmente.

## 10. Preguntas utiles para orientar futuras mejoras

- Se quiere que el sitio final funcione en hosting PHP o como sitio completamente estatico?
- Los recursos offline deben poder descargarse todos juntos o solo uno por uno?
- Se busca mejorar principalmente diseno visual, SEO, velocidad, mantenimiento o contenido pedagogico?
- Cual es el publico principal: docentes, estudiantes, instituciones o todos por igual?
- Se desea conservar las dos versiones HTML/PHP o migrar todo a una sola?
- Los recursos offline deben tener fichas por grado, area, duracion y objetivo de aprendizaje?

## 11. Prompt sugerido para pegar en ChatGPT

```text
Actua como arquitecto web y asesor de producto educativo. Te voy a compartir el resumen de un proyecto llamado "El Profe Que Aprende". Quiero que me ayudes a proponer mejoras concretas, priorizadas y faciles de implementar.

Objetivos:
- Mejorar la estructura del proyecto.
- Reducir duplicacion entre HTML y PHP.
- Mejorar la experiencia de docentes que buscan recursos offline.
- Ordenar el README y la documentacion.
- Detectar riesgos tecnicos antes de publicar.

Condiciones:
- El proyecto usa HTML, CSS, JavaScript vanilla, Bootstrap 5.3.3 y algunas paginas PHP.
- Tiene varios recursos offline dentro de assets/files/EDUTECH OFFLINE/.
- Quiero recomendaciones practicas, no una reescritura completa si no es necesaria.

Con base en el resumen, entregame:
1. Diagnostico breve.
2. Lista de mejoras por prioridad.
3. Propuesta de arquitectura recomendada.
4. Plan de trabajo por fases.
5. Archivos que conviene modificar primero.
6. Riesgos que debo revisar antes de desplegar.
```
