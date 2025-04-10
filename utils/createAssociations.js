#!/usr/bin/env node

/**
 * Association Creation Utility for Competency Framework API
 * 
 * This script creates direct and indirect associations between competency definitions
 * in a specified framework.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const CompetencyFramework = require('../models/CompetencyFramework');
const CompetencyDefinition = require('../models/CompetencyDefinition');
const ResourceAssociation = require('../models/ResourceAssociation');

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
if (args.length < 1) {
  console.error('Usage: node createAssociations.js <frameworkId>');
  process.exit(1);
}

const frameworkId = args[0];

/**
 * Create direct associations between competencies in the same group
 */
async function createDirectAssociations(framework) {
  console.log('Creating direct associations...');
  
  try {
    // Get all definitions in the framework
    const definitions = await CompetencyDefinition.find({ framework: framework._id });
    console.log(`Found ${definitions.length} competency definitions`);
    
    // Group definitions by competencyGroup
    const definitionsByGroup = {};
    definitions.forEach(def => {
      if (!def.competencyGroup) return;
      
      if (!definitionsByGroup[def.competencyGroup]) {
        definitionsByGroup[def.competencyGroup] = [];
      }
      definitionsByGroup[def.competencyGroup].push(def);
    });
    
    // Create direct associations within each group
    let associationCount = 0;
    
    for (const group in definitionsByGroup) {
      const defsInGroup = definitionsByGroup[group];
      if (defsInGroup.length <= 1) continue;
      
      // For each definition, create a direct association with the next definition
      for (let i = 0; i < defsInGroup.length; i++) {
        const sourceDef = defsInGroup[i];
        const targetDef = defsInGroup[(i + 1) % defsInGroup.length]; // Circular association
        
        // Check if association already exists
        const hasAssociation = sourceDef.directAssociations.some(
          assoc => assoc.toString() === targetDef._id.toString()
        );
        
        if (!hasAssociation) {
          sourceDef.directAssociations.push(targetDef._id);
          await sourceDef.save();
          associationCount++;
          console.log(`Created direct association: ${sourceDef.title} -> ${targetDef.title}`);
        }
      }
    }
    
    console.log(`Created ${associationCount} direct associations`);
  } catch (error) {
    console.error('Error creating direct associations:', error);
  }
}

/**
 * Create indirect associations between competencies in different groups
 */
async function createIndirectAssociations(framework) {
  console.log('Creating indirect associations...');
  
  try {
    // Get all definitions in the framework
    const definitions = await CompetencyDefinition.find({ framework: framework._id });
    
    // Group definitions by competencyGroup
    const definitionsByGroup = {};
    definitions.forEach(def => {
      if (!def.competencyGroup) return;
      
      if (!definitionsByGroup[def.competencyGroup]) {
        definitionsByGroup[def.competencyGroup] = [];
      }
      definitionsByGroup[def.competencyGroup].push(def);
    });
    
    // Create indirect associations between groups
    const groups = Object.keys(definitionsByGroup);
    let associationCount = 0;
    
    if (groups.length <= 1) {
      console.log('Not enough groups to create indirect associations');
      return;
    }
    
    // For each pair of groups, create an indirect association between a random definition in each
    for (let i = 0; i < groups.length; i++) {
      const sourceGroup = groups[i];
      const targetGroup = groups[(i + 1) % groups.length]; // Circular association
      
      const sourceDefIndex = Math.floor(Math.random() * definitionsByGroup[sourceGroup].length);
      const targetDefIndex = Math.floor(Math.random() * definitionsByGroup[targetGroup].length);
      
      const sourceDef = definitionsByGroup[sourceGroup][sourceDefIndex];
      const targetDef = definitionsByGroup[targetGroup][targetDefIndex];
      
      // Check if resource association already exists
      const existingAssoc = await ResourceAssociation.findOne({
        source: sourceDef._id,
        destination: targetDef._id
      });
      
      if (!existingAssoc) {
        const association = new ResourceAssociation({
          associationType: 'INDIRECT_ASSOCIATION',
          source: sourceDef._id,
          destination: targetDef._id,
          description: `Relationship between ${sourceDef.title} and ${targetDef.title}`,
          framework: framework._id,
          weight: Math.floor(Math.random() * 5) + 1, // Random weight between 1-5
          metadata: {
            createdBy: 'Association Utility'
          }
        });
        
        await association.save();
        
        // Add reference to both source and destination
        sourceDef.resourceAssociations.push(association._id);
        targetDef.resourceAssociations.push(association._id);
        
        await sourceDef.save();
        await targetDef.save();
        
        associationCount++;
        console.log(`Created indirect association: ${sourceDef.title} -> ${targetDef.title}`);
      }
    }
    
    console.log(`Created ${associationCount} indirect associations`);
  } catch (error) {
    console.error('Error creating indirect associations:', error);
  }
}

async function main() {
  try {
    // Find the framework
    const framework = await CompetencyFramework.findById(frameworkId);
    if (!framework) {
      console.error(`Framework with ID ${frameworkId} not found`);
      process.exit(1);
    }
    
    console.log(`Working with framework: ${framework.name}`);
    
    // Create associations
    await createDirectAssociations(framework);
    await createIndirectAssociations(framework);
    
    console.log('Completed creating associations');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Run the main function
main(); 