const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompetencyFrameworkSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    required: true
  },
  competencyDefinitions: [{
    type: Schema.Types.ObjectId,
    ref: 'CompetencyDefinition'
  }],
  rubrics: [{
    type: Schema.Types.ObjectId,
    ref: 'Rubric'
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
    },
    organization: {
      type: String
    }
  }
});

// Update the updatedAt timestamp on save
CompetencyFrameworkSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CompetencyFramework', CompetencyFrameworkSchema); 