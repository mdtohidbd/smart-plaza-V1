const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    default: 'SR' // Still SR internally but will be mapped to Employee in UI
  },
  investmentDetails: {
    mainAmount: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    profitPercentage: { type: Number, default: 0 },
    investedDate: { type: Date },
    lastWithdrawalDate: { type: Date }
  },
  withdrawalRequests: [{
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Profit', 'Main', 'Both'], required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestDate: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    note: { type: String }
  }],
  address: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false  // Changed to false - new users need approval
  },
  isApproved: {
    type: Boolean,
    default: false  // New field to track Super Admin approval
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'  // New users start with Pending status
  },
  tokenVersion: {
    type: Number,
    default: 0  // Incremented to invalidate old tokens
  },
  permissionVersion: {
    type: Number,
    default: 0  // Incremented when role permissions change to force refresh
  },
  permissions: {
    dashboard: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    sales: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    retail: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    purchase: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    products: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    contacts: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    inventory: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    accounts: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    reports: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    users: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    messages: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    settings: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    warranty: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    investors: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    emi: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    ecommerce: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  },
  shops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  }],
  activeShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  }
}, {
  timestamps: true
});

// Set default permissions based on role before saving
userSchema.pre('save', async function() {
  // Set default permissions based on role if not already set or role changed
  if (this.isNew || this.isModified('role')) {
    // Try to load permissions from the Role collection
    try {
      const RoleModel = mongoose.model('Role');
      const roleDoc = await RoleModel.findOne({ name: this.role });
      if (roleDoc && roleDoc.permissions) {
        this.permissions = roleDoc.permissions;
      } else {
        // Fallback default permissions based on role if Role model doesn't exist/have permissions
        switch(this.role) {
          case 'Super Admin': {
            const all = { read: true, create: true, update: true, delete: true };
            this.permissions = {
              dashboard: all, sales: all, purchase: all, products: all, contacts: all,
              inventory: all, accounts: all, reports: all, users: all, messages: all,
              settings: all, warranty: all, investors: all, emi: all, ecommerce: all
            };
            break;
          }
          case 'Manager': {
            const full = { read: true, create: true, update: true, delete: false };
            const ro   = { read: true, create: false, update: false, delete: false };
            const no   = { read: false, create: false, update: false, delete: false };
            this.permissions = {
              dashboard: full, sales: full, purchase: full, products: full, contacts: full,
              inventory: full, accounts: ro, reports: full, messages: full, warranty: full,
              users: no, settings: no, investors: no, emi: full, ecommerce: ro
            };
            break;
          }
          case 'Sales Staff': {
            const createOnly = { read: true, create: true, update: false, delete: false };
            const fullContact = { read: true, create: true, update: true, delete: false };
            const ro   = { read: true, create: false, update: false, delete: false };
            const no   = { read: false, create: false, update: false, delete: false };
            this.permissions = {
              dashboard: ro, 
              sales: createOnly, 
              retail: createOnly, 
              products: createOnly, 
              contacts: fullContact,
              inventory: createOnly, 
              reports: no, 
              warranty: createOnly, 
              emi: { read: true, create: true, update: true, delete: false },
              purchase: no, 
              accounts: no, 
              users: no, 
              messages: no, 
              settings: no,
              investors: no, 
              ecommerce: no
            };
            break;
          }
          case 'Investor': {
            const ro = { read: true, create: false, update: false, delete: false };
            const no = { read: false, create: false, update: false, delete: false };
            this.permissions = {
              dashboard: no, reports: no, investors: ro,
              sales: no, purchase: no, products: no, contacts: no, inventory: no,
              accounts: no, users: no, messages: no, settings: no,
              warranty: no, emi: no, ecommerce: no
            };
            break;
          }
          case 'E-Commerce Admin': {
            const all  = { read: true, create: true, update: true, delete: true };
            const full = { read: true, create: true, update: true, delete: false };
            const ro   = { read: true, create: false, update: false, delete: false };
            const no   = { read: false, create: false, update: false, delete: false };
            this.permissions = {
              dashboard: ro, products: full, contacts: full, inventory: ro, ecommerce: all,
              sales: no, purchase: no, accounts: no, reports: no, users: no,
              messages: no, settings: no, warranty: no, investors: no, emi: no
            };
            break;
          }
          case 'Online Customer': {
            const no = { read: false, create: false, update: false, delete: false };
            this.permissions = {
              products: { read: true, create: false, update: false, delete: false },
              ecommerce: { read: true, create: true, update: true, delete: false },
              dashboard: no, sales: no, purchase: no, contacts: no, inventory: no,
              accounts: no, reports: no, users: no, messages: no, settings: no,
              warranty: no, investors: no, emi: no
            };
            break;
          }
          default: {
            const no = { read: false, create: false, update: false, delete: false };
            this.permissions = {
              dashboard: no, sales: no, purchase: no, products: no, contacts: no,
              inventory: no, accounts: no, reports: no, users: no, messages: no,
              settings: no, warranty: no, investors: no, emi: no, ecommerce: no
            };
            break;
          }
        }
      }
    } catch (e) {
      console.error('Error synchronizing user role permissions:', e);
    }
  }

  // Encrypt password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);