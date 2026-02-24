from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from api.config import settings
from api.dependencies import AuthReadUser, CurrentUser, PERM_AUTH_WRITE, limiter
from api.schemas.auth import MeResponse, ProfileUpdate, Token
from api.schemas.password_reset import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from api.services.auth_service import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from api.services.email_service import send_password_reset_email
from api.services.permission_service import has_permission, resolve_permissions
from api.services.role_service import (
    get_created_at,
    get_role_by_email,
    get_role_by_username,
    update_last_login,
    update_own_profile,
    update_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    """
    Login with username and password.
    Requires api://auth/x permission or operator status.
    Returns a JWT access token.
    """
    role = await get_role_by_username(form_data.username)

    if not role or not verify_password(form_data.password, role.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Roles without email are pure permission containers - cannot login
    if not role.email:
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

    # Check for auth write permission (operators always have access)
    if not role.operator:
        permissions, _ = await resolve_permissions(role)
        if not has_permission(permissions, PERM_AUTH_WRITE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Requires api://auth/x permission.",
            )

    # Update last login
    await update_last_login(role.role_id)

    # Create token
    access_token = create_access_token(str(role.role_id), role.username)

    return Token(access_token=access_token)


@router.get("/me", response_model=MeResponse)
async def get_me(auth_user: AuthReadUser):
    """
    Get current user info including resolved permissions and creation timestamp.
    Requires api://auth permission.
    """
    permissions, _ = await resolve_permissions(auth_user)
    created_at = await get_created_at(auth_user.role_id)

    return MeResponse(
        role_id=str(auth_user.role_id),
        username=auth_user.username,
        realname=auth_user.realname,
        email=auth_user.email,
        operator=auth_user.operator,
        active=auth_user.active,
        permissions=sorted(list(permissions)),
        created_at=created_at,
        last_login=auth_user.last_login,
    )


@router.patch("/me", response_model=MeResponse)
async def update_me(data: ProfileUpdate, current_user: CurrentUser):
    """
    Update own profile (realname, email, password only).
    Any authenticated user can update their own profile.
    """
    updated = await update_own_profile(
        role_id=current_user.role_id,
        realname=data.realname,
        email=data.email,
        password=data.password,
    )

    permissions, _ = await resolve_permissions(updated)
    created_at = await get_created_at(updated.role_id)

    return MeResponse(
        role_id=str(updated.role_id),
        username=updated.username,
        realname=updated.realname,
        email=updated.email,
        operator=updated.operator,
        active=updated.active,
        permissions=sorted(list(permissions)),
        created_at=created_at,
        last_login=updated.last_login,
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit("3/minute")
async def forgot_password(request: Request, data: ForgotPasswordRequest):
    """
    Request a password reset email.
    Always returns success to prevent user enumeration.
    """
    role = await get_role_by_email(data.email)

    if role and role.active:
        # Generate reset token and send email
        token = create_password_reset_token(data.email)
        reset_link = f"{settings.frontend_url}/reset-password?token={token}"
        await send_password_reset_email(data.email, reset_link)

    # Always return success to prevent email enumeration
    return ForgotPasswordResponse()


@router.post("/reset-password", response_model=ResetPasswordResponse)
@limiter.limit("5/minute")
async def reset_password(request: Request, data: ResetPasswordRequest):
    """
    Reset password using a valid reset token.
    """
    email = decode_password_reset_token(data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    role = await get_role_by_email(email)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if not role.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Update password in-place
    new_password_hash = hash_password(data.new_password)
    await update_password(role.role_id, new_password_hash)

    return ResetPasswordResponse()
