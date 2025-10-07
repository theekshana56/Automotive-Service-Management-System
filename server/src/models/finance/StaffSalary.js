import mongoose from 'mongoose';

const staffSalarySchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  staffRole: {
    type: String,
    required: true,
    enum: ['advisor', 'mechanic', 'manager', 'admin', 'finance_manager', 'inventory_manager', 'staff_member']
  },
  payPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  regularHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeRate: {
    type: Number,
    default: 1.5, // 1.5x regular rate
    min: 1
  },
  allowances: [{
    type: {
      type: String,
      enum: ['transport', 'meal', 'housing', 'medical', 'bonus', 'commission', 'other']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  deductions: [{
    type: {
      type: String,
      enum: ['epf', 'etf', 'tax', 'loan', 'advance', 'other']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  }],
  calculations: {
    regularPay: {
      type: Number,
      default: 0
    },
    overtimePay: {
      type: Number,
      default: 0
    },
    totalAllowances: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    grossSalary: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      default: 0
    },
    epfContribution: {
      employee: {
        type: Number,
        default: 0
      },
      employer: {
        type: Number,
        default: 0
      }
    },
    etfContribution: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque'],
    default: 'bank_transfer'
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branch: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate salary components
staffSalarySchema.pre('save', function(next) {
  // Calculate regular pay
  this.calculations.regularPay = this.regularHours * this.hourlyRate;
  
  // Calculate overtime pay
  this.calculations.overtimePay = this.overtimeHours * this.hourlyRate * this.overtimeRate;
  
  // Calculate total allowances
  this.calculations.totalAllowances = this.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
  
  // Calculate total deductions
  this.calculations.totalDeductions = this.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  
  // Calculate gross salary
  this.calculations.grossSalary = this.basicSalary + 
                                  this.calculations.regularPay + 
                                  this.calculations.overtimePay + 
                                  this.calculations.totalAllowances;
  
  // Calculate EPF (Employee Provident Fund) - 8% of gross salary
  this.calculations.epfContribution.employee = Math.round(this.calculations.grossSalary * 0.08);
  this.calculations.epfContribution.employer = Math.round(this.calculations.grossSalary * 0.12);
  
  // Calculate ETF (Employee Trust Fund) - 3% of gross salary
  this.calculations.etfContribution = Math.round(this.calculations.grossSalary * 0.03);
  
  // Calculate net salary
  this.calculations.netSalary = this.calculations.grossSalary - 
                                this.calculations.totalDeductions - 
                                this.calculations.epfContribution.employee;
  
  next();
});

// Index for efficient queries
staffSalarySchema.index({ staffId: 1, 'payPeriod.startDate': -1 });
staffSalarySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('StaffSalary', staffSalarySchema);
