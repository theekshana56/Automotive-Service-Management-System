// server/validators/partValidators.js
const { body } = require("express-validator");

export const createPartRules = [
  body("name").notEmpty().withMessage("name is required"),
  body("partCode").notEmpty().withMessage("partCode is required"),
  body("category").notEmpty().withMessage("category is required"),
  body("sellingPrice").optional().isFloat({ min: 0 }).withMessage("sellingPrice must be a positive number"),
  body("stock.onHand").optional().isInt({ min: 0 }),
  body("stock.minLevel").optional().isInt({ min: 0 }),
  body("stock.maxLevel").optional().isInt({ min: 0 }),
  body("stock.reorderLevel").optional().isInt({ min: 0 }),
];

export const updatePartRules = [
  body("name").optional().notEmpty(),
  body("partCode").optional().notEmpty(),
  body("category").optional().notEmpty(),
  body("sellingPrice").optional().isFloat({ min: 0 }).withMessage("sellingPrice must be a positive number"),
  body("stock.onHand").optional().isInt({ min: 0 }),
  body("stock.minLevel").optional().isInt({ min: 0 }),
  body("stock.maxLevel").optional().isInt({ min: 0 }),
  body("stock.reorderLevel").optional().isInt({ min: 0 }),
];