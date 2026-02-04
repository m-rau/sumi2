from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from api.dependencies import CurrentUser, limiter
from api.schemas.auth import MeResponse, Token
from api.services.auth_service import create_access_token, verify_password
from api.services.permission_service import resolve_permissions
from api.services.role_service import get_created_at, get_role_by_username, update_last_login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    """
    Login with username and password.
    Returns a JWT access token.
    """
    role = await get_role_by_username(form_data.username)

    if not role or not verify_password(form_data.password, role.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not role.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Update last login
    await update_last_login(role.role_id)

    # Create token
    access_token = create_access_token(str(role.role_id), role.username)

    return Token(access_token=access_token)


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: CurrentUser):
    """
    Get current user info including resolved permissions and creation timestamp.
    """
    permissions, _ = await resolve_permissions(current_user)
    created_at = await get_created_at(current_user.role_id)

    return MeResponse(
        role_id=str(current_user.role_id),
        username=current_user.username,
        realname=current_user.realname,
        email=current_user.email,
        operator=current_user.operator,
        active=current_user.active,
        permissions=sorted(list(permissions)),
        created_at=created_at,
        last_login=current_user.last_login,
    )
