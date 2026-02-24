from typing import Optional

from beanie import PydanticObjectId
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse

from api.dependencies import CurrentOperator, RolesReadUser, RolesWriteUser
from api.models.role import Role
from api.schemas.role import (
    PaginatedRolesResponse,
    ResolvedPermissions,
    RoleCreate,
    RoleHistoryResponse,
    RolePatch,
    RoleResponse,
    RoleUpdate,
)
from api.services.permission_service import get_resolved_permissions_for_role
from api.services.role_service import (
    ConcurrentModificationError,
    create_role,
    delete_role,
    get_all_current_roles,
    get_created_at,
    get_current_version,
    get_role_history,
    patch_role,
    resolve_role_identifier,
    resolve_role_ids_to_usernames,
    rollback_role,
    update_role,
)

router = APIRouter(prefix="/roles", tags=["roles"])


def validate_version_id(value: str) -> PydanticObjectId:
    """Validate and convert version_id string to PydanticObjectId."""
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid version_id format",
        )
    return PydanticObjectId(value)


async def resolve_role_or_404(identifier: str) -> Role:
    """Resolve a role identifier (role_id or username) or raise 404."""
    role = await resolve_role_identifier(identifier)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


async def build_role_response(role: Role, created_at: Optional[str] = None) -> RoleResponse:
    """Build a RoleResponse with usernames resolved for the roles field."""
    roles_as_usernames = await resolve_role_ids_to_usernames(role.roles)
    if created_at is None:
        created_at = await get_created_at(role.role_id)
    return RoleResponse.from_role(role, created_at=created_at, roles_as_usernames=roles_as_usernames)


@router.get("", response_model=PaginatedRolesResponse)
async def list_roles(
    read_user: RolesReadUser,
    offset: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Max records to return"),
    search: Optional[str] = Query(default=None, description="Search in username, realname, email, active/-, operator/-"),
):
    """
    List all current roles with pagination and search.
    Requires operator or api://auth/r permission.

    Search examples:
    - `michael` - matches users with "michael" in name/email
    - `active` - matches all active users
    - `operator` - matches all operators
    - `- -` - matches inactive non-operators
    """
    roles, total = await get_all_current_roles(offset=offset, limit=limit, search=search)

    items = []
    for role in roles:
        items.append(await build_role_response(role))

    return PaginatedRolesResponse(
        items=items,
        total=total,
        offset=offset,
        limit=limit,
        has_more=offset + len(items) < total,
    )


@router.get("/{identifier}", response_model=RoleResponse)
async def get_role(identifier: str, read_user: RolesReadUser):
    """Get current version of a role by role_id or username. Requires operator or api://auth/r permission."""
    role = await resolve_role_or_404(identifier)
    return await build_role_response(role)


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_new_role(data: RoleCreate, write_user: RolesWriteUser):
    """Create a new role. Requires operator or api://auth/w permission."""
    role = await create_role(data, actor_role_id=write_user.role_id)
    return await build_role_response(role, created_at=role.modified_at)


@router.put("/{identifier}/{version_id}", response_model=RoleResponse)
async def update_existing_role(
    identifier: str,
    version_id: str,
    data: RoleUpdate,
    write_user: RolesWriteUser,
):
    """
    Full update of a role with optimistic locking.

    The identifier can be role_id or username.
    The version_id must match the current version's _id.
    Returns 409 Conflict if the role was modified by another user.
    Requires operator or api://auth/w permission.
    """
    role = await resolve_role_or_404(identifier)
    vid = validate_version_id(version_id)

    try:
        updated_role = await update_role(role.role_id, vid, data, actor_role_id=write_user.role_id)
    except ConcurrentModificationError as e:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "detail": "Role was modified by another user. Please refresh and try again.",
                "error_code": "CONCURRENT_MODIFICATION",
                "current_version_id": e.current_version_id,
            },
        )

    return await build_role_response(updated_role)


@router.patch("/{identifier}/{version_id}", response_model=RoleResponse)
async def patch_existing_role(
    identifier: str,
    version_id: str,
    data: RolePatch,
    write_user: RolesWriteUser,
):
    """
    Partial update of a role with optimistic locking.

    The identifier can be role_id or username.
    The version_id must match the current version's _id.
    Returns 409 Conflict if the role was modified by another user.
    Requires operator or api://auth/w permission.
    """
    role = await resolve_role_or_404(identifier)
    vid = validate_version_id(version_id)

    try:
        updated_role = await patch_role(role.role_id, vid, data, actor_role_id=write_user.role_id)
    except ConcurrentModificationError as e:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "detail": "Role was modified by another user. Please refresh and try again.",
                "error_code": "CONCURRENT_MODIFICATION",
                "current_version_id": e.current_version_id,
            },
        )

    return await build_role_response(updated_role)


@router.delete("/{identifier}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_role(identifier: str, write_user: RolesWriteUser):
    """Delete all versions of a role. Requires operator or api://auth/w permission. Identifier can be role_id or username."""
    role = await resolve_role_or_404(identifier)
    await delete_role(role.role_id)


@router.get("/{identifier}/permissions", response_model=ResolvedPermissions)
async def get_role_permissions(identifier: str, read_user: RolesReadUser):
    """Get resolved permissions for a role (including inherited). Requires operator or api://auth/r permission. Identifier can be role_id or username."""
    role = await resolve_role_or_404(identifier)

    permissions, contributors = await get_resolved_permissions_for_role(role.role_id)

    # Resolve contributor role_ids to usernames (excluding self)
    contributor_ids = [c for c in contributors if c != role.role_id]
    contributor_usernames = await resolve_role_ids_to_usernames(contributor_ids)

    return ResolvedPermissions(
        role_id=str(role.role_id),
        username=role.username,
        permissions=sorted(list(permissions)),
        inherited_from=contributor_usernames,
    )


@router.get("/{identifier}/history", response_model=RoleHistoryResponse)
async def get_role_history_endpoint(identifier: str, current_operator: CurrentOperator):
    """Get all versions of a role (newest first). Requires operator privileges. Identifier can be role_id or username."""
    role = await resolve_role_or_404(identifier)

    history = await get_role_history(role.role_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    # Get created_at from the oldest version
    created_at = history[-1].modified_at if history else None

    # Build responses with usernames resolved
    versions = []
    for r in history:
        roles_as_usernames = await resolve_role_ids_to_usernames(r.roles)
        versions.append(RoleResponse.from_role(r, created_at=created_at, roles_as_usernames=roles_as_usernames))

    return RoleHistoryResponse(
        versions=versions,
        total=len(history),
    )


@router.post("/{identifier}/{version_id}/rollback", response_model=RoleResponse)
async def rollback_role_endpoint(
    identifier: str,
    version_id: str,
    current_operator: CurrentOperator,
):
    """
    Rollback to the previous version with optimistic locking.

    The identifier can be role_id or username.
    The version_id must match the current version's _id.
    Returns 409 Conflict if the role was modified by another user.
    """
    role = await resolve_role_or_404(identifier)
    vid = validate_version_id(version_id)

    try:
        restored_role = await rollback_role(role.role_id, vid)
    except ConcurrentModificationError as e:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "detail": "Role was modified by another user. Please refresh and try again.",
                "error_code": "CONCURRENT_MODIFICATION",
                "current_version_id": e.current_version_id,
            },
        )

    return await build_role_response(restored_role)
