import secrets
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from beanie import PydanticObjectId
from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.config import settings
from api.database import close_db, init_db
from api.dependencies import HealthUser, limiter
from api.models.role import Role
from api.routers import auth, roles
from api.services.auth_service import hash_password
from api.services.role_service import build_search_text


async def bootstrap_admin():
    """Create admin role if no roles exist."""
    # Check if any roles exist
    count = await Role.count()
    if count > 0:
        return

    # Generate password if not configured
    password = settings.admin_password
    if not password:
        password = secrets.token_urlsafe(16)
        print(f"\n{'='*60}", file=sys.stderr)
        print("ADMIN BOOTSTRAP", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        print(f"No roles found. Creating admin user.", file=sys.stderr)
        print(f"Username: admin", file=sys.stderr)
        print(f"Password: {password}", file=sys.stderr)
        print(f"{'='*60}\n", file=sys.stderr)

    admin = Role(
        role_id=PydanticObjectId(),
        current=True,
        username="admin",
        realname="Administrator",
        email=settings.admin_email,
        password_hash=hash_password(password),
        operator=True,
        active=True,
        permissions="*://*/*",  # Full access
        roles=[],
        modified_by=None,
        modified_at=datetime.utcnow(),
        search_text=build_search_text("admin", "Administrator", settings.admin_email, True, True),
    )
    await admin.insert()
    print(f"Admin user created successfully.", file=sys.stderr)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_db()
    await bootstrap_admin()

    yield

    # Shutdown
    await close_db()


app = FastAPI(
    title="Sumi2 Role Management API",
    description="Role-based access control API with hierarchical permissions",
    version="1.0.0",
    lifespan=lifespan,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include routers
app.include_router(auth.router)
app.include_router(roles.router)


@app.get("/health")
async def health_check(health_user: HealthUser):
    """Health check endpoint. Requires api://health permission."""
    return {"status": "healthy"}
