import { Injectable, NotFoundException } from '@nestjs/common';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];
  private idCounter = 1;

  create(createTaskDto: CreateTaskDto): Task {
    const task: Task = {
      id: this.idCounter++,
      title: createTaskDto.title,
      description: createTaskDto.description,
      completed: false,
    };

    this.tasks.push(task);
    return task;
  }

  findAll(): Task[] {
    return this.tasks;
  }

  findOne(id: number): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  update(id: number, updateTaskDto: UpdateTaskDto): Task {
    const task = this.findOne(id);
    Object.assign(task, updateTaskDto);
    return task;
  }

  remove(id: number) {
    const task = this.findOne(id);
    this.tasks = this.tasks.filter((t) => t.id !== task.id);
    return { deleted: true };
  }
}
