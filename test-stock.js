require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const StockBatch = require('./backend/models/StockBatch');
const Product = require('./backend/models/Product');
const StockUnit = require('./backend/models/StockUnit');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartplaza')
  .then(async () => {
    const batches = await StockBatch.find().populate('product', 'name');
    console.log(`Total batches: ${batches.length}`);
    const summary = {};
    for (const b of batches) {
      if (!b.product) continue;
      const pname = b.product.name;
      if (!summary[pname]) summary[pname] = { totalQty: 0, totalRemaining: 0, activeBatches: 0 };
      summary[pname].totalQty += b.quantity;
      summary[pname].totalRemaining += b.remainingQty;
      if (b.isActive && b.remainingQty > 0) {
        summary[pname].activeBatches += 1;
      }
    }
    console.log(summary);
    
    // Check StockBatch summary aggregate
    const agg = await StockBatch.aggregate([
      {
        $group: {
          _id: '$product',
          totalRemaining: { $sum: '$remainingQty' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalRemaining: 1
        }
      }
    ]);
    console.log("Aggregate:");
    console.log(agg);
    
    process.exit(0);
  });
