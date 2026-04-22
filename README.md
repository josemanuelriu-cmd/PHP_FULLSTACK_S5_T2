# ZasBoard — Frontend del Club de Juegos de Mesa

Frontend de la aplicación web **ZAS! Juegos de mesa y rol**, desarrollado en **React 18 + Vite**. Consume la API REST del backend en **Laravel**.

---

## Índice

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Arranque](#arranque)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Páginas y rutas](#páginas-y-rutas)
- [Roles de usuario](#roles-de-usuario)
- [Reglas de negocio implementadas](#reglas-de-negocio-implementadas)
- [Endpoints de la API utilizados](#endpoints-de-la-api-utilizados)
- [Tecnologías](#tecnologías)
- [Notas para el backend](#notas-para-el-backend)
- [Usuarios de prueba](#Usuarios)

---

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Backend Laravel corriendo con:
  - `php artisan migrate` ejecutado
  - `php artisan passport:install` ejecutado
  - (ver sección [Notas para el backend](#notas-para-el-backend))

---

## Instalación

```bash
# Clonar o descomprimir el proyecto
cd zasboard

# Instalar dependencias
npm install
```

---

## Variables de entorno

Crea un fichero `.env` en la raíz del proyecto copiando el ejemplo:

```bash
cp .env.example .env
```

Edita el fichero `.env` y ajusta la URL de tu backend:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Si el backend corre en otro host o puerto, cámbialo aquí. Esta variable es la única configuración necesaria.

---

## Arranque

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

El servidor de desarrollo arranca por defecto en `http://localhost:5173`.

---

## Estructura del proyecto

```
zasboard/
├── public/
├── src/
│   ├── assets/
│   │   └── logo.png              # Logo del club
│   ├── components/               # Componentes reutilizables
│   │   ├── AttendeesList.jsx     # Lista de asistentes a una sesión
│   │   ├── GamesList.jsx         # Lista de partidas (homepage)
│   │   ├── Navbar.jsx            # Barra de navegación principal
│   │   └── SessionCard.jsx       # Tarjeta de próxima sesión (homepage)
│   ├── context/
│   │   └── AuthContext.jsx       # Contexto global de autenticación
│   ├── hooks/
│   │   └── useToast.js           # Hook para mensajes temporales (5s)
│   ├── pages/                    # Páginas de la aplicación
│   │   ├── BoardgameDetail.jsx   # Ficha completa de un juego
│   │   ├── BoardgameForm.jsx     # Formulario crear/editar juego
│   │   ├── BoardgamesPage.jsx    # Ludoteca — listado de juegos
│   │   ├── GameForm.jsx          # Formulario crear/editar partida
│   │   ├── HomePage.jsx          # Página de inicio
│   │   ├── LoginPage.jsx         # Modal de login y registro
│   │   ├── ProfilePage.jsx       # Perfil de usuario (+ admin panel)
│   │   ├── SessionDetail.jsx     # Ficha completa de una sesión
│   │   ├── SessionForm.jsx       # Formulario crear/editar sesión
│   │   ├── SessionsPage.jsx      # Listado de sesiones
│   │   ├── TypeDetail.jsx        # Ficha de un tipo de juego
│   │   ├── TypeForm.jsx          # Formulario crear/editar tipo
│   │   └── TypesPage.jsx         # Listado de tipos de juego
│   ├── App.jsx                   # Router principal y rutas
│   ├── index.css                 # Estilos globales
│   └── main.jsx                  # Entry point
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

---

## Páginas y rutas

| Ruta | Página | Acceso |
|------|--------|--------|
| `/` | Página de inicio | Público / Autenticado |
| `/boardgames` | Ludoteca | Autenticado |
| `/boardgames/new` | Crear juego | admin, junta |
| `/boardgames/:id` | Detalle de juego | Autenticado |
| `/boardgames/:id/edit` | Editar juego | admin, junta |
| `/types` | Tipos de juego | Autenticado |
| `/types/new` | Crear tipo | admin, junta |
| `/types/:id` | Detalle de tipo | Autenticado |
| `/types/:id/edit` | Editar tipo | admin, junta |
| `/sessions` | Sesiones | Autenticado |
| `/sessions/new` | Crear sesión | admin, junta |
| `/sessions/:id` | Detalle de sesión | Autenticado |
| `/sessions/:id/edit` | Editar sesión | admin, junta |
| `/sessions/:sessionId/games/new` | Crear partida | Todos menos guest |
| `/games/:id/edit` | Editar partida | Anfitrión, admin, junta |
| `/profile` | Perfil de usuario | Autenticado |

Las rutas privadas redirigen a `/` si no hay sesión activa.

---

## Roles de usuario

El campo `type` en la tabla `users` define el rol:

| Rol | Etiqueta | Color | Permisos |
|-----|----------|-------|----------|
| `admin` | Admin | Rojo | Acceso total. Puede editar cualquier usuario, gestionar todo el contenido |
| `junta` | Junta | Ámbar | Igual que admin excepto borrar tipos |
| `partner` | Socio | Verde | Puede crear partidas, ver estadísticas, editar su propio perfil |
| `guest` | Invitado | Azul | Solo lectura. Puede apuntarse a sesiones y partidas |

Los usuarios nuevos se registran siempre como `guest`. Un administrador puede cambiar el tipo desde la página de Perfil.

---

## Reglas de negocio implementadas

### Sesiones y partidas

- **Unirse a una partida sin estar en la sesión** → el sistema intenta apuntarte automáticamente a la sesión. Si la sesión está llena, muestra un mensaje de error.
- **Abandonar una sesión con partidas activas** → no se permite si el usuario está apuntado a alguna partida en estado `open` o `limited`. El botón se deshabilita con un mensaje explicativo.
- **Partidas bloqueadas** → si una partida está en estado `playing` o `finished`, nadie puede unirse ni salir de ella.
- **Crear partidas** → disponible para todos los roles excepto `guest`.

### Jugadores en partidas

- El anfitrión (host) o un admin/junta pueden dar de baja a cualquier jugador, incluido el propio anfitrión, siempre que la partida no esté en `playing` o `finished`.

### Mensajes temporales

Los mensajes de confirmación/error en la ficha de sesión (apuntarse, darse de baja, unirse a partida, salir de partida) se muestran durante 5 segundos y desaparecen automáticamente.

### Propietario de juegos

- `owner_user_id = null` → el juego pertenece al club (**ZAS**).
- `owner_user_id = id` → el juego pertenece a ese usuario (se muestra su nickname).

---

## Endpoints de la API utilizados

Base URL configurada en `VITE_API_URL` (por defecto `http://localhost:8000/api/v1`).

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Iniciar sesión |
| POST | `/register` | Registrar nuevo usuario |
| POST | `/logout` | Cerrar sesión |

### Usuarios
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/users` | admin, junta |
| GET | `/users/:id` | admin, junta |
| PUT | `/users/:id` | Propio usuario (campos limitados) / admin (todos) |

### Juegos de mesa
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/boardgames` | Autenticado |
| GET | `/boardgames/:id` | Autenticado |
| POST | `/boardgames` | admin, junta |
| PUT | `/boardgames/:id` | admin, junta |
| DELETE | `/boardgames/:id` | admin, junta |

### Tipos
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/types` | admin, junta, partner |
| GET | `/types/:id` | admin, junta, partner |
| POST | `/types` | admin, junta |
| PUT | `/types/:id` | admin, junta |
| DELETE | `/types/:id` | admin |

### Sesiones
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/zassessions` | Autenticado |
| GET | `/zassessions/:id` | Autenticado |
| POST | `/zassessions` | admin, junta |
| PUT | `/zassessions/:id` | admin, junta |
| DELETE | `/zassessions/:id` | admin, junta |
| POST | `/zassessions/:id/join` | Autenticado |
| DELETE | `/zassessions/:id/leave` | Autenticado |
| GET | `/zassessions/:id/users` | Autenticado |
| GET | `/zassessions/:id/games` | Autenticado |

### Partidas
| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/games/:id` | Autenticado |
| GET | `/games/:id/users` | Autenticado |
| POST | `/games` | Todos menos guest |
| PUT | `/games/:id` | Anfitrión, admin, junta |
| DELETE | `/games/:id` | admin, junta |
| POST | `/games/:id/join` | Autenticado |
| DELETE | `/games/:id/leave` | Autenticado |

---

## Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.3 | Framework de UI |
| React Router DOM | 6.26 | Enrutado client-side |
| Vite | 5.4 | Bundler y servidor de desarrollo |
| CSS personalizado | — | Sin frameworks CSS externos |
| Google Fonts | — | Cinzel (títulos) + Raleway (cuerpo) |

No se usa Tailwind ni ningún componente de terceros. Todo el CSS está en `src/index.css`.

---

## Notas para el backend

Para que el frontend funcione correctamente, el backend Laravel necesita los siguientes ajustes:

### Modelo `Boardgame`
```php
public function types()
{
    return $this->belongsToMany(
        Type::class, 'boardgame_type', 'boardgame_id', 'type_id'
    )->withTimestamps();
}

public function owner()
{
    return $this->belongsTo(User::class, 'owner_user_id');
}
```

### Modelo `Type`
```php
public function boardgames()
{
    return $this->belongsToMany(
        Boardgame::class, 'boardgame_type', 'type_id', 'boardgame_id'
    )->withTimestamps();
}
```

### `BoardgameController`
- `index()` y `detail()`: usar `with(['types', 'owner'])` para eager loading.
- `store()` y `update()`: llamar a `$boardgame->types()->sync($request->input('types', []))` tras crear/actualizar.
- Reglas de validación en `update()`: incluir `'owner_user_id' => 'sometimes|nullable|integer|exists:users,id'` y `'types' => 'nullable|array'`.

### CORS
Asegúrate de que el backend permite peticiones desde `http://localhost:5173` (o el dominio de producción) en `config/cors.php`.

### Autenticación
El frontend usa **Passport** (Bearer token). El token se almacena en `localStorage` bajo la clave `zas_token`.

---

## Usuarios de prueba
Para poder hacer pruebas con la aplicación se han creado 4 usuarios con los 4 roles.

| Email | Password | Rol |
|-------|----------|-----|
| test@example.com | password | admin |
| test2@example.com | password2 | junta |
| test3@example.com | password3 | partner |
| test4@example.com | password4 | guest |

> ⚠️ Estos usuarios son solo para entorno de desarrollo. No uses estas credenciales en producción, no funcionarán.

## Solución de problemas frecuentes

| Error | Causa | Solución |
|-------|-------|----------|
| `invalid key supplied` | Claves OAuth de Passport no generadas | `php artisan passport:keys` |
| `401 Unauthorized` | Token expirado o inválido | Hacer logout y volver a iniciar sesión |
| `422 Unprocessable Content` en PUT boardgame | Regla de validación de `owner_user_id` sin `nullable` | Añadir `nullable` a la regla en `BoardgameController` |
| Los tipos no se muestran en los juegos | Falta `with('types')` en el controlador | Ver sección Notas para el backend |
| CORS bloqueado | Backend no permite el origen del frontend | Añadir `localhost:5173` en `config/cors.php` |