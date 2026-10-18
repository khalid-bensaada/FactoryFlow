const { z } = require("zod");

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id")
  .transform((value) => value.toLowerCase());

const compositionItemSchema = z
  .object({
    material: objectId,
    quantityPerUnit: z.number().positive(),
  })
  .strict();

const compositionSchema = z
  .array(compositionItemSchema)
  .min(1, "Composition must have at least one item")
  .refine(
    (items) =>
      new Set(items.map((item) => item.material)).size === items.length,
    { message: "A material cannot appear twice in the composition" },
  );

const createProductSchema = z
  .object({
    reference: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().trim().optional(),
    composition: compositionSchema,
  })
  .strict();

const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    composition: compositionSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

module.exports = { createProductSchema, updateProductSchema };
