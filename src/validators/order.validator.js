const { z } = require("zod");
const { ORDER_STATUSES } = require("../constants/orderStatus");
const { paginationSchema } = require("./rawMaterial.validator");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const isValidDate = (value) => !Number.isNaN(Date.parse(value));
const isDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const fromDate = z
  .string()
  .refine(isValidDate, "Invalid date")
  .transform((value) => new Date(value));

const toDate = z
  .string()
  .refine(isValidDate, "Invalid date")
  .transform((value) =>
    isDateOnly(value) ? new Date(`${value}T23:59:59.999Z`) : new Date(value),
  );

const createOrderSchema = z
  .object({
    product: objectId,
    quantity: z.number().positive(),
    assignedTo: objectId,
  })
  .strict();

const updateOrderSchema = z
  .object({
    quantity: z.number().positive().optional(),
    assignedTo: objectId.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const listOrdersQuerySchema = paginationSchema
  .extend({
    status: z.enum(ORDER_STATUSES).optional(),
    product: objectId.optional(),
    from: fromDate.optional(),
    to: toDate.optional(),
  })
  .strict()
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "from must not be after to",
    path: ["from"],
  });

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  listOrdersQuerySchema,
};
