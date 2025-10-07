import Joi from 'joi';


// Middleware to validate request body against a Joi schema
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }
    
    next();
  };
};

// Joi schemas for validation
export const schemas = {
  auth: {
    register: Joi.object({
      name: Joi.string().max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      role: Joi.string().valid('finance_manager', 'admin')
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  },
  invoice: Joi.object({
    invoiceNumber: Joi.string().required(),
    customer: Joi.string().hex().length(24).required(),
    date: Joi.date().default(Date.now),
    dueDate: Joi.date().greater(Joi.ref('date')).required(),
    items: Joi.array().items(Joi.object({
      description: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
      taxRate: Joi.number().min(0).max(100).default(0)
    })).min(1).required(),
    status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled').default('draft'),
    notes: Joi.string().max(500).allow('')
  }),
  payment: Joi.object({
    invoice: Joi.string().hex().length(24).required(),
    customer: Joi.string().hex().length(24).required(),
    amount: Joi.number().min(0).required(),
    paymentDate: Joi.date().default(Date.now),
    paymentMethod: Joi.string().valid('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check').required(),
    reference: Joi.string().max(100).allow(''),
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').default('pending'),
    notes: Joi.string().max(500).allow('')
  }),
  customer: Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().allow(''),
    phone: Joi.string().max(20).allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      zipCode: Joi.string().allow(''),
      country: Joi.string().allow('')
    }),
    creditLimit: Joi.number().min(0).default(0),
    paymentTerms: Joi.number().min(0).default(30)
  }),
  vehicle: Joi.object({
    make: Joi.string().max(50).required(),
    model: Joi.string().max(50).required(),
    year: Joi.number().min(1900).max(new Date().getFullYear() + 1).required(),
    vin: Joi.string().max(17).required(),
    licensePlate: Joi.string().max(15).required(),
    color: Joi.string().max(30).allow(''),
    mileage: Joi.number().min(0).allow(''),
    customer: Joi.string().hex().length(24).required()
  }),
  vendor: Joi.object({
    name: Joi.string().max(100).required(),
    contactPerson: Joi.string().max(50).allow(''),
    email: Joi.string().email().allow(''),
    phone: Joi.string().max(20).allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      zipCode: Joi.string().allow(''),
      country: Joi.string().allow('')
    }),
    paymentTerms: Joi.number().min(0).default(30),
    accountNumber: Joi.string().max(50).allow(''),
    taxId: Joi.string().max(50).allow('')
  }),
  bill: Joi.object({
    billNumber: Joi.string().required(),
    vendor: Joi.string().hex().length(24).required(),
    date: Joi.date().default(Date.now),
    dueDate: Joi.date().greater(Joi.ref('date')).required(),
    items: Joi.array().items(Joi.object({
      description: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
      taxRate: Joi.number().min(0).max(100).default(0)
    })).min(1).required(),
    status: Joi.string().valid('draft', 'received', 'approved', 'paid', 'overdue', 'cancelled').default('draft'),
    notes: Joi.string().max(500).allow('')
  })
};