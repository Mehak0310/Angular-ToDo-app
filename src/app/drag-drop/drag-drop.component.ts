import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';

type Category = { title: string; tasks: string[]; taskInput: string };

@Component({
  selector: 'app-drag-drop',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './drag-drop.component.html',
  styleUrl: './drag-drop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-20px)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class DragDropComponent {
  newCategoryTitle = '';
  editingCategoryIndex: number | null = null;
  editingTaskIndex: number | null = null;
  editingTaskCategoryIndex: number | null = null;
  errorMessage = '';
  successMessage = '';
  readonly messageDelayMs = 3000;

  categories: Category[] = [];

  constructor() {
    this.loadCategoriesFromLocalStorage();
  }

  trackTask(index: number) {
    return index;
  }

  addCategory() {
    this.editingCategoryIndex = null;
    const title = this.newCategoryTitle.trim();
    if (!title) {
      this.setError('category');
      return;
    }

    const duplicate = this.categories.some(
      category => category.title.toLowerCase() === title.toLowerCase()
    );

    if (duplicate) {
      this.setError('categoryExist');
      return;
    }

    this.categories.push({ title, tasks: [], taskInput: '' });
    this.newCategoryTitle = '';
    this.setSuccess('Category added successfully!');
    this.saveCategoriesToLocalStorage();
  }

  addTask(categoryIndex: number) {
    this.editingTaskIndex = null;
    const taskInput = this.categories[categoryIndex]?.taskInput?.trim();

    if (!taskInput) {
      this.setError(`task-${categoryIndex}`);
      return;
    }

    this.categories[categoryIndex].tasks.push(taskInput);
    this.categories[categoryIndex].taskInput = '';
    this.setSuccess('Task added successfully!');
    this.saveCategoriesToLocalStorage();
  }

  editCategory(index: number) {
    this.editingCategoryIndex = index;
  }

  saveCategory(index: number) {
    if (!this.categories[index].title.trim()) {
      this.setError(`category-edit-${index}`);
      return;
    }

    this.editingCategoryIndex = null;
    this.setSuccess('Category updated successfully!');
    this.saveCategoriesToLocalStorage();
  }

  moveTask(currentCategoryIndex: number, taskIndex: number, event: Event) {
    const targetCategoryIndex = Number((event.target as HTMLSelectElement).value);
    if (targetCategoryIndex < 0 || targetCategoryIndex === currentCategoryIndex) {
      return;
    }

    const taskToMove = this.categories[currentCategoryIndex].tasks.splice(taskIndex, 1)[0];
    this.categories[targetCategoryIndex].tasks.push(taskToMove);
    this.saveCategoriesToLocalStorage();
  }

  editTask(categoryIndex: number, taskIndex: number) {
    this.editingTaskIndex = taskIndex;
    this.editingTaskCategoryIndex = categoryIndex;
  }

  saveTask(categoryIndex: number, taskIndex: number) {
    if (!this.categories[categoryIndex].tasks[taskIndex].trim()) {
      this.setError(`task-edit-${categoryIndex}-${taskIndex}`);
      return;
    }

    this.editingTaskIndex = null;
    this.editingTaskCategoryIndex = null;
    this.setSuccess('Task updated successfully!');
    this.saveCategoriesToLocalStorage();
  }

  deleteTask(categoryIndex: number, taskIndex: number) {
    this.categories[categoryIndex].tasks.splice(taskIndex, 1);
    this.setSuccess('Task deleted successfully!');
    this.saveCategoriesToLocalStorage();
  }

  deleteCategory(index: number) {
    this.categories.splice(index, 1);
    this.setSuccess('Category deleted successfully!');
    this.saveCategoriesToLocalStorage();
  }

  dropTask(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.saveCategoriesToLocalStorage();
  }

  saveCategoriesToLocalStorage() {
    localStorage.setItem('categories', JSON.stringify(this.categories));
  }

  loadCategoriesFromLocalStorage() {
    const stored = localStorage.getItem('categories');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(item => item && typeof item.title === 'string')) {
          this.categories = parsed;
          return;
        }
      } catch {
        // fall back to defaults
      }
    }
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    this.categories = [
      { title: 'Pending', tasks: [], taskInput: '' },
      { title: 'In Progress', tasks: [], taskInput: '' },
      { title: 'Completed', tasks: [], taskInput: '' },
      { title: 'Verified', tasks: [], taskInput: '' },
    ];
    this.saveCategoriesToLocalStorage();
  }

  private setError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    this.clearMessagesAfterDelay();
  }

  private setSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    this.clearMessagesAfterDelay();
  }

  private clearMessagesAfterDelay() {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, this.messageDelayMs);
  }

  getConnectedLists(): string[] {
    return this.categories.map((_, index) => `category-${index}`);
  }
}