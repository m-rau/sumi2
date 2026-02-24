import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRoles, useDeleteRole } from '@/hooks/useRoles'
import {
  LcarsPanel,
  LcarsButton,
  LcarsInput,
  LcarsBadge,
  LcarsConfirmDialog,
  LcarsLoadingScreen,
  useToast,
} from '@/components/lcars'
import { formatRelativeTime } from '@/lib/utils'
import type { RoleResponse } from '@/types/api'

export function RolesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const limit = 10

  const { data, isLoading } = useRoles({
    offset: page * limit,
    limit,
    search: searchQuery || undefined,
  })

  const deleteMutation = useDeleteRole()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setSearchQuery(searchInput)
    // Restore focus after search
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await deleteMutation.mutateAsync(deleteTarget.role_id)
      toast.success(`Role "${deleteTarget.username}" deleted`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    }
  }

  if (isLoading) {
    return <LcarsLoadingScreen message="Loading Roles..." />
  }

  const totalPages = Math.ceil((data?.total ?? 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lcars-orange tracking-wider mb-2">
            ROLE MANAGEMENT
          </h1>
          <p className="text-text-muted">
            {data?.total ?? 0} total roles in system
          </p>
        </div>
        {user?.operator && (
          <LcarsButton onClick={() => navigate('/roles/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Role
          </LcarsButton>
        )}
      </div>

      {/* Search */}
      <LcarsPanel corner="top-left" headerColor="lavender" header="Search">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <LcarsInput
              ref={searchInputRef}
              placeholder="Search by username, name, email, active, operator..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <LcarsButton type="submit" variant="secondary">
            <Search className="w-4 h-4 mr-2" />
            Search
          </LcarsButton>
        </form>
      </LcarsPanel>

      {/* Roles Table */}
      <LcarsPanel corner="top-right">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-lcars-orange">
                <th className="text-left py-3 px-4 text-lcars-orange uppercase tracking-wider text-sm">
                  Username
                </th>
                <th className="text-left py-3 px-4 text-lcars-orange uppercase tracking-wider text-sm">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-lcars-orange uppercase tracking-wider text-sm">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-lcars-orange uppercase tracking-wider text-sm">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-lcars-orange uppercase tracking-wider text-sm">
                  Last Login
                </th>
                <th className="text-right py-3 px-4 text-lcars-orange uppercase tracking-wider text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((role) => (
                <tr
                  key={role.role_id}
                  className="border-b border-surface-panel hover:bg-surface-panel transition-colors"
                >
                  <td className="py-4 px-4">
                    <Link
                      to={`/roles/${role.username}`}
                      className="text-lcars-sky hover:text-lcars-orange transition-colors font-medium"
                    >
                      {role.username}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-text-light">{role.realname}</td>
                  <td className="py-4 px-4 text-text-muted">{role.email}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <LcarsBadge variant={role.active ? 'success' : 'danger'}>
                        {role.active ? 'Active' : 'Inactive'}
                      </LcarsBadge>
                      {role.operator && (
                        <LcarsBadge variant="operator">Op</LcarsBadge>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-text-muted">
                    {formatRelativeTime(role.last_login)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/roles/${role.username}`}
                        className="p-2 text-lcars-sky hover:text-lcars-orange hover:bg-surface-panel rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {user?.operator && (
                        <>
                          <Link
                            to={`/roles/${role.username}/edit`}
                            className="p-2 text-lcars-gold hover:text-lcars-orange hover:bg-surface-panel rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(role)}
                            className="p-2 text-lcars-salmon hover:text-red-400 hover:bg-surface-panel rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-surface-panel">
            <p className="text-text-muted text-sm">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, data?.total ?? 0)} of {data?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <LcarsButton
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </LcarsButton>
              <span className="px-4 text-lcars-orange font-medium">
                {page + 1} / {totalPages}
              </span>
              <LcarsButton
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={!data?.has_more}
              >
                <ChevronRight className="w-4 h-4" />
              </LcarsButton>
            </div>
          </div>
        )}
      </LcarsPanel>

      {/* Delete Confirmation */}
      <LcarsConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deleteTarget?.username}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
