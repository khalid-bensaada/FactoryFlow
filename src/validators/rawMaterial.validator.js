const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const idParamSchema = z.object({ id: objectId });

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createMaterialSchema = z
  .object({
    reference: z.string().trim().min(1),
    name: z.string().trim().min(1),
    unit: z.string().trim().min(1),
    quantity: z.number().min(0).optional(),
    alertThreshold: z.number().min(0).optional(),
  })
  .strict();

const updateMaterialSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).optional(),
    alertThreshold: z.number().min(0).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const stockEntrySchema = z
  .object({
    quantity: z.number().positive(),
  })
  .strict();

module.exports = {
  idParamSchema,
  paginationSchema,
  createMaterialSchema,
  updateMaterialSchema,
  stockEntrySchema,
};
