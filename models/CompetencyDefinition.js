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
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['skill', 'knowledge', 'ability', 'disposition', 'competency', 'job_role'],
    default: 'competency'
  },
  category: {
    type: String,
    trim: true
  },
  competencyGroup: {
    type: String,
    trim: true
  },
  abbreviation: {
    type: String,
    trim: true
  },
  framework: {
    type: Schema.Types.ObjectId,
    ref: 'CompetencyFramework',
    required: true
  },
  // CASE 1.1 specific fields
  keywords: [{
    type: String,
    trim: true
  }],
  educationLevel: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    default: 'en-US'
  },
  license: {
    type: String,
    default: 'https://creativecommons.org/licenses/by/4.0/'
  },
  status: {
    type: String,
    enum: ['Active', 'Deprecated', 'Draft'],
    default: 'Active'
  },
  creators: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  // End CASE 1.1 specific fields
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
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

// Update the updatedAt timestamp on save
CompetencyDefinitionSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CompetencyDefinition', CompetencyDefinitionSchema); 