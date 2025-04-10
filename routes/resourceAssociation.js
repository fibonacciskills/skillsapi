const express = require('express');
const router = express.Router();
const ResourceAssociation = require('../models/ResourceAssociation');
const CompetencyDefinition = require('../models/CompetencyDefinition');

// Get all resource associations
router.get('/', async (req, res) => {
  try {
    const associations = await ResourceAssociation.find();
    res.json(associations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get associations by framework ID
router.get('/framework/:frameworkId', async (req, res) => {
  try {
    const associations = await ResourceAssociation.find({ framework: req.params.frameworkId });
    res.json(associations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one association by ID
router.get('/:id', getAssociation, (req, res) => {
  res.json(res.association);
});

// Create a resource association
router.post('/', async (req, res) => {
  const association = new ResourceAssociation({
    associationType: 'INDIRECT_ASSOCIATION',
    source: req.body.source,
    destination: req.body.destination,
    description: req.body.description,
    framework: req.body.framework,
    weight: req.body.weight || 1,
    metadata: {
      createdBy: req.body.createdBy
    }
  });

  try {
    // Check if source and destination exist
    const source = await CompetencyDefinition.findById(req.body.source);
    const destination = await CompetencyDefinition.findById(req.body.destination);
    
    if (!source || !destination) {
      return res.status(404).json({ 
        message: !source && !destination ? 'Source and destination not found' :
                !source ? 'Source not found' : 'Destination not found'
      });
    }

    const newAssociation = await association.save();
    
    // Add reference to both source and destination competency definitions
    source.resourceAssociations.push(newAssociation._id);
    destination.resourceAssociations.push(newAssociation._id);
    
    await source.save();
    await destination.save();
    
    res.status(201).json(newAssociation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a resource association
router.patch('/:id', getAssociation, async (req, res) => {
  if (req.body.description != null) {
    res.association.description = req.body.description;
  }
  if (req.body.weight != null) {
    res.association.weight = req.body.weight;
  }

  try {
    const updatedAssociation = await res.association.save();
    res.json(updatedAssociation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a resource association
router.delete('/:id', getAssociation, async (req, res) => {
  try {
    // Remove references from source and destination
    const source = await CompetencyDefinition.findById(res.association.source);
    const destination = await CompetencyDefinition.findById(res.association.destination);
    
    if (source) {
      const sourceIndex = source.resourceAssociations.indexOf(res.association._id);
      if (sourceIndex > -1) {
        source.resourceAssociations.splice(sourceIndex, 1);
        await source.save();
      }
    }
    
    if (destination) {
      const destIndex = destination.resourceAssociations.indexOf(res.association._id);
      if (destIndex > -1) {
        destination.resourceAssociations.splice(destIndex, 1);
        await destination.save();
      }
    }

    await res.association.remove();
    res.json({ message: 'Resource Association deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting association by ID
async function getAssociation(req, res, next) {
  let association;
  try {
    association = await ResourceAssociation.findById(req.params.id);
    if (association == null) {
      return res.status(404).json({ message: 'Cannot find resource association' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.association = association;
  next();
}

module.exports = router; 