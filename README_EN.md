# ZasBoard — Board Game Club Frontend

Frontend for the **ZAS! Board Games and Roleplay** web application, built with **React 18 + Vite**. Consumes the REST API from a **Laravel** backend.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Pages and Routes](#pages-and-routes)
- [User Roles](#user-roles)
- [Business Rules](#business-rules)
- [API Endpoints Used](#api-endpoints-used)
- [Technologies](#technologies)
- [Backend Notes](#backend-notes)
- [Test Users](#test-users)
- [Troubleshooting](#troubleshooting)

---

## Requirements

- Node.js 18 or higher
- npm 9 or higher
- Laravel backend running with:
  - `php artisan migrate` executed
  - `php artisan passport:install` executed
  - (see [Backend Notes](#backend-notes) section)

---

## Installation

```bash
# Unzip or clone the project
cd zasboard

# Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file and set your backend URL:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

If the backend runs on a different host or port, update it here. This is the only required configuration.

---

## Running the App

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server starts at `http://localhost:5173` by default.

---

## Project Structure

```
zasboard/
├── public/
├── src/
│   ├── assets/
│   │   └── logo.png              # Club logo
│   ├── components/               # Reusable components
│   │   ├── AttendeesList.jsx     # Session attendees list
│   │   ├── GamesList.jsx         # Games list (homepage)
│   │   ├── Navbar.jsx            # Main navigation bar
│   │   └── SessionCard.jsx       # Next session card (homepage)
│   ├── context/
│   │   └── AuthContext.jsx       # Global authentication context
│   ├── hooks/
│   │   └── useToast.js           # Auto-dismiss message hook (5s)
│   ├── pages/                    # Application pages
│   │   ├── BoardgameDetail.jsx   # Full board game detail
│   │   ├── BoardgameForm.jsx     # Create/edit board game form
│   │   ├── BoardgamesPage.jsx    # Library — board games list
│   │   ├── GameForm.jsx          # Create/edit game session form
│   │   ├── HomePage.jsx          # Home page
│   │   ├── LoginPage.jsx         # Login and registration modal
│   │   ├── ProfilePage.jsx       # User profile (+ admin panel)
│   │   ├── SessionDetail.jsx     # Full session detail
│   │   ├── SessionForm.jsx       # Create/edit session form
│   │   ├── SessionsPage.jsx      # Sessions list
│   │   ├── TypeDetail.jsx        # Game type detail
│   │   ├── TypeForm.jsx          # Create/edit game type form
│   │   └── TypesPage.jsx         # Game types list
│   ├── App.jsx                   # Main router and routes
│   ├── index.css                 # Global styles
│   └── main.jsx                  # Entry point
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

---

## Pages and Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Home page | Public / Authenticated |
| `/boardgames` | Library | Authenticated |
| `/boardgames/new` | Create board game | admin, junta |
| `/boardgames/:id` | Board game detail | Authenticated |
| `/boardgames/:id/edit` | Edit board game | admin, junta |
| `/types` | Game types | Authenticated |
| `/types/new` | Create type | admin, junta |
| `/types/:id` | Type detail | Authenticated |
| `/types/:id/edit` | Edit type | admin, junta |
| `/sessions` | Sessions | Authenticated |
| `/sessions/new` | Create session | admin, junta |
| `/sessions/:id` | Session detail | Authenticated |
| `/sessions/:id/edit` | Edit session | admin, junta |
| `/sessions/:sessionId/games/new` | Create game | All except guest |
| `/games/:id/edit` | Edit game | Host, admin, junta |
| `/profile` | User profile | Authenticated |

Private routes redirect to `/` if the user is not logged in.

---

## User Roles

The `type` field in the `users` table defines the role:

| Role | Label | Color | Permissions |
|------|-------|-------|-------------|
| `admin` | Admin | Red | Full access. Can edit any user and manage all content |
| `junta` | Board | Amber | Same as admin except deleting types |
| `partner` | Member | Green | Can create games, view stats, edit own profile |
| `guest` | Guest | Blue | Read only. Can join sessions and games |

New users always register as `guest`. An administrator can change the type from the Profile page.

---

## Business Rules

### Sessions and Games

- **Joining a game without being in the session** → the system automatically tries to add you to the session. If the session is full, an error message is shown.
- **Leaving a session with active games** → not allowed if the user is signed up for any game in `open` or `limited` status. The button is disabled with an explanatory message.
- **Locked games** → if a game is in `playing` or `finished` status, no one can join or leave.
- **Creating games** → available for all roles except `guest`.

### Game Players

- The host or an admin/junta member can remove any player, including the host themselves, as long as the game is not in `playing` or `finished` status.

### Temporary Messages

Confirmation/error messages in the session detail page (joining, leaving sessions and games) are shown for 5 seconds and then disappear automatically.

### Board Game Ownership

- `owner_user_id = null` → the game belongs to the club (**ZAS**).
- `owner_user_id = id` → the game belongs to that user (their nickname is displayed).

---

## API Endpoints Used

Base URL configured in `VITE_API_URL` (default: `http://localhost:8000/api/v1`).

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/login` | Log in |
| POST | `/register` | Register new user |
| POST | `/logout` | Log out |

### Users
| Method | Route | Roles |
|--------|-------|-------|
| GET | `/users` | admin, junta |
| GET | `/users/:id` | admin, junta |
| PUT | `/users/:id` | Own user (limited fields) / admin (all fields) |

### Board Games
| Method | Route | Roles |
|--------|-------|-------|
| GET | `/boardgames` | Authenticated |
| GET | `/boardgames/:id` | Authenticated |
| POST | `/boardgames` | admin, junta |
| PUT | `/boardgames/:id` | admin, junta |
| DELETE | `/boardgames/:id` | admin, junta |

### Types
| Method | Route | Roles |
|--------|-------|-------|
| GET | `/types` | admin, junta, partner |
| GET | `/types/:id` | admin, junta, partner |
| POST | `/types` | admin, junta |
| PUT | `/types/:id` | admin, junta |
| DELETE | `/types/:id` | admin |

### Sessions
| Method | Route | Roles |
|--------|-------|-------|
| GET | `/zassessions` | Authenticated |
| GET | `/zassessions/:id` | Authenticated |
| POST | `/zassessions` | admin, junta |
| PUT | `/zassessions/:id` | admin, junta |
| DELETE | `/zassessions/:id` | admin, junta |
| POST | `/zassessions/:id/join` | Authenticated |
| DELETE | `/zassessions/:id/leave` | Authenticated |
| GET | `/zassessions/:id/users` | Authenticated |
| GET | `/zassessions/:id/games` | Authenticated |

### Games
| Method | Route | Roles |
|--------|-------|-------|
| GET | `/games/:id` | Authenticated |
| GET | `/games/:id/users` | Authenticated |
| POST | `/games` | All except guest |
| PUT | `/games/:id` | Host, admin, junta |
| DELETE | `/games/:id` | admin, junta |
| POST | `/games/:id/join` | Authenticated |
| DELETE | `/games/:id/leave` | Authenticated |

---

## Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| React Router DOM | 6.26 | Client-side routing |
| Vite | 5.4 | Bundler and development server |
| Custom CSS | — | No external CSS frameworks |
| Google Fonts | — | Cinzel (headings) + Raleway (body) |

No Tailwind or third-party component libraries are used. All styles are in `src/index.css`.

---

## Backend Notes

The following adjustments are required in the Laravel backend for the frontend to work correctly:

### `Boardgame` Model
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

### `Type` Model
```php
public function boardgames()
{
    return $this->belongsToMany(
        Boardgame::class, 'boardgame_type', 'type_id', 'boardgame_id'
    )->withTimestamps();
}
```

### `BoardgameController`
- `index()` and `detail()`: use `with(['types', 'owner'])` for eager loading.
- `store()` and `update()`: call `$boardgame->types()->sync($request->input('types', []))` after creating/updating.
- Validation rules in `update()`: include `'owner_user_id' => 'sometimes|nullable|integer|exists:users,id'` and `'types' => 'nullable|array'`.

### CORS
Make sure the backend allows requests from `http://localhost:5173` (or the production domain) in `config/cors.php`.

### Authentication
The frontend uses **Passport** (Bearer token). The token is stored in `localStorage` under the key `zas_token`.

---

## Test Users

Four users have been created for testing purposes, one for each role.

| Email | Password | Role |
|-------|----------|------|
| test@example.com | password | admin |
| test2@example.com | password2 | junta |
| test3@example.com | password3 | partner |
| test4@example.com | password4 | guest |

> ⚠️ These users are for development environments only. Do not use these credentials in production.

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid key supplied` | Passport OAuth keys not generated | Run `php artisan passport:keys` |
| `401 Unauthorized` | Expired or invalid token | Log out and log back in |
| `422 Unprocessable Content` on PUT boardgame | `owner_user_id` validation rule missing `nullable` | Add `nullable` to the rule in `BoardgameController` |
| Types not showing on board games | Missing `with('types')` in the controller | See Backend Notes section |
| CORS blocked | Backend does not allow the frontend origin | Add `localhost:5173` to `config/cors.php` |
