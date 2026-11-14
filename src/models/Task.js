const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'Project',
      required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in-progress', 'review', 'done'],
    default: 'backlog',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, default: null },
  activity: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityLog'
  }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
