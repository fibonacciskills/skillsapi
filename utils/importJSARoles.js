const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CompetencyFramework = require('../models/CompetencyFramework');
const CompetencyDefinition = require('../models/CompetencyDefinition');
const Rubric = require('../models/Rubric');
const RubricCriterion = require('../models/RubricCriterion');
const RubricCriterionLevel = require('../models/RubricCriterionLevel');
const ResourceAssociation = require('../models/ResourceAssociation');

// Load environment variables
require('dotenv').config();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/competency-framework', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

async function importJSARoles() {
    try {
        // Read the JSON file
        const jsonPath = path.join(__dirname, '../Job_Skills_Architecture-Job_Roles.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // Find the JSA Skills framework
        const skillsFramework = await CompetencyFramework.findOne({ name: 'Job Skills Architecture' });
        if (!skillsFramework) {
            throw new Error('Job Skills Architecture framework not found. Please import skills first.');
        }

        // Find or create the JSA Job Roles framework
        let framework = await CompetencyFramework.findOne({ name: 'JSA Job Roles' });
        if (!framework) {
            framework = new CompetencyFramework({
                name: 'JSA Job Roles',
                description: jsonData.CFDocument.description,
                version: '1.0.0',
                metadata: {
                    createdBy: 'JSA Import',
                    organization: 'Wellspring Workforce Frameworks'
                }
            });
            await framework.save();
        }

        // Process each work context item
        for (const item of jsonData.CFItems) {
            if (item.CFItemType === 'Work Context') {
                // Find matching skill in the JSA Skills framework
                const skill = await CompetencyDefinition.findOne({
                    framework: skillsFramework._id,
                    $or: [
                        { title: { $regex: new RegExp(item.abbreviatedStatement, 'i') } },
                        { description: { $regex: new RegExp(item.abbreviatedStatement, 'i') } }
                    ]
                });

                if (skill) {
                    // Create job role for this work context
                    let jobRole = await CompetencyDefinition.findOne({
                        framework: framework._id,
                        competencyGroup: item.humanCodingScheme.split('.')[0]
                    });

                    if (!jobRole) {
                        jobRole = new CompetencyDefinition({
                            title: `Job Role ${item.humanCodingScheme.split('.')[0]}`,
                            description: item.fullStatement,
                            type: 'job_role',
                            framework: framework._id,
                            category: item.CFItemType,
                            competencyGroup: item.humanCodingScheme.split('.')[0],
                            metadata: {
                                createdBy: 'JSA Import'
                            }
                        });
                        await jobRole.save();
                    }

                    // Create association between job role and skill
                    let association = await ResourceAssociation.findOne({
                        source: jobRole._id,
                        destination: skill._id
                    });

                    if (!association) {
                        association = new ResourceAssociation({
                            associationType: 'REQUIRES',
                            source: jobRole._id,
                            destination: skill._id,
                            framework: framework._id,
                            description: item.fullStatement,
                            weight: 1
                        });
                        await association.save();

                        // Add association reference to both job role and skill
                        if (!jobRole.resourceAssociations.includes(association._id)) {
                            jobRole.resourceAssociations.push(association._id);
                            await jobRole.save();
                        }
                        if (!skill.resourceAssociations.includes(association._id)) {
                            skill.resourceAssociations.push(association._id);
                            await skill.save();
                        }
                    }
                }
            }
        }

        console.log('JSA job roles and associations imported successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error importing JSA job roles:', error);
        process.exit(1);
    }
}

importJSARoles(); 