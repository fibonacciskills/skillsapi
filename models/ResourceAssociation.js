const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResourceAssociationSchema = new Schema({
  associationType: {
    type: String,
    required: true,
    enum: ['INDIRECT_ASSOCIATION', 'REQUIRES', 'REQUIRED_BY', 'RelatedTo'],
    default: 'RelatedTo'
  },
  source: {
    type: Schema.Types.ObjectId,
    ref: 'CompetencyDefinition',
    required: true
  },
  destination: {
    type: Schema.Types.ObjectId,
    ref: 'CompetencyDefinition',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  framework: {
    type: Schema.Types.ObjectId,
    ref: 'CompetencyFramework'
  },
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
ResourceAssociationSchema.pre('save', function(next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ResourceAssociation', ResourceAssociationSchema); 