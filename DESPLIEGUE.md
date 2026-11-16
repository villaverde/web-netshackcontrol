# Despliegue en el clúster: instrucciones para agentes

Este proyecto se despliega con el **panel de despliegue** (`https://panel.apps.servicios-dns.com`),
que usa ArgoCD sobre un clúster K3s de un solo nodo. Léelo **antes** de tocar el `Dockerfile`,
el `.woodpecker.yml`, los settings, las dependencias de infraestructura o cualquier cosa que
cambie cómo arranca o qué necesita la aplicación en producción.

> Copia este fichero tal cual en la raíz del repositorio de la aplicación y enlázalo desde el
> `CLAUDE.md` o el `AGENTS.md` del proyecto, por ejemplo:
> «Antes de cambiar nada del despliegue, lee `DESPLIEGUE.md`.»
> La versión al día se descarga del propio panel, en «Guía» o en «Cómo integrarla» de cada
> aplicación. Si el panel cambia, vuelve a descargarla.

---

## 1. La regla más importante: si no está soportado, avisa

El panel admite **tres tipos cerrados** de aplicación (§3) y una lista concreta de piezas (§4).
No hay forma de añadir infraestructura desde el repositorio: no se aplican manifiestos, charts
ni ficheros de despliegue que vivan aquí.

Si la tarea o el proyecto necesitan algo que **no** aparece en §4, o algo de §5:

1. **No lo improvises.** No añadas manifiestos de Kubernetes, charts, `docker-compose` de
   producción, sidecars, ni una imagen extra para un servicio. No metas un servicio dentro del
   contenedor de la web para esquivar la limitación.
2. **Para y avisa al desarrollador** antes de seguir, con este formato:

   ```
   ⚠️ Esto no lo soporta el panel de despliegue
   Qué hace falta: <la pieza o capacidad>
   Por qué: <qué parte del código o de la tarea lo necesita>
   Alternativas dentro del panel: <si las hay, de §4; si no, "ninguna">
   Qué pasaría si se despliega así: <qué fallaría y cuándo>
   ```

3. Sigue solo con lo que no depende de eso, o con la alternativa que elija el desarrollador.

Avisa también cuando un cambio sea compatible pero obligue a hacer algo **en el panel antes
del merge**: una clave de configuración nueva, un proceso nuevo o un cambio de volumen (§6, §8).

---

## 2. Cómo llega un cambio a producción

```
merge a la rama de producción
  └─▶ Woodpecker: construye cada imagen con Kaniko y la publica en Harbor con el SHA del commit
        └─▶ paso `desplegar`: el panel comprueba que las claves obligatorias tienen valor
              y que todas las imágenes de ese SHA están en Harbor; si falta algo, el paso
              falla diciendo qué, y producción no cambia
              └─▶ ArgoCD: Job de migración con la imagen NUEVA (si la hay)
                    └─▶ si migra bien: sustituye los Deployments
```

- **Publicar es mergear.** No hay botón de desplegar ni tag mutable (`:stable`, `:latest`): solo
  `:<sha>`.
- **Si la migración falla**, el despliegue se para y la versión anterior sigue sirviendo.
- **Revertir, reiniciar, ver los logs y lanzar tareas** se hace desde el panel, no desde el
  repositorio.
- Otras ramas y los pull requests solo **construyen** la imagen para validarla: ni publican ni
  despliegan.

---

## 3. Los tres tipos

| Tipo | Para qué | Imágenes | Puerto |
|---|---|---|---|
| **`django`** | Django servido con Gunicorn | una, `Dockerfile` en la raíz | 8000 |
| **`api`** | un backend de cualquier stack (FastAPI, Node, Astro con SSR…), con o sin una SPA delante | sin frontend: una, en la raíz. Con frontend: `backend/Dockerfile` y `frontend/Dockerfile` | backend 8000 (configurable); frontend 8080 |
| **`estatica`** | un sitio ya construido (Astro, Vite…) servido por nginx | una, en la raíz | 8080 |

**Cómo elegir:**
- Si es Django, es `django`, aunque tenga una API.
- Si es otro backend, o Django sirviendo **solo** una API junto a una SPA aparte, es `api`.
- Si no necesita ni servidor ni base de datos en ejecución, es `estatica`.
- Un mismo repositorio solo puede ser **una** aplicación de **un** tipo.

---

## 4. Lo que el panel soporta

| Pieza | Tipos | Detalles |
|---|---|---|
| **Componente principal** | todos | `web` (django, estatica) o `backend` (api). Una réplica. Sonda HTTP en la ruta de salud que se declare, o TCP si no hay. |
| **Frontend SPA** | api | Imagen nginx en el 8080, recibe `/`. El backend recibe solo sus prefijos (p. ej. `/api/v1`, `/static`) y rutas exactas (p. ej. `/health`). |
| **Base de datos** | django, api | **MariaDB**, creada por el panel en el alta. Llega en `DATABASE_URL` (§7). Copias diarias automáticas. |
| **Migración antes de cada despliegue** | django, api | Un Job con la imagen nueva y el comando que se declare. En django, por defecto `python manage.py migrate --noinput`. |
| **Procesos** | django, api | Workers de Celery, beat, consumidores de colas: **misma imagen** que el principal y otro comando. Una copia cada uno, sin puerto ni Service. Se declaran en el panel. |
| **Redis** | django, api | Imagen oficial, **sin contraseña ni persistencia** (se vacía al reiniciar), solo accesible desde la propia aplicación. Llega en `REDIS_URL` (base 0). Para Celery, usa otra base: `redis://<app>-redis:6379/1`. |
| **Volumen persistente** | django, api | **Uno** por aplicación, `local-path` ReadWriteOnce (5Gi por defecto). Lo montan el principal y los procesos que se marquen, en la ruta que se elija. |
| **Ficheros subidos públicos** | django | Un nginx de solo lectura sirve `/media/` (o la ruta elegida) desde el volumen. Si son privados, que los sirva Django con sus permisos y no se activa. |
| **Tareas** | django, api | Comandos que se lanzan a mano desde el panel (p. ej. `clearsessions`, una importación), con la imagen que esté en marcha. |
| **Configuración** | django, api | Variables (ConfigMap) y secretos (Secret) declarados en el panel. Llegan como variables de entorno. |
| **Dominio y TLS** | todos | `<app>.apps.servicios-dns.com` por defecto, o un dominio propio con redirección de `www`. Certificado automático (Let's Encrypt). |
| **Entorno de desarrollo** | todos | «Crear entorno» en el panel: una copia de la aplicación con otra rama (p. ej. `development`), su base y su dominio. |
| **Recursos** | todos | Por tallas, con estos límites: XS 128Mi · S 256Mi · M 768Mi · L 1,5Gi de memoria. Por defecto M; el frontend, S. |
| **Salida a internet** | todos | Sin restricciones: APIs externas, SMTP o proveedores de correo como servicio externo configurado. |

---

## 5. Lo que NO soporta (avisa, §1)

- **Otras bases de datos:** PostgreSQL, MongoDB, SQL Server… Tampoco SQLite como base de
  producción.
- **Otros servicios dentro de la aplicación:** RabbitMQ, Elasticsearch/OpenSearch, Memcached,
  MinIO o S3 propio, servidores de correo, un segundo Redis, Redis con contraseña o con
  persistencia.
- **Más de una réplica**, autoescalado o despliegues sin corte. El principal con volumen se
  reinicia con `Recreate`: unos segundos sin servicio en cada despliegue.
- **Más de un volumen**, volúmenes compartidos entre aplicaciones, o almacenamiento que
  sobreviva al nodo (el volumen está en el disco del único nodo).
- **Tareas programadas por calendario** (CronJob). Las alternativas son un proceso con
  Celery beat (django o api, con Redis) o un proceso que duerma entre ejecuciones.
- **Más imágenes** de las de su tipo: django, una; api, backend y frontend; estatica, una.
  Tampoco sidecars ni init containers.
- **Rutas del Ingress a medida:**
  - en django, solo `/` a la web y la ruta de media al nginx;
  - en api, los prefijos del backend y `/` al frontend.
  - Tampoco anotaciones propias de Traefik: autenticación básica, límites, cabeceras distintas.
- **Varios dominios distintos** desde el formulario: solo el principal y su `www`.
- **Ejecutar como root**, puertos por debajo de 1024, capabilities o escribir en el sistema de
  ficheros fuera del volumen o de `/tmp`.
- **Secretos en tiempo de construcción** o argumentos de build por entorno: el pipeline generado
  no pasa ninguno. Lo que se incruste en el build (p. ej. la URL de la API de una SPA) tiene que
  valer para todos los entornos: usa rutas relativas.
- **Ficheros de despliegue en el repositorio:** `deploy/`, charts, manifiestos, `config-schema.yaml`,
  `puerta.py`, `tareas.yaml`. Eran del sistema anterior; no se crean.

Si algo no está ni en §4 ni aquí (WebSockets, conexiones muy largas, GPU, colas de otro tipo…),
**pregunta antes de construir sobre ello**.

---

## 6. Lo que tiene que cumplir la imagen

El clúster aplica *Pod Security restricted*. Comprueba todo esto en cada `Dockerfile`:

1. **Sin root, con UID y GID 10001.** Crea el usuario y dale la propiedad de lo que tenga que
   escribir (`COPY --chown=10001:10001`, `USER 10001:10001`).
2. **Puerto por encima de 1024:** 8000 en django y en el backend; 8080 en el frontend y en
   estatica (`nginxinc/nginx-unprivileged`).
3. **Escribir solo en el volumen o en `/tmp`.** El frontend, la estática, Redis y el nginx de
   media van siempre con el sistema de ficheros en **solo lectura**. El principal de api puede
   ir también así; si se elige, todo lo que escriba tiene que ir a `/tmp` o al volumen.
4. **Sin migraciones en el `CMD`.** Las lanza ArgoCD en su Job. En el arranque se repetirían en
   cada reinicio y un fallo dejaría el pod en `CrashLoopBackOff` en vez de parar el despliegue.
5. **Arranque rápido y repetible.** Lo que haga el `CMD` antes del servidor (crear un admin,
   cargar datos iniciales…) tiene que poder ejecutarse en cada reinicio sin efectos, y no puede
   depender de una migración que no haya corrido. El servidor, con `exec`, para que reciba
   `SIGTERM`.
6. **Estáticos en el build.** `collectstatic` o `npm run build` al construir, nunca al arrancar.
   Si los settings leen variables obligatorias al importarse, pásale al build **valores de
   relleno**, obviamente falsos (ver §7).
7. **Compatible con Kaniko.** Nada de `RUN --mount=type=bind,from=…` ni `# syntax=`: para pasar
   ficheros entre etapas, `COPY --from`. Con el pipeline que genera el panel se publica la
   **última etapa** del `Dockerfile`, sin `--target`: la de producción tiene que ir al final.
8. **Logs a la salida estándar.** El panel los muestra desde ahí.
9. **Ruta de salud barata**, si se declara una. Kubernetes la pide con la **IP del pod** como
   `Host`, por HTTP y sin cabeceras del proxy. En Django eso da `400 DisallowedHost` o una
   redirección a HTTPS, salvo que la ruta se responda **antes** de validar el host (un
   middleware el primero de la lista, exento de `SECURE_SSL_REDIRECT`). Si no la hay, déjala
   vacía: la sonda será TCP.

---

## 7. Configuración

- **Todo entra por variables de entorno**, que el panel escribe desde su pantalla de
  «Configuración». Una **secreta** va a un Secret y nadie puede volver a leerla; el resto, a un
  ConfigMap.
- **Una clave nueva hay que declararla en el panel y darle valor antes del merge** que la use.
  Si es obligatoria y no tiene valor, el despliegue se para en el paso `desplegar`. Cuando un
  cambio tuyo lea una variable nueva, **díselo al desarrollador**: nombre, si es secreta y si es
  obligatoria.
- **Nunca** pongas un secreto en el código, en el `Dockerfile`, en el pipeline ni en un `.env`
  versionado.

**Claves que crea el panel en el alta:**

| Tipo | Claves |
|---|---|
| django | `DATABASE_URL` (secreta), `SECRET_KEY` (secreta, aleatoria), `ALLOWED_HOSTS` y `CSRF_TRUSTED_ORIGINS` (sacadas del dominio, separadas por comas) |
| api | `DATABASE_URL`, si se pidió base de datos |
| estatica | ninguna |

Con Redis, el panel añade además `REDIS_URL=redis://<app>-redis:6379/0` a la web, a los
procesos y a la migración.

**`DATABASE_URL` tiene la forma `mysql+pymysql://usuario:clave@host:3306/base`,** al estilo de
SQLAlchemy:
- **FastAPI / SQLAlchemy:** se usa tal cual (con `pymysql` instalado).
- **Django:** `dj-database-url` **no reconoce** ese esquema, así que hay que cambiarlo:

  ```python
  import os
  import dj_database_url
  import pymysql

  pymysql.install_as_MySQLdb()  # MariaDB sin compilar nada en la imagen

  SECRET_KEY = os.environ["SECRET_KEY"]
  ALLOWED_HOSTS = os.environ["ALLOWED_HOSTS"].split(",")
  CSRF_TRUSTED_ORIGINS = os.environ["CSRF_TRUSTED_ORIGINS"].split(",")
  DATABASES = {
      "default": dj_database_url.parse(
          os.environ["DATABASE_URL"].replace("mysql+pymysql://", "mysql://", 1)
      )
  }
  CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://<app>-redis:6379/1")
  MEDIA_ROOT = "/app/media"      # = el punto de montaje del volumen elegido en el panel
  STATIC_ROOT = "/app/static"    # dentro de la imagen, servido por WhiteNoise
  ```

  Y en el `Dockerfile`, el build con valores de relleno:

  ```dockerfile
  RUN SECRET_KEY=construccion DATABASE_URL=sqlite:////tmp/construccion.db \
      ALLOWED_HOSTS=localhost CSRF_TRUSTED_ORIGINS=https://localhost \
      python manage.py collectstatic --noinput
  ```

---

## 8. Migraciones, procesos y tareas

- **Las migraciones corren con la versión anterior aún sirviendo.** Tienen que ser
  **compatibles con el código anterior**:
  - añadir una tabla o una columna que admita nulos, sí;
  - renombrar o borrar una columna en un solo paso, **no**: se hace en dos despliegues, primero
    el código deja de usarla y después se quita;
  - una columna nueva `NOT NULL` necesita un valor por defecto.
- **Un proceso nuevo** (un worker, beat) se declara en el panel y entra **con el siguiente
  despliegue**, que es cuando llega su código. Si el cambio que haces necesita un proceso nuevo,
  o cambia el comando de uno, **avisa**: hay que declararlo antes del merge.
  - Los procesos tienen que atender `SIGTERM`: tienen 30 segundos por defecto para terminar lo
    que estén haciendo.
  - **Hay una sola copia de cada proceso**, salvo durante unos segundos en cada despliegue. Si
    dos copias a la vez pueden hacer daño (enviar un correo dos veces, cobrar dos veces), la
    cola tiene que protegerse sola: bloqueos de fila, claves de idempotencia.
- **Una tarea** es un comando que se lanza a mano desde el panel con la imagen en marcha. Sirve
  para mantenimiento puntual, no para algo que tenga que ejecutarse solo.

---

## 9. El repositorio

Para desplegar, el repositorio solo necesita:

- **El `Dockerfile`**, o `backend/Dockerfile` y `frontend/Dockerfile` en api con frontend.
- **El `.woodpecker.yml` que genera el panel** («Cómo integrarla» en la ficha de la
  aplicación). No se edita a mano: si cambia, se vuelve a copiar del panel.
  - Si el proyecto tiene pasos propios (tests, contratos, un paso de publicar con `--target`),
    se conservan. Lo que no puede faltar ni cambiar:
    - los pasos de publicar suben **solo** `:<sha>` de cada imagen;
    - el paso `desplegar` es el del panel y va **después** de publicar todas las imágenes;
    - los avisos (`avisar-push`, `avisar-fallo`) son también los del panel.
  - Ningún paso que use secretos puede correr en `pull_request`: Woodpecker rechazaría el
    pipeline entero.
- **Tres secretos en Woodpecker:** `harbor_username`, `harbor_password` y `panel_token`, con los
  eventos `push` y `manual`. Los pone el panel en el alta; si no puede, se los da al desarrollador
  para cargarlos a mano. No los crees ni los renombres tú.

Nada más: ni `deploy/`, ni charts, ni manifiestos.

---

## 10. Antes de dar por terminado un cambio

- [ ] ¿El `Dockerfile` cumple §6: UID 10001, puerto, sin `migrate` en el `CMD`, estáticos en el
      build, compatible con Kaniko?
- [ ] ¿Las migraciones nuevas son compatibles con el código anterior (§8)?
- [ ] ¿Hay variables de entorno nuevas? Avisa con nombre, si es secreta y si es obligatoria, para
      que se declaren en el panel **antes** del merge.
- [ ] ¿Hace falta un proceso nuevo o cambiar uno? Avisa para declararlo antes del merge.
- [ ] ¿Escribe ficheros? Solo en el volumen (si la app lo tiene) o en `/tmp`.
- [ ] ¿Necesita algo de §5 o que no esté en §4? Para y avisa (§1).
