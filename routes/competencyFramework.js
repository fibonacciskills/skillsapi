const express = require('express');
const router = express.Router();
const CompetencyFramework = require('../models/CompetencyFramework');
const CompetencyDefinition = require('../models/CompetencyDefinition');
const Rubric = require('../models/Rubric');
const RubricCriterion = require('../models/RubricCriterion');
const RubricCriterionLevel = require('../models/RubricCriterionLevel');
const ResourceAssociation = require('../models/ResourceAssociation');

// Get all competency frameworks
router.get('/', async (req, res) => {
  try {
    const frameworks = await CompetencyFramework.find();
    res.json(frameworks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one competency framework by ID
router.get('/:id', getFramework, (req, res) => {
  res.json(res.framework);
});

// Create a competency framework
router.post('/', async (req, res) => {
  const framework = new CompetencyFramework({
    name: req.body.name,
    description: req.body.description,
    version: req.body.version,
    metadata: {
      createdBy: req.body.createdBy,
      organization: req.body.organization
    }
  });

  try {
    const newFramework = await framework.save();
    res.status(201).json(newFramework);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a competency framework
router.patch('/:id', getFramework, async (req, res) => {
  if (req.body.name != null) {
    res.framework.name = req.body.name;
  }
  if (req.body.description != null) {
    res.framework.description = req.body.description;
  }
  if (req.body.version != null) {
    res.framework.version = req.body.version;
  }
  if (req.body.organization != null) {
    res.framework.metadata.organization = req.body.organization;
  }

  try {
    const updatedFramework = await res.framework.save();
    res.json(updatedFramework);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a framework and all its associated data
router.delete('/:id', async (req, res) => {
    try {
        const frameworkId = req.params.id;

        // Delete all associated competency definitions
        await CompetencyDefinition.deleteMany({ framework: frameworkId });

        // Delete all associated rubrics
        const rubrics = await Rubric.find({ framework: frameworkId });
        for (const rubric of rubrics) {
            // Delete all criteria for this rubric
            await RubricCriterion.deleteMany({ rubric: rubric._id });
            
            // Delete all criterion levels for this rubric
            await RubricCriterionLevel.deleteMany({ rubric: rubric._id });
            
            // Delete the rubric itself
            await Rubric.findByIdAndDelete(rubric._id);
        }

        // Delete all resource associations
        await ResourceAssociation.deleteMany({ framework: frameworkId });

        // Finally, delete the framework itself
        await CompetencyFramework.findByIdAndDelete(frameworkId);

        res.status(200).json({ message: 'Framework and all associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting framework:', error);
        res.status(500).json({ message: 'Error deleting framework', error: error.message });
    }
});

// Get all competency definitions in a framework
router.get('/:id/definitions', getFramework, async (req, res) => {
  try {
    const populatedFramework = await CompetencyFramework.findById(req.params.id)
      .populate('competencyDefinitions');
    res.json(populatedFramework.competencyDefinitions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all rubrics in a framework
router.get('/:id/rubrics', getFramework, async (req, res) => {
  try {
    const populatedFramework = await CompetencyFramework.findById(req.params.id)
      .populate('rubrics');
    res.json(populatedFramework.rubrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting framework by ID
async function getFramework(req, res, next) {
  let framework;
  try {
    framework = await CompetencyFramework.findById(req.params.id);
    if (framework == null) {
      return res.status(404).json({ message: 'Cannot find framework' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.framework = framework;
  next();
}

module.exports = router; 