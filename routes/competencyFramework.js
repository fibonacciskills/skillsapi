const express = require('express');
const router = express.Router();
const CompetencyFramework = require('../models/CompetencyFramework');

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

// Delete a competency framework
router.delete('/:id', getFramework, async (req, res) => {
  try {
    await res.framework.remove();
    res.json({ message: 'Competency Framework deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
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