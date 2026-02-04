from typing import Annotated

from bson import ObjectId
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter
from slowapi.util import get_remote_address

from api.models.role import Role
from api.services.auth_service import decode_access_token
from api.services.role_service import get_current_version

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


# Type aliases for cleaner route signatures
CurrentUser = Annotated[Role, Depends(get_current_user)]
CurrentOperator = Annotated[Role, Depends(get_current_operator)]
