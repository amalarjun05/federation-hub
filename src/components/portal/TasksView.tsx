import { useState } from "react";
import { CheckSquare, Plus, X, Trash2, Circle, CheckCircle2, Clock } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";
import { DEFAULT_TASKS, Task } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(() => 
    loadFromStorage('akef_tasks', DEFAULT_TASKS)
  );
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = { 
      id: Date.now(), 
      title: newTask, 
      status: "pending",
      priority: "medium"
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    saveToStorage('akef_tasks', updated);
    setNewTask("");
  };

  const toggleTask = (id: number) => {
    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      const statusCycle: Task['status'][] = ['pending', 'in-progress', 'completed'];
      const currentIdx = statusCycle.indexOf(t.status);
      const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
      return { ...t, status: nextStatus };
    });
    setTasks(updated);
    saveToStorage('akef_tasks', updated);
  };

  const deleteTask = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveToStorage('akef_tasks', updated);
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={18} className="text-success" />;
      case 'in-progress': return <Clock size={18} className="text-warning" />;
      default: return <Circle size={18} className="text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority?: Task['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="text-primary" /> Task Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.completed} of {stats.total} tasks completed
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-3 py-1 bg-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-warning">{stats.pending}</div>
            <div className="text-[10px] text-muted-foreground">Pending</div>
          </div>
          <div className="text-center px-3 py-1 bg-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-accent">{stats.inProgress}</div>
            <div className="text-[10px] text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center px-3 py-1 bg-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-success">{stats.completed}</div>
            <div className="text-[10px] text-muted-foreground">Done</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'in-progress', 'completed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
              filter === status 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {status === 'all' ? 'All Tasks' : status.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      <GlassCard className="p-0 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {filter === 'all' ? 'No tasks yet. Add your first task!' : `No ${filter.replace('-', ' ')} tasks.`}
          </div>
        ) : (
          filteredTasks.map((task, i) => (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              className={cn(
                "p-4 border-b border-border flex items-center gap-4 cursor-pointer hover:bg-secondary/50 transition-all group animate-slide-up",
                task.status === 'completed' && "bg-secondary/30"
              )}
              style={{ animationDelay: `${i * 30}ms` } as React.CSSProperties}
            >
              <div className="transition-transform group-hover:scale-110">
                {getStatusIcon(task.status)}
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm block truncate",
                  task.status === 'completed' ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {task.title}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> Due: {task.dueDate}
                  </span>
                )}
              </div>
              {task.priority && (
                <StatusBadge variant={getPriorityColor(task.priority)} size="sm">
                  {task.priority}
                </StatusBadge>
              )}
              <button 
                onClick={(e) => deleteTask(e, task.id)} 
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
        
        {/* Add Task Input */}
        <div className="p-3 bg-card flex items-center gap-3 border-t border-border">
          <Plus size={18} className="text-primary flex-shrink-0" />
          <input 
            className="bg-transparent border-none outline-none text-sm text-foreground flex-1 placeholder:text-muted-foreground"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <ActionButton onClick={addTask} size="sm" variant="secondary">
            Add
          </ActionButton>
        </div>
      </GlassCard>
    </div>
  );
}
