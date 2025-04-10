#!/usr/bin/env node

/**
 * CSV Import Utility for Competency Framework API
 * 
 * This script imports competency definitions from a CSV file into the database.
 * It expects a CSV with the following structure (similar to testskills.csv):
 * - competency group
 * - abbreviation
 * - title
 * - category
 * - description
 * - level_1
 * - level_2
 * - level_3
 * - level_4
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const CompetencyFramework = require('../models/CompetencyFramework');
const CompetencyDefinition = require('../models/CompetencyDefinition');
const Rubric = require('../models/Rubric');
const RubricCriterion = require('../models/RubricCriterion');
const RubricCriterionLevel = require('../models/RubricCriterionLevel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/competency-framework', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Could not connect to MongoDB', err);
  process.exit(1);
});

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node importCSV.js <csvFilePath> <frameworkName> [frameworkDescription] [version]');
  process.exit(1);
}

const csvFilePath = args[0];
const frameworkName = args[1];
const frameworkDescription = args[2] || `Imported from ${path.basename(csvFilePath)}`;
const frameworkVersion = args[3] || '1.0.0';

async function importData() {
  try {
    // Create or find the framework
    let framework = await CompetencyFramework.findOne({ name: frameworkName });
    
    if (!framework) {
      console.log(`Creating new framework: ${frameworkName}`);
      framework = new CompetencyFramework({
        name: frameworkName,
        description: frameworkDescription,
        version: frameworkVersion,
        metadata: {
          createdBy: 'CSV Import',
          organization: 'System'
        }
      });
      await framework.save();
    } else {
      console.log(`Using existing framework: ${frameworkName}`);
    }

    // Create a standard rubric for the framework
    let rubric = await Rubric.findOne({ 
      framework: framework._id,
      name: 'Standard Proficiency Levels'
    });

    if (!rubric) {
      console.log('Creating standard rubric for proficiency levels');
      rubric = new Rubric({
        name: 'Standard Proficiency Levels',
        description: 'Standard proficiency levels for competency evaluation',
        framework: framework._id,
        metadata: {
          createdBy: 'CSV Import'
        }
      });
      await rubric.save();

      // Add reference to the framework
      framework.rubrics.push(rubric._id);
      await framework.save();
    }

    // Process CSV file
    const results = [];
    let processedCount = 0;

    fs.createReadStream(csvFilePath)
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
            console.log(`Creating competency: ${title}`);
            definition = new CompetencyDefinition({
              title,
              description,
              category,
              abbreviation,
              competencyGroup,
              framework: framework._id,
              metadata: {
                createdBy: 'CSV Import'
              }
            });
            await definition.save();

            // Add reference to the framework
            framework.competencyDefinitions.push(definition._id);
            await framework.save();
          } else {
            console.log(`Updating competency: ${title}`);
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
            console.log(`Creating criterion for: ${title}`);
            criterion = new RubricCriterion({
              name: `${title} Proficiency`,
              description: `Proficiency levels for ${title}`,
              competencyDefinition: definition._id,
              rubric: rubric._id,
              metadata: {
                createdBy: 'CSV Import'
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
                console.log(`Creating level ${i} for: ${title}`);
                level = new RubricCriterionLevel({
                  level: i,
                  name: `Level ${i}`,
                  description: levelDescription,
                  criterion: criterion._id,
                  metadata: {
                    createdBy: 'CSV Import'
                  }
                });
                await level.save();

                // Add reference to the criterion
                criterion.levels.push(level._id);
                await criterion.save();
              } else {
                console.log(`Updating level ${i} for: ${title}`);
                level.description = levelDescription;
                await level.save();
              }
            }
          }

          processedCount++;
        }

        console.log(`Successfully processed ${processedCount} competency definitions`);
        mongoose.disconnect();
      });

  } catch (error) {
    console.error('Error importing data:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Run the import
importData(); 