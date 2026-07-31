const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'frontend', 'src', 'views', 'Purchase'),
  path.join(__dirname, 'frontend', 'src', 'views', 'Reports')
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

let files = [];
targetDirs.forEach(dir => {
  files = files.concat(walkDir(dir));
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace company properties
  content = content.replace(/company\?\.businessName/g, 'supplier?.name');
  content = content.replace(/company\.businessName/g, 'supplier.name');
  content = content.replace(/company\?\.contactNumber/g, 'supplier?.contactNumber');
  content = content.replace(/company\.contactNumber/g, 'supplier.contactNumber');
  content = content.replace(/company\?\.contactPersonName/g, 'supplier?.contactName');
  content = content.replace(/company\.contactPersonName/g, 'supplier.contactName');
  
  // Replace references
  content = content.replace(/purchase\.company/g, 'purchase.supplier');
  content = content.replace(/item\.company/g, 'item.supplier');
  content = content.replace(/row\.company/g, 'row.supplier');

  // Replace variables
  content = content.replace(/companyId/g, 'supplierId');
  content = content.replace(/companiesWithDues/g, 'suppliersWithDues');
  content = content.replace(/allCompanies/g, 'allSuppliers');
  
  // Also we need to be careful with state variables `company:`
  content = content.replace(/company:/g, 'supplier:');
  content = content.replace(/formData\.company/g, 'formData.supplier');
  content = content.replace(/name="company"/g, 'name="supplier"');

  // map companies -> suppliers in select maps
  content = content.replace(/companies\.map\(\(company\)/g, 'suppliers.map((supplier)');
  content = content.replace(/company\._id/g, 'supplier._id');
  content = content.replace(/company/g, 'supplier');
  content = content.replace(/companies/g, 'suppliers');
  
  // Fix capitals
  content = content.replace(/Company/g, 'Supplier');
  content = content.replace(/Companies/g, 'Suppliers');

  // Any leftover `supplier.businessName` -> `supplier.name`
  content = content.replace(/supplier\.businessName/g, 'supplier.name');
  content = content.replace(/supplier\?\.businessName/g, 'supplier?.name');
  content = content.replace(/supplier\.contactPersonName/g, 'supplier.contactName');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
console.log('Replacement complete.');
