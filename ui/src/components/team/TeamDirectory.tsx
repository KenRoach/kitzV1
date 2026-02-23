import { Users } from 'lucide-react'

export function TeamDirectory() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
      <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
      <h3 className="text-lg font-bold text-black">Team</h3>
      <p className="mt-1 text-sm text-gray-500">
        Manage your team members and roles.
      </p>
      <p className="mt-1 font-mono text-xs text-gray-400">
        Invite collaborators, set permissions, assign agents.
      </p>
    </div>
  )
}
