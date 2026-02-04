from datetime import datetime
from typing import Annotated, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class Role(Document):
    """
    Historized role document with optimistic locking.

    Each update creates a new document with the same role_id.
    The current version is marked with current=True.
    """

    role_id: Annotated[PydanticObjectId, Indexed()] = Field(
        description="Stable role identifier"
    )
    current: Annotated[bool, Indexed()] = Field(
        default=True, description="True = current version, False = history"
    )
    username: Annotated[str, Indexed()] = Field(
        description="Unique among current versions"
    )
    realname: str
    email: Annotated[str, Indexed()] = Field(
        description="Unique among current versions"
    )
    password_hash: str
    operator: bool = Field(default=False, description="Admin flag")
    active: bool = Field(default=True)
    permissions: str = Field(default="", description="Multi-line permission string")
    roles: list[PydanticObjectId] = Field(
        default_factory=list, description="Parent role references (by role_id)"
    )
    last_login: Optional[datetime] = None
    modified_by: Optional[PydanticObjectId] = Field(
        default=None, description="role_id of who made this change"
    )
    modified_at: datetime = Field(
        default_factory=datetime.utcnow, description="When this version was created"
    )
    search_text: Annotated[str, Indexed()] = Field(
        default="", description="Computed field for searching (username realname email active/- operator/-)"
    )

    class Settings:
        name = "roles"
