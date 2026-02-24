from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, field_validator


class PyObjectId(str):
    """Custom type for ObjectId serialization."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return v
            raise ValueError("Invalid ObjectId format")
        raise ValueError("ObjectId required")


class RoleCreate(BaseModel):
    """Schema for creating a new role."""

    username: str = Field(min_length=1, max_length=100)
    realname: str = Field(min_length=1, max_length=200)
    email: Optional[EmailStr] = Field(default=None, description="None = pure role (cannot login)")
    password: Optional[str] = Field(default=None, min_length=8, description="Required if email is set")
    operator: bool = False
    active: bool = True
    permissions: str = ""
    roles: list[str] = Field(default_factory=list, description="Parent role usernames")

    @field_validator("roles", mode="before")
    @classmethod
    def validate_roles(cls, v):
        if v is None:
            return []
        return v


class RoleUpdate(BaseModel):
    """Schema for full role update."""

    username: str = Field(min_length=1, max_length=100)
    realname: str = Field(min_length=1, max_length=200)
    email: Optional[EmailStr] = Field(default=None, description="None = pure role (cannot login)")
    password: Optional[str] = Field(
        default=None, min_length=8, description="Leave empty to keep existing"
    )
    operator: bool
    active: bool
    permissions: str
    roles: list[str] = Field(default_factory=list, description="Parent role usernames")

    @field_validator("roles", mode="before")
    @classmethod
    def validate_roles(cls, v):
        if v is None:
            return []
        return v


class RolePatch(BaseModel):
    """Schema for partial role update."""

    username: Optional[str] = Field(default=None, min_length=1, max_length=100)
    realname: Optional[str] = Field(default=None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8)
    operator: Optional[bool] = None
    active: Optional[bool] = None
    permissions: Optional[str] = None
    roles: Optional[list[str]] = Field(default=None, description="Parent role usernames")


class RoleResponse(BaseModel):
    """Schema for role response."""

    version_id: str = Field(description="Version ID (_id) - use this for updates")
    role_id: str
    username: str
    realname: str
    email: Optional[str] = Field(default=None, description="None = pure role (cannot login)")
    operator: bool
    active: bool
    permissions: str
    roles: list[str] = Field(description="Parent role usernames")
    last_login: Optional[datetime]
    modified_by: Optional[str]
    modified_at: datetime
    created_at: Optional[datetime] = Field(
        default=None, description="From first version"
    )

    @classmethod
    def from_role(
        cls,
        role,
        created_at: Optional[datetime] = None,
        roles_as_usernames: Optional[list[str]] = None,
    ) -> "RoleResponse":
        return cls(
            version_id=str(role.id),
            role_id=str(role.role_id),
            username=role.username,
            realname=role.realname,
            email=role.email,
            operator=role.operator,
            active=role.active,
            permissions=role.permissions,
            roles=roles_as_usernames if roles_as_usernames is not None else [],
            last_login=role.last_login,
            modified_by=str(role.modified_by) if role.modified_by else None,
            modified_at=role.modified_at,
            created_at=created_at,
        )


class PaginatedRolesResponse(BaseModel):
    """Schema for paginated role list."""

    items: list[RoleResponse]
    total: int = Field(description="Total matching records")
    offset: int = Field(description="Current offset")
    limit: int = Field(description="Applied limit")
    has_more: bool = Field(description="True if more records exist")


class RoleHistoryResponse(BaseModel):
    """Schema for role history list."""

    versions: list[RoleResponse]
    total: int


class ResolvedPermissions(BaseModel):
    """Schema for resolved permissions response."""

    role_id: str
    username: str
    permissions: list[str]
    inherited_from: list[str] = Field(
        default_factory=list, description="Usernames of roles that contributed permissions"
    )


class ConflictErrorResponse(BaseModel):
    """Schema for 409 Conflict response (optimistic locking failure)."""

    detail: str = "Role was modified by another user. Please refresh and try again."
    error_code: str = "CONCURRENT_MODIFICATION"
    current_version_id: str = Field(description="The current version_id to refresh to")
