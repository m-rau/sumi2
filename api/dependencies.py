from typing import Annotated

from bson import ObjectId
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter
from slowapi.util import get_remote_address

from api.models.role import Role
from api.services.auth_service import decode_access_token
from api.services.permission_service import has_permission, resolve_permissions
from api.services.role_service import get_current_version

# Permission constants
# /x suffix = write (POST/PUT/PATCH/DELETE), no suffix = read (GET)
PERM_AUTH_READ = "api://auth"
PERM_AUTH_WRITE = "api://auth/x"
PERM_ROLES_READ = "api://roles"
PERM_ROLES_WRITE = "api://roles/x"
PERM_HEALTH_READ = "api://health"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> Role:
    """Dependency to get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    role_id = payload.get("sub")
    if role_id is None:
        raise credentials_exception

    try:
        role = await get_current_version(ObjectId(role_id))
    except Exception:
        raise credentials_exception

    if role is None:
        raise credentials_exception

    if not role.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return role


async def get_current_operator(
    current_user: Annotated[Role, Depends(get_current_user)]
) -> Role:
    """Dependency to get the current user and verify they are an operator."""
    if not current_user.operator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator privileges required",
        )
    return current_user


async def get_auth_read_user(
    current_user: Annotated[Role, Depends(get_current_user)]
) -> Role:
    """Require operator or api://auth permission for GET on /auth/*."""
    if current_user.operator:
        return current_user

    permissions, _ = await resolve_permissions(current_user)
    if has_permission(permissions, PERM_AUTH_READ):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Requires api://auth permission.",
    )


async def get_roles_read_user(
    current_user: Annotated[Role, Depends(get_current_user)]
) -> Role:
    """Require operator or api://roles permission for GET on /roles/*."""
    if current_user.operator:
        return current_user

    permissions, _ = await resolve_permissions(current_user)
    if has_permission(permissions, PERM_ROLES_READ):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Requires api://roles permission.",
    )


async def get_roles_write_user(
    current_user: Annotated[Role, Depends(get_current_user)]
) -> Role:
    """Require operator or api://roles/x permission for POST/PUT/PATCH/DELETE on /roles/*."""
    if current_user.operator:
        return current_user

    permissions, _ = await resolve_permissions(current_user)
    if has_permission(permissions, PERM_ROLES_WRITE):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Requires api://roles/x permission.",
    )


async def get_health_user(
    current_user: Annotated[Role, Depends(get_current_user)]
) -> Role:
    """Require operator or api://health permission for GET on /health."""
    if current_user.operator:
        return current_user

    permissions, _ = await resolve_permissions(current_user)
    if has_permission(permissions, PERM_HEALTH_READ):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Requires api://health permission.",
    )


# Type aliases for cleaner route signatures
CurrentUser = Annotated[Role, Depends(get_current_user)]
CurrentOperator = Annotated[Role, Depends(get_current_operator)]
AuthReadUser = Annotated[Role, Depends(get_auth_read_user)]
RolesReadUser = Annotated[Role, Depends(get_roles_read_user)]
RolesWriteUser = Annotated[Role, Depends(get_roles_write_user)]
HealthUser = Annotated[Role, Depends(get_health_user)]
