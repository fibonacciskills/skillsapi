const express = require('express');
const router = express.Router();
const RubricCriterionLevel = require('../models/RubricCriterionLevel');
const RubricCriterion = require('../models/RubricCriterion');

// Get all rubric criterion levels
router.get('/', async (req, res) => {
  try {
    const levels = await RubricCriterionLevel.find();
    res.json(levels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one level by ID
router.get('/:id', getLevel, (req, res) => {
  res.json(res.level);
});

// Create a rubric criterion level
router.post('/', async (req, res) => {
  const level = new RubricCriterionLevel({
    level: req.body.level,
    name: req.body.name,
    description: req.body.description,
    criterion: req.body.criterion,
    examples: req.body.examples || [],
    metadata: {
      createdBy: req.body.createdBy
    }
  });

  try {
    // Check if criterion exists
    const criterion = await RubricCriterion.findById(req.body.criterion);
    if (!criterion) {
      return res.status(404).json({ message: 'Rubric Criterion not found' });
    }

    const newLevel = await level.save();
    
    // Add reference to the criterion
    criterion.levels.push(newLevel._id);
    await criterion.save();
    
    res.status(201).json(newLevel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a rubric criterion level
router.patch('/:id', getLevel, async (req, res) => {
  const updateFields = ['name', 'description', 'examples'];
  
  updateFields.forEach(field => {
    if (req.body[field] != null) {
      res.level[field] = req.body[field];
    }
  });

  try {
    const updatedLevel = await res.level.save();
    res.json(updatedLevel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a rubric criterion level
router.delete('/:id', getLevel, async (req, res) => {
  try {
    // Get the criterion to remove the reference
    const criterion = await RubricCriterion.findById(res.level.criterion);
    if (criterion) {
      const index = criterion.levels.indexOf(res.level._id);
      if (index > -1) {
        criterion.levels.splice(index, 1);
        await criterion.save();
      }
    }

    await res.level.remove();
    res.json({ message: 'Rubric Criterion Level deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting level by ID
async function getLevel(req, res, next) {
  let level;
  try {
    level = await RubricCriterionLevel.findById(req.params.id);
    if (level == null) {
      return res.status(404).json({ message: 'Cannot find rubric criterion level' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.level = level;
  next();
}

module.exports = router; 