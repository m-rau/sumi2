from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId
from bson import ObjectId
from fastapi import HTTPException, status

from api.models.role import Role
from api.schemas.role import RoleCreate, RolePatch, RoleUpdate
from api.services.auth_service import hash_password


class ConcurrentModificationError(Exception):
    """Raised when optimistic locking fails due to concurrent modification."""

    def __init__(self, current_version_id: str):
        self.current_version_id = current_version_id
        super().__init__("Role was modified by another user")


def build_search_text(username: str, realname: str, email: str, active: bool, operator: bool) -> str:
    """Build searchable text from role fields."""
    parts = [
        username,
        realname,
        email,
        "active" if active else "-",
        "operator" if operator else "-",
    ]
    return " ".join(parts).lower()


async def get_current_version(role_id: PydanticObjectId) -> Optional[Role]:
    """Get the current version of a role by role_id."""
    return await Role.find_one({"role_id": role_id, "current": True})


async def get_all_current_roles(
    offset: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
) -> tuple[list[Role], int]:
    """
    Get all current role versions with optional search.
    Returns (roles, total_count).
    """
    query = {"current": True}

    if search:
        query["search_text"] = {"$regex": search.lower()}

    total = await Role.find(query).count()
    roles = await Role.find(query).skip(offset).limit(limit).to_list()

    return roles, total


async def get_created_at(role_id: PydanticObjectId) -> Optional[datetime]:
    """Get the creation timestamp (modified_at of first version)."""
    first_version = (
        await Role.find({"role_id": role_id}).sort([("_id", 1)]).first_or_none()
    )
    return first_version.modified_at if first_version else None


async def get_role_history(role_id: PydanticObjectId) -> list[Role]:
    """Get all versions of a role, newest first."""
    return await Role.find({"role_id": role_id}).sort([("_id", -1)]).to_list()


async def check_username_unique(username: str, exclude_role_id: Optional[PydanticObjectId] = None) -> bool:
    """Check if username is unique among current versions."""
    query = {"current": True, "username": username}
    if exclude_role_id:
        query["role_id"] = {"$ne": exclude_role_id}
    existing = await Role.find_one(query)
    return existing is None


async def check_email_unique(email: str, exclude_role_id: Optional[PydanticObjectId] = None) -> bool:
    """Check if email is unique among current versions."""
    query = {"current": True, "email": email}
    if exclude_role_id:
        query["role_id"] = {"$ne": exclude_role_id}
    existing = await Role.find_one(query)
    return existing is None


async def check_can_delete(role_id: PydanticObjectId) -> None:
    """Check if a role can be deleted (not a parent to any current role)."""
    dependent = await Role.find_one({"current": True, "roles": role_id})
    if dependent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: role '{dependent.username}' depends on this role",
        )


async def create_role(data: RoleCreate, actor_role_id: Optional[PydanticObjectId] = None) -> Role:
    """Create a new role."""
    # Check uniqueness
    if not await check_username_unique(data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{data.username}' already exists",
        )
    if not await check_email_unique(data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{data.email}' already exists",
        )

    # Resolve parent role usernames to role_ids
    parent_role_ids = await resolve_usernames_to_role_ids(data.roles)

    role = Role(
        role_id=PydanticObjectId(),
        current=True,
        username=data.username,
        realname=data.realname,
        email=data.email,
        password_hash=hash_password(data.password),
        operator=data.operator,
        active=data.active,
        permissions=data.permissions,
        roles=parent_role_ids,
        modified_by=actor_role_id,
        modified_at=datetime.utcnow(),
        search_text=build_search_text(
            data.username, data.realname, data.email, data.active, data.operator
        ),
    )
    await role.insert()
    return role


async def update_role(
    role_id: PydanticObjectId,
    version_id: PydanticObjectId,
    data: RoleUpdate,
    actor_role_id: Optional[PydanticObjectId] = None,
) -> Role:
    """
    Update a role with optimistic locking.
    version_id must match the current version's _id.
    """
    # Check uniqueness (exclude self)
    if not await check_username_unique(data.username, exclude_role_id=role_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{data.username}' already exists",
        )
    if not await check_email_unique(data.email, exclude_role_id=role_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{data.email}' already exists",
        )

    # Resolve parent role usernames to role_ids
    parent_role_ids = await resolve_usernames_to_role_ids(data.roles)

    # Step 1: Atomically mark the expected version as non-current
    result = await Role.get_pymongo_collection().update_one(
        {"role_id": role_id, "_id": version_id, "current": True},
        {"$set": {"current": False}},
    )

    if result.modified_count == 0:
        # Either role doesn't exist, or someone else updated it
        current = await get_current_version(role_id)
        if current:
            raise ConcurrentModificationError(str(current.id))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    # Get old version for preserving last_login and password
    old_version = await Role.get(version_id)

    # Determine password hash
    password_hash = (
        hash_password(data.password) if data.password else old_version.password_hash
    )

    # Step 2: Insert new version as current
    new_version = Role(
        role_id=role_id,
        current=True,
        username=data.username,
        realname=data.realname,
        email=data.email,
        password_hash=password_hash,
        operator=data.operator,
        active=data.active,
        permissions=data.permissions,
        roles=parent_role_ids,
        last_login=old_version.last_login,
        modified_by=actor_role_id,
        modified_at=datetime.utcnow(),
        search_text=build_search_text(
            data.username, data.realname, data.email, data.active, data.operator
        ),
    )
    await new_version.insert()
    return new_version


async def patch_role(
    role_id: PydanticObjectId,
    version_id: PydanticObjectId,
    data: RolePatch,
    actor_role_id: Optional[PydanticObjectId] = None,
) -> Role:
    """
    Partially update a role with optimistic locking.
    version_id must match the current version's _id.
    """
    # Get old version first to merge values
    old_version = await Role.get(version_id)
    if not old_version or old_version.role_id != role_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    # Build updated values
    username = data.username if data.username is not None else old_version.username
    email = data.email if data.email is not None else old_version.email
    realname = data.realname if data.realname is not None else old_version.realname
    operator = data.operator if data.operator is not None else old_version.operator
    active = data.active if data.active is not None else old_version.active
    permissions = data.permissions if data.permissions is not None else old_version.permissions

    # Resolve parent role usernames to role_ids if provided
    if data.roles is not None:
        parent_role_ids = await resolve_usernames_to_role_ids(data.roles)
    else:
        parent_role_ids = old_version.roles

    # Check uniqueness if changed
    if data.username is not None and data.username != old_version.username:
        if not await check_username_unique(username, exclude_role_id=role_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{username}' already exists",
            )
    if data.email is not None and data.email != old_version.email:
        if not await check_email_unique(email, exclude_role_id=role_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{email}' already exists",
            )

    # Step 1: Atomically mark the expected version as non-current
    result = await Role.get_pymongo_collection().update_one(
        {"role_id": role_id, "_id": version_id, "current": True},
        {"$set": {"current": False}},
    )

    if result.modified_count == 0:
        current = await get_current_version(role_id)
        if current:
            raise ConcurrentModificationError(str(current.id))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    password_hash = (
        hash_password(data.password) if data.password else old_version.password_hash
    )

    # Step 2: Insert new version as current
    new_version = Role(
        role_id=role_id,
        current=True,
        username=username,
        realname=realname,
        email=email,
        password_hash=password_hash,
        operator=operator,
        active=active,
        permissions=permissions,
        roles=parent_role_ids,
        last_login=old_version.last_login,
        modified_by=actor_role_id,
        modified_at=datetime.utcnow(),
        search_text=build_search_text(username, realname, email, active, operator),
    )
    await new_version.insert()
    return new_version


async def delete_role(role_id: PydanticObjectId) -> int:
    """Delete all versions of a role. Returns count of deleted documents."""
    await check_can_delete(role_id)
    result = await Role.find({"role_id": role_id}).delete()
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return result.deleted_count


async def rollback_role(role_id: PydanticObjectId, version_id: PydanticObjectId) -> Role:
    """
    Rollback to the previous version with optimistic locking.
    version_id must match the current version's _id.
    """
    # Check that we have a previous version
    history = await get_role_history(role_id)
    if len(history) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot rollback: no previous version exists",
        )

    current = history[0]
    previous = history[1]

    # Verify version_id matches current
    if current.id != version_id:
        raise ConcurrentModificationError(str(current.id))

    # Step 1: Atomically delete the current version
    result = await Role.get_pymongo_collection().delete_one(
        {"_id": version_id, "current": True}
    )

    if result.deleted_count == 0:
        current = await get_current_version(role_id)
        if current:
            raise ConcurrentModificationError(str(current.id))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    # Step 2: Mark the previous version as current
    await Role.get_pymongo_collection().update_one(
        {"_id": previous.id},
        {"$set": {"current": True}},
    )

    return await get_current_version(role_id)


async def update_last_login(role_id: PydanticObjectId) -> None:
    """Update last_login timestamp on the current version (in-place, not new version)."""
    await Role.get_pymongo_collection().update_one(
        {"role_id": role_id, "current": True},
        {"$set": {"last_login": datetime.utcnow()}},
    )


async def get_role_by_username(username: str) -> Optional[Role]:
    """Get current role by username (for login)."""
    return await Role.find_one({"current": True, "username": username})


async def resolve_role_identifier(identifier: str) -> Optional[Role]:
    """
    Resolve a role identifier (either role_id or username) to a Role.
    Returns None if not found.
    """
    # Check if it looks like an ObjectId (24 hex characters)
    if ObjectId.is_valid(identifier):
        role = await get_current_version(PydanticObjectId(identifier))
        if role:
            return role
    # Try as username
    return await get_role_by_username(identifier)


async def resolve_usernames_to_role_ids(usernames: list[str]) -> list[PydanticObjectId]:
    """
    Resolve a list of usernames to role_ids.
    Raises HTTPException if any username is not found.
    """
    role_ids = []
    for username in usernames:
        role = await get_role_by_username(username)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent role '{username}' not found",
            )
        role_ids.append(role.role_id)
    return role_ids


async def resolve_role_ids_to_usernames(role_ids: list[PydanticObjectId]) -> list[str]:
    """
    Resolve a list of role_ids to usernames.
    Raises HTTPException if any role_id is orphaned (deleted).
    """
    usernames = []
    for role_id in role_ids:
        role = await get_current_version(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent role '{role_id}' no longer exists",
            )
        usernames.append(role.username)
    return usernames
