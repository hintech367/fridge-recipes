const mongoose = require('mongoose');

const PantryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, default: 1 },
  image: { type: String, default: '' }
}, { timestamps: true });

PantryItemSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.models.PantryItem || mongoose.model('PantryItem', PantryItemSchema);