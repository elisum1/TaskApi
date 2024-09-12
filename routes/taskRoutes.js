const express = require('express');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  validateCreateTask,
  handleValidationErrors,
  validateUpdateTask,
} = require('../controllers/taskContoller');

const router = express.Router();

// Obtener todas las tareas del usuario autenticado
router.get('/getTasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { userId: req.user.userId } });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

// Crear una nueva tarea
router.post('/tasks',authenticateToken, validateCreateTask, handleValidationErrors, async (req, res) => {
    try {
      const { title, description, dueDate, status, priority, category } = req.body;
      const task = await Task.create({
        title,
        description,
        dueDate: dueDate || null,
        status: status || 'Pendiente', // Valor predeterminado
        priority: priority || 'Normal', // Valor predeterminado
        category: category || null,
        userId: req.user.userId,
      });
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Error creating task' });
    }
  }
);

// Actualizar una tarea existente
router.put('/tasks/:taskId',authenticateToken,validateUpdateTask, handleValidationErrors, async (req, res) => {
    try {
      const { taskId } = req.params;
      const { title, description, dueDate, status, priority, category } = req.body;
      const userId = req.user.userId;

      // Buscar la tarea por ID y verificar que pertenezca al usuario
      const task = await Task.findOne({ where: { id: taskId, userId } });

      if (!task) {
        return res.status(404).json({ error: 'Task not found or unauthorized access' });
      }

      // Actualizar solo los campos proporcionados en el cuerpo de la solicitud
      task.title = title !== undefined ? title : task.title;
      task.description = description !== undefined ? description : task.description;
      task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
      task.status = status !== undefined ? status : task.status;
      task.priority = priority !== undefined ? priority : task.priority;
      task.category = category !== undefined ? category : task.category;

      // Guardar los cambios en la base de datos
      await task.save();

      // Responder con la tarea actualizada
      res.status(200).json({
        message: 'Task updated successfully',
        task,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Error updating task' });
    }
  }
);

// Eliminar una tarea existente
router.delete('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ where: { id: taskId, userId: req.user.userId } });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

module.exports = router;
