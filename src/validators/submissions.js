const { z } = require('zod');

const createSubmissionSchema = z.object({
  assignmentId: z.string().min(1),
  answerText: z.string().min(1),
});

module.exports = { createSubmissionSchema };
