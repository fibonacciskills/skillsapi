const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CompetencyFramework = require('../models/CompetencyFramework');
const CompetencyDefinition = require('../models/CompetencyDefinition');
const Rubric = require('../models/Rubric');
const RubricCriterion = require('../models/RubricCriterion');
const RubricCriterionLevel = require('../models/RubricCriterionLevel');

// Load environment variables
require('dotenv').config();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/competency-framework', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

async function importJSASkills() {
    try {
        // Read the JSON file
        const jsonPath = path.join(__dirname, '../Job _Skills_Architecture-Skills.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // Find or create the JSA framework
        let framework = await CompetencyFramework.findOne({ name: 'Job Skills Architecture' });
        if (!framework) {
            framework = new CompetencyFramework({
                name: 'Job Skills Architecture',
                description: jsonData.CFDocument.title,
                version: '1.0.0',
                metadata: {
                    createdBy: 'JSA Import',
                    organization: 'Wellspring Workforce Frameworks'
                }
            });
            await framework.save();
        }

        // Create a rubric for the framework
        let rubric = await Rubric.findOne({ 
            framework: framework._id,
            name: 'JSA Proficiency Levels'
        });

        if (!rubric) {
            rubric = new Rubric({
                name: 'JSA Proficiency Levels',
                description: 'Proficiency levels for JSA skills',
                framework: framework._id,
                metadata: {
                    createdBy: 'JSA Import'
                }
            });
            await rubric.save();

            // Add reference to the framework
            framework.rubrics.push(rubric._id);
            await framework.save();
        }

        // Process skills and proficiency levels
        const skills = jsonData.CFItems.filter(item => item.CFItemType === 'Skill');
        const categories = jsonData.CFItems.filter(item => item.CFItemType === 'Skill Category');
        const levels = jsonData.CFItems.filter(item => item.CFItemType === 'Proficiency Level');

        for (const skill of skills) {
            // Find the category for this skill
            const category = categories.find(cat => 
                skill.humanCodingScheme.startsWith(cat.humanCodingScheme)
            );

            // Create or update the competency definition
            let definition = await CompetencyDefinition.findOne({
                title: skill.fullStatement,
                framework: framework._id
            });

            if (!definition) {
                definition = new CompetencyDefinition({
                    title: skill.fullStatement,
                    description: skill.fullStatement,
                    type: 'skill',
                    framework: framework._id,
                    category: category ? category.fullStatement : 'Uncategorized',
                    competencyGroup: category ? category.fullStatement : 'Uncategorized',
                    keywords: skill.keywords || [],
                    educationLevel: skill.educationLevel || [],
                    language: 'en-US',
                    license: 'https://creativecommons.org/licenses/by/4.0/',
                    status: 'Active',
                    creators: ['JSA Import'],
                    notes: skill.notes || '',
                    metadata: {
                        createdBy: 'JSA Import'
                    }
                });
                await definition.save();

                // Add reference to the framework
                framework.competencyDefinitions.push(definition._id);
                await framework.save();
            }

            // Create criterion for this competency
            let criterion = await RubricCriterion.findOne({
                rubric: rubric._id,
                competencyDefinition: definition._id
            });

            if (!criterion) {
                criterion = new RubricCriterion({
                    name: `${skill.fullStatement} Proficiency`,
                    description: `Proficiency levels for ${skill.fullStatement}`,
                    competencyDefinition: definition._id,
                    rubric: rubric._id,
                    metadata: {
                        createdBy: 'JSA Import'
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
            const skillLevels = levels.filter(level => 
                level.humanCodingScheme.startsWith(skill.humanCodingScheme)
            );

            for (const level of skillLevels) {
                const levelNumber = parseInt(level.humanCodingScheme.split('-')[0]);
                
                let levelDoc = await RubricCriterionLevel.findOne({
                    criterion: criterion._id,
                    level: levelNumber
                });

                if (!levelDoc) {
                    levelDoc = new RubricCriterionLevel({
                        level: levelNumber,
                        name: level.humanCodingScheme,
                        description: level.fullStatement,
                        criterion: criterion._id,
                        metadata: {
                            createdBy: 'JSA Import'
                        }
                    });
                    await levelDoc.save();

                    // Add reference to the criterion
                    criterion.levels.push(levelDoc._id);
                    await criterion.save();
                }
            }
        }

        console.log('JSA skills imported successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error importing JSA skills:', error);
        process.exit(1);
    }
}

importJSASkills(); 