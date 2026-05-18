# Programador de Jornadas Deportivas (una fecha)

## Uso rápido

1. Abrir `index.html` en el navegador.
2. Elegir una opción:
   - capturar datos manualmente en la pestaña **Datos base**, o
   - importar Excel con `CONFIG`, `CATEGORIAS`, `TECNICOS`, `EQUIPOS`, `HORARIOS`.
3. Definir la fecha en **Configuración**.
4. En **Enfrentamientos**, agregar solo los cruces que quieres jugar en esa fecha.
5. Pulsar **Programar fecha**.
6. Revisar **Programación final** y **Alertas**.
7. Exportar a Excel o PDF.

## Nota importante

- Ya no se usa la hoja `PARTIDOS_REALIZADOS`.
- El enfoque actual es una sola fecha y enfrentamientos definidos por el usuario.

## Tecnología

- HTML, CSS, JavaScript modular
- SheetJS (`xlsx`) para importar/exportar Excel
- jsPDF + autoTable para exportar PDF
