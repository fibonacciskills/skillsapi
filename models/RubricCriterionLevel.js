const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RubricCriterionLevelSchema = new Schema({
  level: {
    type: Number,
    required: true,
    min: 1
  },
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  criterion: {
    type: Schema.Types.ObjectId,
    ref: 'RubricCriterion',
    required: true
  },
  examples: [{
    type: String,
    trim: true
  }],
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String
    }
  }
});

// Update the updatedAt timestamp on save
RubricCriterionLevelSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RubricCriterionLevel', RubricCriterionLevelSchema); 