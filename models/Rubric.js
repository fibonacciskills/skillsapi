const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RubricSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  framework: {
    type: Schema.Types.ObjectId,
    ref: 'CompetencyFramework',
    required: true
  },
  criteria: [{
    type: Schema.Types.ObjectId,
    ref: 'RubricCriterion'
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
RubricSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Rubric', RubricSchema); 