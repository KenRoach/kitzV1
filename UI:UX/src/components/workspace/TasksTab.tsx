import { useEffect, useState } from 'react'
import { Plus, Square, CheckSquare } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function TasksTab() {
  const { tasks, isLoading, fetchTasks, addTask } = useWorkspaceStore()
  const [title, setTitle] = useState('')

  useEffect(() => { void fetchTasks() }, [fetchTasks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(title)
    setTitle('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">New Task</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            placeholder="What needs to get done?"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
        </div>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 transition">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {tasks.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">All clear! Add a task to get started.</p>
      )}

      <div className="space-y-1">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-gray-50">
            <button className="text-gray-400 hover:text-purple-500 transition">
              {task.done
                ? <CheckSquare className="h-5 w-5 text-purple-500" />
                : <Square className="h-5 w-5" />
              }
            </button>
            <span className={`flex-1 text-sm ${task.done ? 'text-gray-400 line-through' : 'text-black'}`}>
              {task.title}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
