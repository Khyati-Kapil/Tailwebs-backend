const { z } = require('zod');

const createAssignmentSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  dueDate: z.string().min(1)
});

const updateAssignmentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(3).optional(),
  dueDate: z.string().min(1).optional()
});

const statusTransitionSchema = z.object({
  status: z.enum(['Draft', 'Published', 'Completed'])
});

module.exports = {
  createAssignmentSchema,
  updateAssignmentSchema,
  statusTransitionSchema
};
