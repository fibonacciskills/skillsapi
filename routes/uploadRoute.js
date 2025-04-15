const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const CompetencyFramework = require('../models/CompetencyFramework');
const CompetencyDefinition = require('../models/CompetencyDefinition');
const Rubric = require('../models/Rubric');
const RubricCriterion = require('../models/RubricCriterion');
const RubricCriterionLevel = require('../models/RubricCriterionLevel');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload CSV and create framework
router.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { frameworkName, frameworkDescription, frameworkVersion } = req.body;

    if (!frameworkName || !frameworkVersion) {
        return res.status(400).json({ message: 'Framework name and version are required' });
    }

    try {
        // Create the framework
        const framework = new CompetencyFramework({
            name: frameworkName,
            description: frameworkDescription || '',
            version: frameworkVersion,
            metadata: {
                createdBy: 'Web UI'
            }
        });
        await framework.save();

        // Create a rubric for the framework
        const rubric = new Rubric({
            name: `${frameworkName} Rubric`,
            description: `Rubric for ${frameworkName}`,
            framework: framework._id,
            metadata: {
                createdBy: 'Web UI'
            }
        });
        await rubric.save();

        // Add rubric to framework
        framework.rubrics.push(rubric._id);
        await framework.save();

        const results = [];

        // Parse the CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Found ${results.length} competency definitions in CSV`);
                
                let processedCount = 0;
                
                for (const row of results) {
                    // Check if required fields exist
                    if (!row.title && !row['title']) {
                        console.warn('Skipping row - missing title field');
                        continue;
                    }

                    const title = row.title || row['title'];
                    const abbreviation = row.abbreviation || row['abbreviation'] || '';
                    const competencyGroup = row['competency group'] || row.competencyGroup || '';
                    const category = row.category || '';
                    const description = row.description || '';

                    // Check if competency definition already exists
                    let definition = await CompetencyDefinition.findOne({
                        title: title,
                        framework: framework._id
                    });

                    if (!definition) {
                        definition = new CompetencyDefinition({
                            title,
                            description,
                            category,
                            abbreviation,
                            competencyGroup,
                            framework: framework._id,
                            metadata: {
                                createdBy: 'Web UI'
                            }
                        });
                        await definition.save();

                        // Add reference to the framework
                        framework.competencyDefinitions.push(definition._id);
                        await framework.save();
                    } else {
                        definition.description = description;
                        definition.category = category;
                        definition.abbreviation = abbreviation;
                        definition.competencyGroup = competencyGroup;
                        await definition.save();
                    }

                    // Create criterion for this competency
                    let criterion = await RubricCriterion.findOne({
                        rubric: rubric._id,
                        competencyDefinition: definition._id
                    });

                    if (!criterion) {
                        criterion = new RubricCriterion({
                            name: `${title} Proficiency`,
                            description: `Proficiency levels for ${title}`,
                            competencyDefinition: definition._id,
                            rubric: rubric._id,
                            metadata: {
                                createdBy: 'Web UI'
                            }
                        });
                        await criterion.save();

                        // Add reference to the rubric
                        rubric.criteria.push(criterion._id);
                        await rubric.save();

                        // Add reference to the competency definition
                        definition.criteria.push(criterion._id);
                        await definition.save();
                    }

                    // Create levels for this criterion
                    for (let i = 1; i <= 4; i++) {
                        const levelField = `level_${i}`;
                        const levelDescription = row[levelField];
                        
                        if (levelDescription) {
                            // Check if level already exists
                            let level = await RubricCriterionLevel.findOne({
                                criterion: criterion._id,
                                level: i
                            });

                            if (!level) {
                                level = new RubricCriterionLevel({
                                    level: i,
                                    name: `Level ${i}`,
                                    description: levelDescription,
                                    criterion: criterion._id,
                                    metadata: {
                                        createdBy: 'Web UI'
                                    }
                                });
                                await level.save();

                                // Add reference to the criterion
                                criterion.levels.push(level._id);
                                await criterion.save();
                            } else {
                                level.description = levelDescription;
                                await level.save();
                            }
                        }
                    }

                    processedCount++;
                }

                // Clean up the uploaded file
                fs.unlinkSync(req.file.path);

                res.status(201).json({
                    message: 'Framework created successfully',
                    framework: framework._id,
                    processedCount
                });
            });
    } catch (error) {
        console.error('Error creating framework:', error);
        res.status(500).json({ message: 'Error creating framework', error: error.message });
    }
});

// Upload competencies to existing framework
router.post('/upload-competencies/:frameworkId', upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Find the framework
        const framework = await CompetencyFramework.findById(req.params.frameworkId);
        if (!framework) {
            return res.status(404).json({ message: 'Framework not found' });
        }

        const results = [];
        let processedCount = 0;

        // Parse the CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Found ${results.length} competency definitions in CSV`);
                
                for (const row of results) {
                    // Check if required fields exist
                    if (!row.title && !row['title']) {
                        console.warn('Skipping row - missing title field');
                        continue;
                    }

                    const title = row.title || row['title'];
                    const abbreviation = row.abbreviation || row['abbreviation'] || '';
                    const competencyGroup = row['competency group'] || row.competencyGroup || '';
                    const category = row.category || '';
                    const description = row.description || '';

                    // Check if competency definition already exists
                    let definition = await CompetencyDefinition.findOne({
                        title: title,
                        framework: framework._id
                    });

                    if (!definition) {
                        definition = new CompetencyDefinition({
                            title,
                            description,
                            category,
                            abbreviation,
                            competencyGroup,
                            framework: framework._id,
                            metadata: {
                                createdBy: 'Web UI'
                            }
                        });
                        await definition.save();

                        // Add reference to the framework
                        framework.competencyDefinitions.push(definition._id);
                        await framework.save();
                    } else {
                        definition.description = description;
                        definition.category = category;
                        definition.abbreviation = abbreviation;
                        definition.competencyGroup = competencyGroup;
                        await definition.save();
                    }

                    processedCount++;
                }

                // Clean up the uploaded file
                fs.unlinkSync(req.file.path);

                res.status(201).json({
                    message: 'Competencies added successfully',
                    processedCount
                });
            });
    } catch (error) {
        console.error('Error adding competencies:', error);
        res.status(500).json({ message: 'Error adding competencies', error: error.message });
    }
});

module.exports = router; 