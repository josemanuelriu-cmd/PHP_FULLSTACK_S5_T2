# ZasBoard — Frontend del Club de Juegos de Mesa

Frontend en **React + Vite** para el club de juegos de mesa. Diseño oscuro con estética de tablero de juego clásico.

## Estructura del proyecto

```
src/
├── context/
│   └── AuthContext.js       # Contexto global de autenticación
├── pages/
│   ├── HomePage.jsx         # Vista principal: hero, sesión, asistentes, partidas
│   └── LoginPage.jsx        # Modal de login y registro
├── components/
│   ├── Navbar.jsx            # Barra de navegación
│   ├── SessionCard.jsx       # Tarjeta con los datos de la próxima sesión
│   ├── AttendeesList.jsx     # Lista de hasta 15 asistentes
│   └── GamesList.jsx         # Partidas de la sesión
├── App.jsx                   # Raíz: routing y provider de auth
├── main.jsx                  # Entry point React
└── index.css                 # Estilos globales (sin Tailwind, CSS puro)
```

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y editar el fichero de entorno
cp .env.example .env
# Edita VITE_API_URL con la URL real de tu backend Laravel

# 3. Arrancar en desarrollo
npm run dev
```

## Variables de entorno

Crea un fichero `.env` en la raíz del proyecto:

```
VITE_API_URL=http://localhost:8000/v1
```

En producción, cambia la URL por la de tu servidor.

## Endpoints utilizados

| Acción                    | Método | Ruta                              | Requiere auth |
|---------------------------|--------|-----------------------------------|---------------|
| Login                     | POST   | `/v1/login`                       | No            |
| Registro                  | POST   | `/v1/register`                    | No            |
| Logout                    | POST   | `/v1/logout`                      | Sí            |
| Listar sesiones           | GET    | `/v1/zassessions`                 | Sí            |
| Asistentes de sesión      | GET    | `/v1/zassessions/{id}/users`      | Sí            |
| Partidas de sesión        | GET    | `/v1/zassessions/{id}/games`      | Sí (guest+)   |

## Roles soportados

- `admin` — rojo
- `junta` — ámbar
- `partner` — verde
- `guest` — azul

## Build para producción

```bash
npm run build
# Los ficheros estáticos se generan en dist/
```

## Próximos pasos sugeridos

- Panel de administración (CRUD sesiones, juegos, usuarios)
- Botón de unirse/apuntarse a sesión y partidas
- Vista de perfil editable
- Dashboard de estadísticas (admin/junta/partner)
- Página de catálogo de juegos de mesa
