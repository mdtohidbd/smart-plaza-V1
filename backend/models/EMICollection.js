const mongoose = require('mongoose');

const emiCollectionSchema = new mongoose.Schema({
  // Reference to EMI Invoice
  emiInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMIInvoice',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  
  // Collection Details
  collectionDate: {
    type: Date,
    default: Date.now
  },
  instalmentNumber: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date
  },
  
  // Payment Details
  scheduledAmount: {
    type: Number,
    required: true
  },
  collectedAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bkash', 'nagad', 'cheque'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  chequeNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['on-time', 'late', 'partial', 'advance', 'bounced'],
    default: 'on-time'
  },
  daysOverdue: {
    type: Number,
    default: 0
  },
  lateFee: {
    type: Number,
    default: 0
  },
  
  // Collection Agent Info
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collectionLocation: {
    type: String,
    enum: ['showroom', 'customer-place', 'phone', 'online']
  },
  
  // Notes and Remarks
  notes: String,
  customerFeedback: String,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  
  // Receipt Details
  receiptNumber: {
    type: String,
    unique: true,
    trim: true
  },
  receiptIssued: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save to generate receipt number and update invoice
emiCollectionSchema.pre('save', async function() {
  // Generate receipt number if not exists
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of collections today
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: today }
    });
    
    this.receiptNumber = `REC/${year}${month}${day}/${(count + 1).toString().padStart(3, '0')}`;
  }
  
  // Calculate days overdue if payment is late
  if (this.dueDate && this.collectionDate > this.dueDate) {
    const diffTime = Math.abs(this.collectionDate - this.dueDate);
    this.daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.status = this.collectedAmount < this.scheduledAmount ? 'partial' : 'late';
  }
});

// Post-save to update EMI invoice
emiCollectionSchema.post('save', async function(doc) {
  try {
    const EMIInvoice = mongoose.model('EMIInvoice');
    const emiInvoice = await EMIInvoice.findById(this.emiInvoice);
    
    if (emiInvoice) {
      const principalPaid = this.collectedAmount - (this.lateFee || 0);
      
      // Find and update the specific instalment
      const instalment = emiInvoice.instalments.find(inst => inst.instalmentNumber === this.instalmentNumber);
      if (instalment) {
        instalment.paidAmount = (instalment.paidAmount || 0) + principalPaid;
        instalment.lateFeePaid = (instalment.lateFeePaid || 0) + (this.lateFee || 0);
        instalment.paidDate = this.collectionDate;
        instalment.paymentMethod = this.paymentMethod;
        instalment.status = instalment.paidAmount >= instalment.amount ? 'paid' : 'partial';
        
        if (this.lateFee > 0) {
          instalment.notes = `${instalment.notes || ''} Late fee: ${this.lateFee}. `;
        }
      }
      
      // Update invoice totals
      emiInvoice.totalLateFeePaid = (emiInvoice.totalLateFeePaid || 0) + (this.lateFee || 0);
      emiInvoice.paidAmount = emiInvoice.instalments.reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);
      emiInvoice.outstandingBalance = emiInvoice.emiPlan.totalPayableAmount - emiInvoice.paidAmount;
      
      // Check if all instalments are paid
      const allPaid = emiInvoice.instalments.every(inst => inst.status === 'paid' || inst.status === 'waived');
      if (allPaid) {
        emiInvoice.status = 'completed';
        emiInvoice.isActive = false;
      }
      
      await emiInvoice.save();
    }
  } catch (error) {
    console.error('Error updating EMI invoice after collection:', error);
  }
});

module.exports = mongoose.model('EMICollection', emiCollectionSchema);
