from typing import Optional

from beanie import PydanticObjectId

from api.models.role import Role
from api.services.role_service import get_current_version


def parse_permissions(permissions_str: str) -> set[str]:
    """Parse multi-line permission string into a set of permissions."""
    if not permissions_str:
        return set()
    return {
        line.strip()
        for line in permissions_str.strip().split("\n")
        if line.strip()
    }


def permission_matches(granted: str, requested: str) -> bool:
    """
    Check if a granted permission covers the requested permission.
    Supports * wildcard at the end of paths.
    Write permission (/x) also grants read permission (base path).

    Examples:
    - "app://my-app/*" matches "app://my-app/admin" -> True
    - "app://my-app/admin" matches "app://my-app/admin" -> True
    - "app://my-app/admin" matches "app://my-app/*" -> False
    - "*://*/*" matches anything -> True
    - "api://auth/x" matches "api://auth" -> True (write implies read)
    - "api://auth" matches "api://auth/x" -> False (read doesn't imply write)
    """
    if granted == requested:
        return True

    # Handle full wildcard
    if granted == "*://*/*":
        return True

    if granted.endswith("/*"):
        prefix = granted[:-1]  # "app://my-app/"
        return requested.startswith(prefix)

    # Write permission (/x) also grants read permission (base path)
    if granted.endswith("/x"):
        base = granted[:-2]  # Remove "/x"
        if requested == base:
            return True

    return False


def has_permission(granted_permissions: set[str], requested: str) -> bool:
    """Check if any granted permission covers the requested permission."""
    return any(
        permission_matches(granted, requested) for granted in granted_permissions
    )


async def resolve_permissions(
    role: Role,
    visited: Optional[set[PydanticObjectId]] = None,
    contributors: Optional[list[PydanticObjectId]] = None,
) -> tuple[set[str], list[PydanticObjectId]]:
    """
    Resolve all permissions for a role including inherited ones.
    Uses visited set to prevent circular reference infinite loops.
    Only active roles contribute permissions.

    Returns:
        tuple: (set of permissions, list of role_ids that contributed)
    """
    if visited is None:
        visited = set()
    if contributors is None:
        contributors = []

    # Prevent cycles and skip inactive roles
    if role.role_id in visited or not role.active:
        return set(), contributors

    visited.add(role.role_id)

    # Start with own permissions
    permissions = parse_permissions(role.permissions)
    if permissions:
        contributors.append(role.role_id)

    # Add parent permissions (additive)
    for parent_id in role.roles:
        parent = await get_current_version(parent_id)
        if parent:
            parent_perms, _ = await resolve_permissions(parent, visited, contributors)
            permissions |= parent_perms

    return permissions, contributors


async def get_resolved_permissions_for_role(role_id: PydanticObjectId) -> tuple[set[str], list[PydanticObjectId]]:
    """Get resolved permissions for a role by role_id."""
    role = await get_current_version(role_id)
    if not role:
        return set(), []
    return await resolve_permissions(role)
