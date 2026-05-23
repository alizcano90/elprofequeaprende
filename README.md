# ElProfeQueAprende.com

Sitio PHP 8 para recursos educativos de El Profe Que Aprende.

## EPQA Horarios Inteligentes

Modulo creado en `/horarios` para generar, auditar, editar y exportar horarios escolares con reglas P0/P1/P2.

### Archivos principales

- `/horarios/index.php`: interfaz web del modulo.
- `/horarios/api/*.php`: endpoints PHP puros para seed, importacion, auditoria, versionado y exportacion.
- `/horarios/assets/app.js`: editor visual, heuristica inicial, drag-and-drop, auditoria y exportes.
- `/horarios/assets/styles.css`: diseno visual del modulo.
- `/horarios/sql/001_create_tables.sql`: creacion de tablas MySQL/MariaDB.
- `/horarios/sql/002_seed_catalogs.sql`: catalogos iniciales y usuario admin local.
- `/horarios/sql/003_multiusuario_freemium.sql`: propiedad por usuario, planes, versiones, auditoria y bitacora.
- `/horarios/data/horario_seed_epqa.json`: JSON semilla.

### Instalacion en hosting PHP

1. Suba la carpeta `/horarios` al hosting, de forma que abra en:
   `https://elprofequeaprende.com/horarios/`

2. En phpMyAdmin, seleccione la base de datos del sitio y ejecute en este orden:
   - `horarios/sql/001_create_tables.sql`
   - `horarios/sql/002_seed_catalogs.sql`
   - `horarios/sql/003_multiusuario_freemium.sql`

3. Configure la conexion MySQL igual que el resto del sitio:
   - Variables de entorno `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_CHARSET`; o
   - archivo local `config/database.local.php`.

4. Entre a `/horarios/`. Si MySQL no esta disponible, el modulo abre en modo demostracion usando `horarios/data/horario_seed_epqa.json`.

### Prompt SQL para phpMyAdmin

Use este texto si quiere pedirle a phpMyAdmin/IA que cree las tablas:

```sql
-- Ejecutar primero:
SOURCE horarios/sql/001_create_tables.sql;

-- Ejecutar despues:
SOURCE horarios/sql/002_seed_catalogs.sql;

-- Activar propiedad por usuario, planes y bitacora:
SOURCE horarios/sql/003_multiusuario_freemium.sql;
```

Si phpMyAdmin no acepta `SOURCE`, abra cada archivo `.sql`, copie su contenido completo y ejecutelo en la pestana SQL.

### Regla de publicacion

Una version solo puede marcarse como `FINAL` cuando la auditoria tenga `P0 = 0`. El boton `Publicar PDF final` queda deshabilitado mientras exista cualquier P0 en `NO CUMPLE`.
