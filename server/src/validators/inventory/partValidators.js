// server/validators/partValidators.js
const { body } = require("express-validator");

exports.createPartRules = [
  body("name").notEmpty().withMessage("name is required"),
  body("partCode").notEmpty().withMessage("partCode is required"),
  body("category").notEmpty().withMessage("category is required"),
  body("stock.onHand").optional().isInt({ min: 0 }),
  body("stock.minLevel").optional().isInt({ min: 0 }),
  body("stock.maxLevel").optional().isInt({ min: 0 }),
  body("stock.reorderLevel").optional().isInt({ min: 0 }),
];

exports.updatePartRules = [
  body("name").optional().notEmpty(),
  body("partCode").optional().notEmpty(),
  body("category").optional().notEmpty(),
  body("stock.onHand").optional().isInt({ min: 0 }),
  body("stock.minLevel").optional().isInt({ min: 0 }),
  body("stock.maxLevel").optional().isInt({ min: 0 }),
  body("stock.reorderLevel").optional().isInt({ min: 0 }),
];
