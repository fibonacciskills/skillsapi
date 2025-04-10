const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RubricCriterionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  competencyDefinition: {
    type: Schema.Types.ObjectId,
    ref: 'CompetencyDefinition'
  },
  rubric: {
    type: Schema.Types.ObjectId,
    ref: 'Rubric',
    required: true
  },
  levels: [{
    type: Schema.Types.ObjectId,
    ref: 'RubricCriterionLevel'
  }],
  weight: {
    type: Number,
    default: 1,
    min: 0,
    max: 10
  },
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
RubricCriterionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RubricCriterion', RubricCriterionSchema); 