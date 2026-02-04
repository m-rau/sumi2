# FastAPI Roles & Authentication System - Implementation Plan

## Overview

Build a FastAPI application for role-based authentication with hierarchical permission inheritance.

---

## Core Concepts

### Role Properties
- `username`, `realname`, `email` - identity fields
- `operator` (admin) - grants all permissions when true
- `active` - only active roles can login and inherit permissions
- `permissions` - multi-line text, one permission URI per line
- `password_hash`, `created_at`, `updated_at`, `last_login` - system fields

### Permission Format
```
job://container/endpoint       # Exact match
job://container/*              # Wildcard: single segment
job://**                       # Globstar: any depth
app://my-app/admin
role://roles/read
```

### Inheritance Model
- Roles have parent roles (many-to-many self-referential)
- Active roles inherit permissions from active parents
- Cycle detection: visit each node only once (depth-first traversal)
- Permissions are additive (union of all inherited permissions)

---

## Project Structure

```
sumi2/
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI entry point
│   ├── config.py                 # Settings (pydantic-settings)
│   ├── api/
│   │   ├── deps.py               # get_current_user, require_permission
│   │   ├── v1/
│   │   │   ├── router.py         # API router
│   │   │   ├── auth.py           # Login/logout endpoints
│   │   │   └── roles.py          # Role CRUD endpoints
│   │   └── web/
│   │       ├── router.py         # Web UI routes
│   │       ├── auth.py           # Login/logout pages
│   │       └── roles.py          # Role management pages
│   ├── core/
│   │   ├── security.py           # Password hashing, JWT
│   │   └── permissions.py        # Permission resolution
│   ├── db/
│   │   ├── session.py            # SQLAlchemy setup
│   │   └── models/
│   │       └── role.py           # Role model
│   ├── schemas/
│   │   ├── auth.py               # Login/token schemas
│   │   └── role.py               # Role CRUD schemas
│   ├── services/
│   │   ├── auth.py               # Auth business logic
│   │   └── role.py               # Role CRUD logic
│   ├── templates/                # Jinja2 templates
│   └── static/                   # CSS/JS
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_roles.py
│   └── test_permissions.py
├── pyproject.toml
└── .env.example
```

---

## Database Schema

### roles table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, autoincrement |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| realname | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| operator | BOOLEAN | DEFAULT FALSE |
| active | BOOLEAN | DEFAULT TRUE |
| permissions | TEXT | nullable |
| created_at | DATETIME | DEFAULT now |
| updated_at | DATETIME | DEFAULT now |
| last_login | DATETIME | nullable |

### role_parents table (many-to-many)
| Column | Type | Constraints |
|--------|------|-------------|
| role_id | INTEGER | PK, FK -> roles.id |
| parent_role_id | INTEGER | PK, FK -> roles.id |

---

## API Endpoints

### Authentication `/api/v1/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Authenticate, return JWT |
| POST | `/logout` | Invalidate token |
| GET | `/me` | Current user info |
| POST | `/refresh` | Refresh JWT |

### Roles `/api/v1/roles`
| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | `role://roles/read` |
| POST | `/` | `role://roles/create` |
| GET | `/{id}` | `role://roles/read` |
| PUT | `/{id}` | `role://roles/update` |
| DELETE | `/{id}` | `role://roles/delete` |
| GET | `/{id}/permissions` | `role://roles/read` |
| PUT | `/{id}/parents` | `role://roles/update` |

### Web UI `/`
| Path | Description |
|------|-------------|
| `/` | Welcome/dashboard |
| `/login` | Login form |
| `/logout` | Logout action |
| `/roles` | Role list |
| `/roles/new` | Create role form |
| `/roles/{id}` | Role detail |
| `/roles/{id}/edit` | Edit role form |

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create project structure
- [ ] Set up `pyproject.toml` with dependencies
- [ ] Create `app/config.py` with settings
- [ ] Create `app/db/session.py` (SQLAlchemy engine, Base)
- [ ] Create `app/db/models/role.py` (Role model with self-referential relationship)

### Phase 2: Core Security
- [ ] Implement `app/core/security.py` (password hashing, JWT)
- [ ] Implement `app/core/permissions.py` (parsing, matching, inheritance)
- [ ] Write tests for permission resolution and cycle detection

### Phase 3: Authentication
- [ ] Create `app/schemas/auth.py`
- [ ] Create `app/services/auth.py`
- [ ] Implement `app/api/deps.py` (get_current_user, require_permission)
- [ ] Implement `app/api/v1/auth.py` endpoints
- [ ] Write auth tests

### Phase 4: Role CRUD
- [ ] Create `app/schemas/role.py`
- [ ] Create `app/services/role.py`
- [ ] Implement `app/api/v1/roles.py` endpoints
- [ ] Write role CRUD tests

### Phase 5: Web UI
- [ ] Set up Jinja2 templates
- [ ] Create base template with navigation
- [ ] Implement login page
- [ ] Implement welcome/dashboard page
- [ ] Implement role management pages

### Phase 6: Polish
- [ ] Create initial admin user on startup
- [ ] Add proper error handling
- [ ] Review security (input validation, CORS)

---

## Key Dependencies

```toml
[project]
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy>=2.0.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "jinja2>=3.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.26.0",
]
```

---

## Critical Files

1. **`app/core/permissions.py`** - Permission resolution with graph traversal
2. **`app/db/models/role.py`** - Role model with hierarchy relationship
3. **`app/core/security.py`** - Password hashing and JWT handling
4. **`app/api/deps.py`** - Authentication/authorization dependencies
5. **`app/services/role.py`** - Role CRUD with parent management

---

## Verification

1. **Unit tests**: `pytest tests/test_permissions.py` - permission matching and inheritance
2. **API tests**: `pytest tests/test_auth.py tests/test_roles.py`
3. **Manual testing**:
   - Start server: `uvicorn app.main:app --reload`
   - API docs: http://localhost:8000/api/docs
   - Web UI: http://localhost:8000/
   - Login with initial admin user
   - Create roles with parent relationships
   - Verify permission inheritance works
