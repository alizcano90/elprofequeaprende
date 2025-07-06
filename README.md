# ElProfeQueAprende.com – Scaffold PHP 8.2 + Bootstrap

## Pasos rápidos

1. Clona este repo y sube tus materiales a `/resources/`.
2. En tu repositorio de GitHub, ve a **Settings → Secrets → Actions** y define:
   - `SSH_HOST`
   - `SSH_USER`
   - `SSH_KEY` (clave privada en formato PEM)
   - `SSH_PATH` (directorio destino, p. ej. `/var/www/profequeaprende`)
3. `git add . && git commit -m "Initial scaffold" && git push origin main`
4. Cada *push* a `main` ejecutará el despliegue automático vía `rsync`.

¡Listo para aprender y compartir! 💻📚
