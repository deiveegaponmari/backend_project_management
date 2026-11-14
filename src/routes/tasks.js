const express = require('express');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('project')
      .populate('assignee')
      .populate('reporter')
      .populate('comments')
      .populate('activity');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { project, title, description, status, priority, assignee, dueDate } = req.body;

    const task = await Task.create({
      project,
      title,
      description,
      status: status || 'backlog',
      priority: priority || 'medium',
      assignee: assignee || null,
      reporter: req.user.id,
      dueDate,
    });

    await ActivityLog.create({
      task: task._id,
      project,
      user: req.user.id,
      action: 'task_created',
      details: `Task "${title}" was created`,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, assignee, dueDate, title, description } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (status && status !== task.status) {
      await ActivityLog.create({
        task: task._id,
        project: task.project,
        user: req.user.id,
        action: 'status_changed',
        details: `Status changed from ${task.status} to ${status}`,
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status, assignee, dueDate, title, description },
      { new: true }
    );

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: task._id,
      user: req.user.id,
      text,
    });

    await Task.findByIdAndUpdate(req.params.id, {
      $push: { comments: comment._id },
    });

    await ActivityLog.create({
      task: task._id,
      project: task.project || req.body.project,
      user: req.user.id,
      action: 'comment_added',
      details: 'New comment added',
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
