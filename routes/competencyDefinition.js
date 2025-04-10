const express = require('express');
const router = express.Router();
const CompetencyDefinition = require('../models/CompetencyDefinition');
const CompetencyFramework = require('../models/CompetencyFramework');

// Get all competency definitions
router.get('/', async (req, res) => {
  try {
    const definitions = await CompetencyDefinition.find();
    res.json(definitions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one definition by ID
router.get('/:id', getDefinition, (req, res) => {
  res.json(res.definition);
});

// Create a competency definition
router.post('/', async (req, res) => {
  const definition = new CompetencyDefinition({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    abbreviation: req.body.abbreviation,
    competencyGroup: req.body.competencyGroup,
    framework: req.body.framework,
    metadata: {
      createdBy: req.body.createdBy
    }
  });

  try {
    // Check if framework exists
    const framework = await CompetencyFramework.findById(req.body.framework);
    if (!framework) {
      return res.status(404).json({ message: 'Framework not found' });
    }

    const newDefinition = await definition.save();
    
    // Add reference to the framework
    framework.competencyDefinitions.push(newDefinition._id);
    await framework.save();
    
    res.status(201).json(newDefinition);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a competency definition
router.patch('/:id', getDefinition, async (req, res) => {
  const updateFields = ['title', 'description', 'category', 'abbreviation', 'competencyGroup'];
  
  updateFields.forEach(field => {
    if (req.body[field] != null) {
      res.definition[field] = req.body[field];
    }
  });

  try {
    const updatedDefinition = await res.definition.save();
    res.json(updatedDefinition);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a competency definition
router.delete('/:id', getDefinition, async (req, res) => {
  try {
    // Get the framework to remove the reference
    const framework = await CompetencyFramework.findById(res.definition.framework);
    if (framework) {
      const index = framework.competencyDefinitions.indexOf(res.definition._id);
      if (index > -1) {
        framework.competencyDefinitions.splice(index, 1);
        await framework.save();
      }
    }

    await res.definition.remove();
    res.json({ message: 'Competency Definition deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get direct associations of a competency definition
router.get('/:id/direct-associations', getDefinition, async (req, res) => {
  try {
    const populatedDefinition = await CompetencyDefinition.findById(req.params.id)
      .populate('directAssociations');
    res.json(populatedDefinition.directAssociations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create direct association between competency definitions
router.post('/:id/direct-associations', getDefinition, async (req, res) => {
  try {
    const targetDefinition = await CompetencyDefinition.findById(req.body.targetDefinitionId);
    if (!targetDefinition) {
      return res.status(404).json({ message: 'Target definition not found' });
    }

    // Add to direct associations if not already there
    if (!res.definition.directAssociations.includes(targetDefinition._id)) {
      res.definition.directAssociations.push(targetDefinition._id);
      await res.definition.save();
    }

    res.status(201).json({ 
      message: 'Direct association created',
      source: res.definition._id,
      target: targetDefinition._id
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete direct association
router.delete('/:id/direct-associations/:targetId', getDefinition, async (req, res) => {
  try {
    const index = res.definition.directAssociations.indexOf(req.params.targetId);
    if (index > -1) {
      res.definition.directAssociations.splice(index, 1);
      await res.definition.save();
    }

    res.json({ message: 'Direct association removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting definition by ID
async function getDefinition(req, res, next) {
  let definition;
  try {
    definition = await CompetencyDefinition.findById(req.params.id);
    if (definition == null) {
      return res.status(404).json({ message: 'Cannot find competency definition' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.definition = definition;
  next();
}

module.exports = router; 