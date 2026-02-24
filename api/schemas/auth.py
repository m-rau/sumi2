from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data extracted from JWT token."""

    role_id: str
    username: str


class MeResponse(BaseModel):
    """Response for /auth/me endpoint."""

    role_id: str
    username: str
    realname: str
    email: Optional[str]
    operator: bool
    active: bool
    permissions: list[str]
    created_at: Optional[datetime]
    last_login: Optional[datetime]


class ProfileUpdate(BaseModel):
    """Schema for updating own profile. All fields optional."""

    realname: Optional[str] = Field(default=None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8)
