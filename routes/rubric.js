const express = require('express');
const router = express.Router();
const Rubric = require('../models/Rubric');
const CompetencyFramework = require('../models/CompetencyFramework');

// Get all rubrics
router.get('/', async (req, res) => {
  try {
    const rubrics = await Rubric.find();
    res.json(rubrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one rubric by ID
router.get('/:id', getRubric, (req, res) => {
  res.json(res.rubric);
});

// Create a rubric
router.post('/', async (req, res) => {
  const rubric = new Rubric({
    name: req.body.name,
    description: req.body.description,
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

    const newRubric = await rubric.save();
    
    // Add reference to the framework
    framework.rubrics.push(newRubric._id);
    await framework.save();
    
    res.status(201).json(newRubric);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a rubric
router.patch('/:id', getRubric, async (req, res) => {
  if (req.body.name != null) {
    res.rubric.name = req.body.name;
  }
  if (req.body.description != null) {
    res.rubric.description = req.body.description;
  }

  try {
    const updatedRubric = await res.rubric.save();
    res.json(updatedRubric);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a rubric
router.delete('/:id', getRubric, async (req, res) => {
  try {
    // Get the framework to remove the reference
    const framework = await CompetencyFramework.findById(res.rubric.framework);
    if (framework) {
      const index = framework.rubrics.indexOf(res.rubric._id);
      if (index > -1) {
        framework.rubrics.splice(index, 1);
        await framework.save();
      }
    }

    await res.rubric.remove();
    res.json({ message: 'Rubric deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all criteria in a rubric
router.get('/:id/criteria', getRubric, async (req, res) => {
  try {
    const populatedRubric = await Rubric.findById(req.params.id)
      .populate('criteria');
    res.json(populatedRubric.criteria);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting rubric by ID
async function getRubric(req, res, next) {
  let rubric;
  try {
    rubric = await Rubric.findById(req.params.id);
    if (rubric == null) {
      return res.status(404).json({ message: 'Cannot find rubric' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.rubric = rubric;
  next();
}

module.exports = router; 