const express = require('express');
const router = express.Router();
const RubricCriterion = require('../models/RubricCriterion');
const Rubric = require('../models/Rubric');
const CompetencyDefinition = require('../models/CompetencyDefinition');

// Get all rubric criteria
router.get('/', async (req, res) => {
  try {
    const criteria = await RubricCriterion.find();
    res.json(criteria);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one criterion by ID
router.get('/:id', getCriterion, (req, res) => {
  res.json(res.criterion);
});

// Create a rubric criterion
router.post('/', async (req, res) => {
  const criterion = new RubricCriterion({
    name: req.body.name,
    description: req.body.description,
    competencyDefinition: req.body.competencyDefinition,
    rubric: req.body.rubric,
    weight: req.body.weight || 1,
    metadata: {
      createdBy: req.body.createdBy
    }
  });

  try {
    // Check if rubric exists
    const rubric = await Rubric.findById(req.body.rubric);
    if (!rubric) {
      return res.status(404).json({ message: 'Rubric not found' });
    }

    // If competencyDefinition is specified, check if it exists
    if (req.body.competencyDefinition) {
      const definition = await CompetencyDefinition.findById(req.body.competencyDefinition);
      if (!definition) {
        return res.status(404).json({ message: 'Competency Definition not found' });
      }
    }

    const newCriterion = await criterion.save();
    
    // Add reference to the rubric
    rubric.criteria.push(newCriterion._id);
    await rubric.save();
    
    // If competencyDefinition is specified, add reference to it
    if (req.body.competencyDefinition) {
      const definition = await CompetencyDefinition.findById(req.body.competencyDefinition);
      definition.criteria.push(newCriterion._id);
      await definition.save();
    }
    
    res.status(201).json(newCriterion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a rubric criterion
router.patch('/:id', getCriterion, async (req, res) => {
  if (req.body.name != null) {
    res.criterion.name = req.body.name;
  }
  if (req.body.description != null) {
    res.criterion.description = req.body.description;
  }
  if (req.body.weight != null) {
    res.criterion.weight = req.body.weight;
  }

  try {
    const updatedCriterion = await res.criterion.save();
    res.json(updatedCriterion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a rubric criterion
router.delete('/:id', getCriterion, async (req, res) => {
  try {
    // Get the rubric to remove the reference
    const rubric = await Rubric.findById(res.criterion.rubric);
    if (rubric) {
      const index = rubric.criteria.indexOf(res.criterion._id);
      if (index > -1) {
        rubric.criteria.splice(index, 1);
        await rubric.save();
      }
    }

    // If associated with a competency definition, remove reference
    if (res.criterion.competencyDefinition) {
      const definition = await CompetencyDefinition.findById(res.criterion.competencyDefinition);
      if (definition) {
        const index = definition.criteria.indexOf(res.criterion._id);
        if (index > -1) {
          definition.criteria.splice(index, 1);
          await definition.save();
        }
      }
    }

    await res.criterion.remove();
    res.json({ message: 'Rubric Criterion deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all levels in a criterion
router.get('/:id/levels', getCriterion, async (req, res) => {
  try {
    const populatedCriterion = await RubricCriterion.findById(req.params.id)
      .populate('levels');
    res.json(populatedCriterion.levels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting criterion by ID
async function getCriterion(req, res, next) {
  let criterion;
  try {
    criterion = await RubricCriterion.findById(req.params.id);
    if (criterion == null) {
      return res.status(404).json({ message: 'Cannot find rubric criterion' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.criterion = criterion;
  next();
}

module.exports = router; 