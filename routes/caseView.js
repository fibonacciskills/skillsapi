const express = require('express');
const router = express.Router();
const CompetencyDefinition = require('../models/CompetencyDefinition');
const CompetencyFramework = require('../models/CompetencyFramework');
const ResourceAssociation = require('../models/ResourceAssociation');
const Rubric = require('../models/Rubric');
const RubricCriterion = require('../models/RubricCriterion');
const RubricCriterionLevel = require('../models/RubricCriterionLevel');
const upload = require('../middleware/upload');

/**
 * Transform a CompetencyDefinition to CASE 1.1 CFItem format
 * @param {Object} definition - CompetencyDefinition document
 * @param {String} baseUrl - Base URL for API endpoints
 * @returns {Object} CASE CFItem object
 */
async function mapDefinitionToCFItem(definition, baseUrl) {
  const uri = `${baseUrl}/api/case/CFItems/${definition._id}`;
  
  // Process criteria and levels for inclusion in the extensions
  const criteriaWithLevels = definition.criteria?.map(criterion => {
    // If the criterion is already populated with its full object
    if (criterion._id && criterion.levels) {
      const expandedLevels = criterion.levels.map(level => {
        // If the level is already a populated object
        if (typeof level === 'object' && level._id) {
          return {
            identifier: level._id.toString(),
            level: level.level,
            name: level.name,
            description: level.description,
            examples: level.examples
          };
        }
        // If the level is just an ID reference
        return {
          identifier: level.toString(),
          reference: `${baseUrl}/api/levels/${level.toString()}`
        };
      });
      
      return {
        identifier: criterion._id.toString(),
        name: criterion.name,
        description: criterion.description,
        levels: expandedLevels,
        weight: criterion.weight
      };
    }
    // If the criterion is just an ID reference
    return {
      identifier: criterion.toString(),
      reference: `${baseUrl}/api/criteria/${criterion.toString()}`
    };
  });

  // Get associated job roles
  const associations = await ResourceAssociation.find({
    $or: [
      { destination: definition._id, associationType: 'REQUIRES' },
      { source: definition._id, associationType: 'REQUIRED_BY' }
    ]
  }).populate('source destination');

  const jobRoles = associations.map(assoc => {
    const role = assoc.associationType === 'REQUIRES' ? assoc.source : assoc.destination;
    return {
      identifier: role._id.toString(),
      uri: `${baseUrl}/api/case/CFItems/${role._id}`,
      title: role.title,
      description: assoc.description,
      weight: assoc.weight,
      associationType: assoc.associationType
    };
  });

  // Map competency type to CASE 1.1 types
  const typeMap = {
    'skill': 'Skill',
    'knowledge': 'Knowledge',
    'ability': 'Ability',
    'disposition': 'Disposition',
    'job_role': 'Job Role',
    'default': 'Competency'
  };

  const cfItemType = typeMap[definition.type?.toLowerCase()] || typeMap.default;
  const cfItemTypeUri = `http://purl.org/ctdl/terms/${cfItemType}`;

  return {
    identifier: definition._id.toString(),
    uri: uri,
    title: definition.title,
    fullStatement: definition.description,
    CFItemType: cfItemType,
    CFItemTypeURI: cfItemTypeUri,
    conceptKeywords: definition.keywords || [],
    educationLevel: definition.educationLevel || [],
    language: definition.language || 'en-US',
    license: definition.license || 'https://creativecommons.org/licenses/by/4.0/',
    status: definition.status || 'Active',
    lastChangeDateTime: definition.updatedAt || new Date().toISOString(),
    CFDocumentURI: `${baseUrl}/api/case/CFDocuments/${definition.framework}`,
    creators: definition.creators || ['System'],
    notes: definition.notes || '',
    extensions: {
      criteria: criteriaWithLevels || [],
      directAssociations: definition.directAssociations || [],
      resourceAssociations: definition.resourceAssociations || [],
      jobRoles: jobRoles
    }
  };
}

/**
 * Transform a CompetencyFramework to CASE 1.1 CFDocument format
 * @param {Object} framework - CompetencyFramework document
 * @param {String} baseUrl - Base URL for API endpoints
 * @returns {Object} CASE CFDocument object
 */
function mapFrameworkToCFDocument(framework, baseUrl) {
  const uri = `${baseUrl}/api/case/CFDocuments/${framework._id}`;
  
  return {
    identifier: framework._id.toString(),
    uri: uri,
    title: framework.name,
    description: framework.description,
    creator: framework.metadata.createdBy,
    publisher: framework.metadata.organization,
    CFPackageURI: `${baseUrl}/api/case/CFPackages/${framework._id}`,
    version: framework.version,
    lastChangeDateTime: framework.metadata.updatedAt,
    officialSourceURL: uri,
    // CASE 1.1 specific fields
    extensions: {
      competencyDefinitions: framework.competencyDefinitions,
      rubrics: framework.rubrics
    }
  };
}

/**
 * Get the base URL for the API
 * @param {Object} req - Express request object
 * @returns {String} Base URL
 */
function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

/**
 * @swagger
 * /api/case/CFItems:
 *   get:
 *     summary: Get all competency definitions in CASE 1.1 CFItem format
 *     tags: [CASE]
 *     responses:
 *       200:
 *         description: List of competency definitions in CASE 1.1 format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CFItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CFItem'
 *                 statusCode:
 *                   type: integer
 *                 statusMessage:
 *                   type: string
 *                 operationSuccessful:
 *                   type: boolean
 */
router.get('/CFItems', async (req, res) => {
  try {
    const definitions = await CompetencyDefinition.find()
      .populate({
        path: 'criteria',
        populate: {
          path: 'levels',
          model: 'RubricCriterionLevel'
        }
      })
      .populate('directAssociations')
      .populate('resourceAssociations');
    
    const baseUrl = getBaseUrl(req);
    
    const cfItems = definitions.map(def => mapDefinitionToCFItem(def, baseUrl));
    
    res.json({
      CFItems: cfItems,
      // Include CASE response format metadata
      statusCode: 200,
      statusMessage: "OK",
      operationSuccessful: true
    });
  } catch (err) {
    res.status(500).json({ 
      statusCode: 500,
      statusMessage: err.message,
      operationSuccessful: false
    });
  }
});

/**
 * @swagger
 * /api/case/CFItems/{id}:
 *   get:
 *     summary: Get a specific competency definition in CASE 1.1 CFItem format
 *     tags: [CASE]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The competency definition ID
 *     responses:
 *       200:
 *         description: Competency definition in CASE 1.1 format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CFItem'
 *       404:
 *         description: Competency definition not found
 */
router.get('/CFItems/:id', async (req, res) => {
  try {
    const definition = await CompetencyDefinition.findById(req.params.id)
      .populate('criteria')
      .populate('directAssociations')
      .populate('resourceAssociations');

    if (!definition) {
      return res.status(404).json({ error: 'Competency definition not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const cfItem = await mapDefinitionToCFItem(definition, baseUrl);
    res.json(cfItem);
  } catch (error) {
    console.error('Error fetching CFItem:', error);
    res.status(500).json({ error: 'Error fetching CFItem' });
  }
});

/**
 * @swagger
 * /api/case/CFDocuments:
 *   get:
 *     summary: Get all competency frameworks in CASE 1.1 CFDocument format
 *     tags: [CASE]
 *     responses:
 *       200:
 *         description: List of competency frameworks in CASE 1.1 format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CFDocuments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CFDocument'
 *                 statusCode:
 *                   type: integer
 *                 statusMessage:
 *                   type: string
 *                 operationSuccessful:
 *                   type: boolean
 */
router.get('/CFDocuments', async (req, res) => {
  try {
    const frameworks = await CompetencyFramework.find();
    const baseUrl = getBaseUrl(req);
    
    const cfDocuments = frameworks.map(framework => mapFrameworkToCFDocument(framework, baseUrl));
    
    res.json({
      CFDocuments: cfDocuments,
      statusCode: 200,
      statusMessage: "OK",
      operationSuccessful: true
    });
  } catch (err) {
    res.status(500).json({ 
      statusCode: 500,
      statusMessage: err.message,
      operationSuccessful: false
    });
  }
});

/**
 * @swagger
 * /api/case/CFDocuments/{id}:
 *   get:
 *     summary: Get a specific competency framework in CASE 1.1 CFDocument format
 *     tags: [CASE]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The competency framework ID
 *     responses:
 *       200:
 *         description: Competency framework in CASE 1.1 format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CFDocument'
 *       404:
 *         description: Competency framework not found
 */
router.get('/CFDocuments/:id', async (req, res) => {
  try {
    const framework = await CompetencyFramework.findById(req.params.id)
      .populate('competencyDefinitions')
      .populate('rubrics');
    
    if (!framework) {
      return res.status(404).json({
        statusCode: 404,
        statusMessage: "Competency framework not found",
        operationSuccessful: false
      });
    }
    
    const baseUrl = getBaseUrl(req);
    const cfDocument = mapFrameworkToCFDocument(framework, baseUrl);
    
    res.json(cfDocument);
  } catch (err) {
    res.status(500).json({ 
      statusCode: 500,
      statusMessage: err.message,
      operationSuccessful: false
    });
  }
});

/**
 * @swagger
 * /api/case/CFPackages/{id}:
 *   get:
 *     summary: Get a comprehensive package of a competency framework in CASE 1.1 format
 *     description: Returns a complete CASE 1.1 package including the framework, all its competency definitions, associations, and rubrics
 *     tags: [CASE]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The competency framework ID
 *     responses:
 *       200:
 *         description: Complete framework package in CASE 1.1 format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CFPackage'
 *       404:
 *         description: Framework not found
 */
router.get('/CFPackages/:id', async (req, res) => {
  try {
    const framework = await CompetencyFramework.findById(req.params.id)
      .populate({
        path: 'competencyDefinitions',
        populate: [
          { path: 'criteria' },
          { path: 'directAssociations' },
          { path: 'resourceAssociations' }
        ]
      })
      .populate({
        path: 'rubrics',
        populate: { 
          path: 'criteria',
          populate: { path: 'levels' }
        }
      });
    
    if (!framework) {
      return res.status(404).json({
        statusCode: 404,
        statusMessage: "Framework not found",
        operationSuccessful: false
      });
    }
    
    const baseUrl = getBaseUrl(req);
    
    // Get all associations
    const resourceAssociations = await ResourceAssociation.find({
      'source': { $in: framework.competencyDefinitions.map(def => def._id) }
    }).populate('source target');
    
    // Map to CASE model
    const cfDocument = mapFrameworkToCFDocument(framework, baseUrl);
    const cfItems = framework.competencyDefinitions.map(def => mapDefinitionToCFItem(def, baseUrl));
    
    // Map to CFAssociations
    const cfAssociations = resourceAssociations.map(assoc => {
      return {
        identifier: assoc._id.toString(),
        associationType: assoc.associationType,
        sourceNodeURI: `${baseUrl}/api/case/CFItems/${assoc.source._id}`,
        targetNodeURI: `${baseUrl}/api/case/CFItems/${assoc.target._id}`,
        CFDocumentURI: `${baseUrl}/api/case/CFDocuments/${framework._id}`,
        lastChangeDateTime: assoc.metadata?.updatedAt || new Date(),
        originNodeURI: `${baseUrl}/api/case/CFItems/${assoc.source._id}`
      };
    });
    
    // Map to CFRubrics
    const cfRubrics = framework.rubrics.map(rubric => {
      const cfRubricCriteria = rubric.criteria.map(criterion => {
        const cfRubricCriterionLevels = criterion.levels.map(level => {
          return {
            identifier: level._id.toString(),
            rubricCriterionId: criterion._id.toString(),
            level: level.level,
            description: level.description,
            quality: level.name,
            score: level.level,
            feedback: level.examples?.join('\n') || "",
            // Include the full examples array for better compatibility
            examples: level.examples || []
          };
        });
        
        return {
          identifier: criterion._id.toString(),
          rubricId: rubric._id.toString(),
          category: criterion.category || "Standard",
          description: criterion.description,
          name: criterion.name,
          CFItemURI: criterion.competencyDefinition 
            ? `${baseUrl}/api/case/CFItems/${criterion.competencyDefinition}` 
            : null,
          weight: criterion.weight || 1.0,
          position: criterion.order || 1,
          rubricCriterionLevels: cfRubricCriterionLevels
        };
      });
      
      return {
        identifier: rubric._id.toString(),
        title: rubric.name,
        description: rubric.description,
        CFDocumentURI: `${baseUrl}/api/case/CFDocuments/${framework._id}`,
        rubricCriteria: cfRubricCriteria
      };
    });
    
    // Aggregate into full CFPackage
    const cfPackage = {
      identifier: framework._id.toString(),
      uri: `${baseUrl}/api/case/CFPackages/${framework._id}`,
      creator: framework.metadata.createdBy,
      title: framework.name,
      lastChangeDateTime: framework.metadata.updatedAt,
      CFDocument: cfDocument,
      CFItems: cfItems,
      CFAssociations: cfAssociations,
      CFRubrics: cfRubrics,
      CFDefinitions: {
        CFConcepts: [],
        CFSubjects: [],
        CFLicenses: [],
        CFItemTypes: [],
        CFAssociationGroupings: []
      },
      extensions: {
        version: framework.version,
        organization: framework.metadata.organization
      }
    };
    
    res.json(cfPackage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      statusCode: 500,
      statusMessage: err.message,
      operationSuccessful: false
    });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileFormat = req.body.format || 'csv';
        let items = [];

        if (fileFormat === 'csv') {
            // Existing CSV processing
            const fileContent = req.file.buffer.toString('utf8');
            const rows = fileContent.split('\n').map(row => row.trim()).filter(row => row);
            const headers = rows[0].split(',').map(header => header.trim());
            
            items = rows.slice(1).map(row => {
                const values = row.split(',').map(value => value.trim());
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index];
                });
                return item;
            });
        } else if (fileFormat === 'case') {
            // CASE 1.1 JSON processing
            const jsonContent = JSON.parse(req.file.buffer.toString('utf8'));
            
            if (!jsonContent.CFDocument || !jsonContent.CFItems) {
                return res.status(400).json({ error: 'Invalid CASE 1.1 JSON format' });
            }

            items = jsonContent.CFItems.map(item => ({
                identifier: item.identifier,
                fullStatement: item.fullStatement,
                abbreviatedStatement: item.abbreviatedStatement || '',
                uri: item.uri || '',
                type: item.type || 'Competency',
                lastChangeDateTime: item.lastChangeDateTime || new Date().toISOString()
            }));
        }

        // Store items in session
        req.session.items = items;
        res.json({ success: true, count: items.length });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error processing file' });
    }
});

module.exports = router; 