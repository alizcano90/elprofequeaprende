# Cambios del gestor de horarios

## 2026-05-22

### Interfaz y experiencia de usuario

- Se agregaron sonidos, toasts y modales propios para reemplazar alertas nativas del navegador.
- Se corrigio el cierre de modales con boton, clic fuera y tecla Escape.
- Se agrego modal de carga mientras el modelo genera una propuesta.
- Se mejoraron colores y estados visuales de botones principales.
- Se agregaron mensajes de auditoria y restricciones con saltos de linea para lectura mas clara.
- Se agrego diccionario de reglas para mostrar nombres legibles en espanol.

### Generacion de horarios

- El boton Generar propuesta ahora ejecuta un modelo heuristico multi-intento.
- El modelo evalua disponibilidad docente, sedes, espacios, bloqueos P0/P1/P2, grupos y choques.
- Si no puede ubicar todo, muestra la mejor propuesta posible y las horas faltantes.
- Los bloques se interpretan como unidades consecutivas: 3h con bloque 2h genera 2h + 1h, y 4h con bloque 2h genera 2h + 2h.

### Edicion manual

- Se agrego confirmacion antes de reemplazar o intercambiar clases en una celda ocupada.
- Si el usuario confirma, la clase desplazada vuelve a pendientes.
- Se bloquearon movimientos entre sedes incompatibles.
- La vista por profesor muestra la sede asignada en el encabezado de cada dia.

### Catalogos y cargas

- Se agrego sede por defecto al crear docentes.
- Se agrego importancia P0/P1/P2 por carga.
- Se agregaron filtros tipo tabla para materias asignadas por docente, grupo, materia, importancia y texto libre.
- La tabla de materias muestra total de cargas y horas filtradas.

### Auditoria

- Se elimino la alerta `weekday-only`, porque el sistema solo trabaja de lunes a viernes.
- Se normalizan internamente variantes de Miercoles/Miércoles.
- Se mejoraron mensajes de choques para explicar el motivo concreto.

### Multiusuario y freemium

- Se conecto el modulo con la sesion real del proyecto (`EPQA_SESSION`) y el usuario autenticado.
- Se agrego propiedad por usuario para horarios, versiones, importaciones/exportaciones, auditoria y bitacora.
- Se agrego migracion `003_multiusuario_freemium.sql` con tablas de horarios multiusuario, limites de plan, bitacora, simulaciones y auditoria.
- Se agrego selector de horario activo, plan visible, crear, duplicar, exportar JSON y eliminar.
- Se implemento limite freemium: plan gratuito con un horario; planes pro/institucional con multiples horarios segun configuracion.
- Se valida propiedad del horario en backend antes de cargar, guardar, importar, exportar, duplicar, eliminar o auditar.
