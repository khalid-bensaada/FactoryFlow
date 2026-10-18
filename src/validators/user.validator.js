const { z } = require("zod");

const createOperatorSchema = z
  .object({
    name: z.string().trim().min(3).max(100),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict();

module.exports = { createOperatorSchema };
