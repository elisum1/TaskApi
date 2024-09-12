const { body, validationResult, param } = require('express-validator');
const Task = require('../models/Task');

// Validaciones para la creación de tareas
const validateCreateTask = [
  body('title').notEmpty().withMessage('Title is required'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Due Date must be a valid date'),
];

// Middleware para validar la actualización de tareas
const validateUpdateTask = [
  param('taskId')
    .isInt()
    .withMessage('Task ID must be an integer'),
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('description')
    .optional()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Due Date must be a valid date'),
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


// Crear una nueva tarea
const createTask = async (req, res) => {
  const { title, description, dueDate } = req.body;
  const userId = req.user.userId;

  try {
    const task = await Task.create({
      title,
      description,
      dueDate: dueDate || null,
      userId,
    });
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error });
  }
};

// Actualizar una tarea existente
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    const { title, description, dueDate } = req.body;

    const task = await Task.findOne({ where: { id: taskId, userId } });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;

    await task.save();
    res.status(200).json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
};

// Eliminar una tarea existente
const deleteTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.userId;

  try {
    const task = await Task.findOne({ where: { id: taskId, userId } });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  handleValidationErrors,
  createTask,
  updateTask,
  deleteTask,
};
