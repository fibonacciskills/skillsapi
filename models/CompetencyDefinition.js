const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompetencyDefinitionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  abbreviation: {
    type: String,
    trim: true
  },
  competencyGroup: {
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
  // For tracking direct associations
  directAssociations: [{
    type: Schema.Types.ObjectId,
    ref: 'CompetencyDefinition'
  }],
  // For tracking indirect associations via ResourceAssociation
  resourceAssociations: [{
    type: Schema.Types.ObjectId,
    ref: 'ResourceAssociation'
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
CompetencyDefinitionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CompetencyDefinition', CompetencyDefinitionSchema); 