// server/validators/supplierValidators.js
const { body } = require("express-validator");

export const createSupplierRules = [
  body("name").notEmpty().withMessage("name is required"),
  body("email").isEmail().withMessage("valid email is required"),
];

export const updateSupplierRules = [
  body("name").optional().notEmpty(),
  body("email").optional().isEmail().withMessage("valid email is required"),
];
