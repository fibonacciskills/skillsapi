const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Competency Framework API',
            version: '1.0.0',
            description: 'API for managing competency frameworks, definitions, and rubrics',
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                CompetencyFramework: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        version: { type: 'string' },
                        competencyDefinitions: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                },
                CompetencyDefinition: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string' },
                        abbreviation: { type: 'string' },
                        competencyGroup: { type: 'string' },
                        framework: { type: 'string' },
                        criteria: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                },
                RubricCriterion: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        levels: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                },
                RubricCriterionLevel: {
                    type: 'object',
                    properties: {
                        level: { type: 'number' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        examples: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 