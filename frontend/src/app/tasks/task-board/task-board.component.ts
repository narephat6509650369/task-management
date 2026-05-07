import { Component, OnInit, signal, computed, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskStatus, CreateTaskDto } from '../../core/models/task.model';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, forwardRef(() => TaskCardComponent)],
  template: `
    <div class="board-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="assets/logo.png" class="sidebar-logo" alt="logo" />
        </div>

        <div class="user-card">
          <div class="avatar">{{ userInitial() }}</div>
          <div>
            <div class="user-name">{{ currentUser()?.name }}</div>
            <div class="user-email">{{ currentUser()?.email }}</div>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <span class="stat-num">{{ todoTasks().length }}</span>
            <span class="stat-label">To Do</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ inProgressTasks().length }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ doneTasks().length }}</span>
            <span class="stat-label">Done</span>
          </div>
        </div>

        <button class="btn-logout" (click)="auth.logout()">Sign out</button>
      </aside>

      <!-- Main -->
      <main class="main">
        <div class="top-bar">
          <div>
            <h1>My Tasks</h1>
            <p>{{ tasks().length }} tasks total</p>
          </div>
          <button class="btn-add" (click)="showModal.set(true)">+ New Task</button>
        </div>

        @if (loading()) {
          <div class="loading-state">Loading tasks...</div>
        } @else {
          <div class="kanban">
            <!-- TODO -->
            <div class="column">
              <div class="col-header todo">
                <span class="col-dot"></span>
                <span>To Do</span>
                <span class="col-count">{{ todoTasks().length }}</span>
              </div>
              <div class="task-list">
                @for (task of todoTasks(); track task.id) {
                  <app-task-card
                    [task]="task"
                    (statusChange)="updateStatus(task, $event)"
                    (delete)="deleteTask(task.id)"
                  />
                }
                @if (todoTasks().length === 0) {
                  <div class="empty-col">No tasks here</div>
                }
              </div>
            </div>

            <!-- IN PROGRESS -->
            <div class="column">
              <div class="col-header in-progress">
                <span class="col-dot"></span>
                <span>In Progress</span>
                <span class="col-count">{{ inProgressTasks().length }}</span>
              </div>
              <div class="task-list">
                @for (task of inProgressTasks(); track task.id) {
                  <app-task-card
                    [task]="task"
                    (statusChange)="updateStatus(task, $event)"
                    (delete)="deleteTask(task.id)"
                  />
                }
                @if (inProgressTasks().length === 0) {
                  <div class="empty-col">No tasks here</div>
                }
              </div>
            </div>

            <!-- DONE -->
            <div class="column">
              <div class="col-header done">
                <span class="col-dot"></span>
                <span>Done</span>
                <span class="col-count">{{ doneTasks().length }}</span>
              </div>
              <div class="task-list">
                @for (task of doneTasks(); track task.id) {
                  <app-task-card
                    [task]="task"
                    (statusChange)="updateStatus(task, $event)"
                    (delete)="deleteTask(task.id)"
                  />
                }
                @if (doneTasks().length === 0) {
                  <div class="empty-col">No tasks here</div>
                }
              </div>
            </div>
          </div>
        }
      </main>
    </div>

    <!-- Create Task Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>New Task</h2>
            <button class="btn-close" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="taskForm" (ngSubmit)="createTask()">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" formControlName="title" placeholder="What needs to be done?" />
              @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched) {
                <span class="field-error">Title is required</span>
              }
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" placeholder="Add details..." rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>Status</label>
              <select formControlName="status">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            @if (createError()) {
              <div class="alert alert-error">{{ createError() }}</div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="creating()">
                {{ creating() ? 'Creating...' : 'Create Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .board-layout { display: flex; min-height: 100vh; background: var(--bg); }

    /* Sidebar */
    .sidebar {
      width: 240px; flex-shrink: 0; background: var(--surface);
      border-right: 1px solid var(--border); padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1.5rem;
    }
    .sidebar-header { display: flex; align-items: center; gap: 0.75rem; }

    /* Sidebar */
    .sidebar-logo { width: 200px; height: auto;}
    .logo { font-size: 1.5rem; }
    .logo-text { font-size: 1.125rem; font-weight: 700; color: var(--text); }
    .user-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg); border-radius: 10px; }
    .avatar {
      width: 36px; height: 36px; background: var(--accent);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 1rem; flex-shrink: 0;
    }
    .user-name { font-size: 0.875rem; font-weight: 600; color: var(--text); }
    .user-email { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .stats { display: flex; gap: 0.5rem; }
    .stat { flex: 1; text-align: center; padding: 0.75rem 0.5rem; background: var(--bg); border-radius: 8px; }
    .stat-num { display: block; font-size: 1.25rem; font-weight: 700; color: var(--text); }
    .stat-label { font-size: 0.7rem; color: var(--text-muted); }
    .btn-logout {
      margin-top: auto; padding: 0.625rem; border: 1px solid var(--border);
      background: transparent; color: var(--text-muted); border-radius: 8px;
      cursor: pointer; font-size: 0.875rem; transition: all 0.2s;
    }
    .btn-logout:hover { background: var(--bg); color: var(--danger); border-color: var(--danger); }

    /* Main */
    .main { flex: 1; padding: 2rem; overflow: auto; }
    .top-bar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; }
    .top-bar h1 { font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0 0 0.25rem; }
    .top-bar p { color: var(--text-muted); font-size: 0.875rem; margin: 0; }

    .btn-add {
      padding: 0.625rem 1.25rem; background: var(--accent); color: white;
      border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
      font-size: 0.875rem; transition: opacity 0.2s; white-space: nowrap;
    }
    .btn-add:hover { opacity: 0.9; }

    /* Kanban */
    .kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .column { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; }
    .col-header {
      display: flex; align-items: center; gap: 0.5rem;
      font-weight: 600; font-size: 0.875rem; color: var(--text);
      margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);
    }
    .col-dot { width: 8px; height: 8px; border-radius: 50%; }
    .col-header.todo .col-dot { background: #94a3b8; }
    .col-header.in-progress .col-dot { background: #f59e0b; }
    .col-header.done .col-dot { background: #22c55e; }
    .col-count {
      margin-left: auto; background: var(--bg); border-radius: 999px;
      padding: 0.1rem 0.5rem; font-size: 0.75rem; color: var(--text-muted);
    }
    .task-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .empty-col { text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1.5rem 0; }

    .loading-state { text-align: center; color: var(--text-muted); padding: 4rem; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 100; padding: 1rem;
    }
    .modal {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 2rem; width: 100%; max-width: 480px;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h2 { font-size: 1.25rem; font-weight: 700; color: var(--text); margin: 0; }
    .btn-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.25rem; padding: 0; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--text); margin-bottom: 0.5rem; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; padding: 0.75rem 1rem; background: var(--bg);
      border: 1.5px solid var(--border); border-radius: 8px; color: var(--text);
      font-size: 0.95rem; box-sizing: border-box; font-family: inherit;
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none; border-color: var(--accent);
    }
    .form-group textarea { resize: vertical; }
    .field-error { color: var(--danger); font-size: 0.8rem; margin-top: 0.25rem; display: block; }
    .alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .alert-error { background: rgba(239,68,68,0.1); color: var(--danger); border: 1px solid rgba(239,68,68,0.2); }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-secondary {
      padding: 0.625rem 1.25rem; background: transparent; border: 1px solid var(--border);
      color: var(--text); border-radius: 8px; cursor: pointer; font-size: 0.875rem;
    }
    .btn-primary {
      padding: 0.625rem 1.25rem; background: var(--accent); color: white;
      border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.875rem;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class TaskBoardComponent implements OnInit {
  tasks = signal<Task[]>([]);
  loading = signal(true);
  showModal = signal(false);
  creating = signal(false);
  createError = signal('');

  taskForm: FormGroup;

  todoTasks = computed(() => this.tasks().filter((t) => t.status === 'TODO'));
  inProgressTasks = computed(() => this.tasks().filter((t) => t.status === 'IN_PROGRESS'));
  doneTasks = computed(() => this.tasks().filter((t) => t.status === 'DONE'));

  currentUser = this.auth.currentUser;
  userInitial = computed(() => this.currentUser()?.name?.charAt(0)?.toUpperCase() || '?');

  constructor(
    private taskService: TaskService,
    public auth: AuthService,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['TODO'],
    });
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (tasks) => { this.tasks.set(tasks); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  createTask(): void {
    if (this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; }

    this.creating.set(true);
    this.createError.set('');

    const dto: CreateTaskDto = this.taskForm.value;
    this.taskService.createTask(dto).subscribe({
      next: (task) => {
        this.tasks.update((list) => [task, ...list]);
        this.closeModal();
        this.creating.set(false);
      },
      error: (err) => {
        this.createError.set(err.error?.error || 'Failed to create task.');
        this.creating.set(false);
      },
    });
  }

  updateStatus(task: Task, status: TaskStatus): void {
    this.taskService.updateTask(task.id, { status }).subscribe({
      next: (updated) => {
        this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
      },
    });
  }

  deleteTask(id: number): void {
    this.taskService.deleteTask(id).subscribe({
      next: () => this.tasks.update((list) => list.filter((t) => t.id !== id)),
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.taskForm.reset({ status: 'TODO' });
    this.createError.set('');
  }
}

// ─── Inline Task Card Sub-component ───
import { Component as Comp, Input, Output, EventEmitter } from '@angular/core';

@Comp({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-card">
      <div class="task-top">
        <span class="task-title">{{ task.title }}</span>
        <button class="btn-del" (click)="delete.emit()" title="Delete">✕</button>
      </div>
      @if (task.description) {
        <p class="task-desc">{{ task.description }}</p>
      }
      <div class="task-footer">
        <span class="task-date">{{ task.createdAt | date: 'MMM d' }}</span>
        <select class="status-select" [value]="task.status" (change)="onStatusChange($event)">
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .task-card {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 10px; padding: 1rem; transition: box-shadow 0.2s;
    }
    .task-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
    .task-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
    .task-title { font-weight: 600; color: var(--text); font-size: 0.9rem; line-height: 1.4; flex: 1; }
    .btn-del { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; font-size: 0.75rem; opacity: 0.5; transition: opacity 0.2s; flex-shrink: 0; }
    .btn-del:hover { opacity: 1; color: var(--danger); }
    .task-desc { color: var(--text-muted); font-size: 0.8rem; margin: 0 0 0.75rem; line-height: 1.4; }
    .task-footer { display: flex; align-items: center; justify-content: space-between; }
    .task-date { font-size: 0.75rem; color: var(--text-muted); }
    .status-select {
      font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--surface);
      border: 1px solid var(--border); border-radius: 6px; color: var(--text); cursor: pointer;
    }
    .status-select:focus { outline: none; }
  `],
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Output() statusChange = new EventEmitter<TaskStatus>();
  @Output() delete = new EventEmitter<void>();

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as TaskStatus;
    this.statusChange.emit(value);
  }
}
