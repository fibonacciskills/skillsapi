# Competency Framework API Documentation

This document provides details on the available endpoints and their usage for the Competency Framework API.

## Base URL

```
http://localhost:8000/api
```

## Authentication

Authentication is not implemented in this version but would be added in a production environment.

## Data Models

### Competency Framework

The main container for a set of competency definitions and rubrics.

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "version": "string",
  "competencyDefinitions": ["string (CompetencyDefinition ID)"],
  "rubrics": ["string (Rubric ID)"],
  "metadata": {
    "createdAt": "date",
    "updatedAt": "date",
    "createdBy": "string",
    "organization": "string"
  }
}
```

### Competency Definition

Represents a specific competency within a framework.

```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "abbreviation": "string",
  "competencyGroup": "string",
  "framework": "string (CompetencyFramework ID)",
  "criteria": ["string (RubricCriterion ID)"],
  "directAssociations": ["string (CompetencyDefinition ID)"],
  "resourceAssociations": ["string (ResourceAssociation ID)"],
  "metadata": {
    "createdAt": "date",
    "updatedAt": "date",
    "createdBy": "string"
  }
}
```

### Resource Association

Represents an indirect association between competency definitions.

```json
{
  "_id": "string",
  "associationType": "INDIRECT_ASSOCIATION",
  "source": "string (CompetencyDefinition ID)",
  "destination": "string (CompetencyDefinition ID)",
  "description": "string",
  "framework": "string (CompetencyFramework ID)",
  "weight": "number",
  "metadata": {
    "createdAt": "date",
    "updatedAt": "date",
    "createdBy": "string"
  }
}
```

### Rubric

A collection of criteria for evaluating competencies.

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "framework": "string (CompetencyFramework ID)",
  "criteria": ["string (RubricCriterion ID)"],
  "metadata": {
    "createdAt": "date",
    "updatedAt": "date",
    "createdBy": "string"
  }
}
```

### Rubric Criterion

A specific evaluation criterion for a competency.

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "competencyDefinition": "string (CompetencyDefinition ID)",
  "rubric": "string (Rubric ID)",
  "levels": ["string (RubricCriterionLevel ID)"],
  "weight": "number",
  "metadata": {
    "createdAt": "date",
    "updatedAt": "date",
    "createdBy": "string"
  }
}
```

### Rubric Criterion Level

A specific level within a criterion for evaluating competency proficiency.

```json
{
  "_id": "string",
  "level": "number",
  "name": "string",
  "description": "string",
  "criterion": "string (RubricCriterion ID)",
  "examples": ["string"],
  "metadata": {
    "createdAt": "date",
    "updatedAt": "date",
    "createdBy": "string"
  }
}
```

## API Endpoints

### Competency Frameworks

#### Get All Frameworks

```
GET /frameworks
```

Returns all competency frameworks.

#### Get Framework by ID

```
GET /frameworks/:id
```

Returns a specific competency framework by ID.

#### Create Framework

```
POST /frameworks
```

Request Body:
```json
{
  "name": "string (required)",
  "description": "string",
  "version": "string (required)",
  "createdBy": "string",
  "organization": "string"
}
```

#### Update Framework

```
PATCH /frameworks/:id
```

Request Body:
```json
{
  "name": "string",
  "description": "string",
  "version": "string",
  "organization": "string"
}
```

#### Delete Framework

```
DELETE /frameworks/:id
```

#### Get All Definitions in a Framework

```
GET /frameworks/:id/definitions
```

#### Get All Rubrics in a Framework

```
GET /frameworks/:id/rubrics
```

### Competency Definitions

#### Get All Definitions

```
GET /definitions
```

#### Get Definition by ID

```
GET /definitions/:id
```

#### Create Definition

```
POST /definitions
```

Request Body:
```json
{
  "title": "string (required)",
  "description": "string",
  "category": "string",
  "abbreviation": "string",
  "competencyGroup": "string",
  "framework": "string (required, CompetencyFramework ID)",
  "createdBy": "string"
}
```

#### Update Definition

```
PATCH /definitions/:id
```

Request Body:
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "abbreviation": "string",
  "competencyGroup": "string"
}
```

#### Delete Definition

```
DELETE /definitions/:id
```

#### Get Direct Associations

```
GET /definitions/:id/direct-associations
```

#### Create Direct Association

```
POST /definitions/:id/direct-associations
```

Request Body:
```json
{
  "targetDefinitionId": "string (required, CompetencyDefinition ID)"
}
```

#### Delete Direct Association

```
DELETE /definitions/:id/direct-associations/:targetId
```

### Resource Associations

#### Get All Associations

```
GET /associations
```

#### Get Associations by Framework

```
GET /associations/framework/:frameworkId
```

#### Get Association by ID

```
GET /associations/:id
```

#### Create Association

```
POST /associations
```

Request Body:
```json
{
  "source": "string (required, CompetencyDefinition ID)",
  "destination": "string (required, CompetencyDefinition ID)",
  "description": "string",
  "framework": "string (CompetencyFramework ID)",
  "weight": "number",
  "createdBy": "string"
}
```

#### Update Association

```
PATCH /associations/:id
```

Request Body:
```json
{
  "description": "string",
  "weight": "number"
}
```

#### Delete Association

```
DELETE /associations/:id
```

### Rubrics

#### Get All Rubrics

```
GET /rubrics
```

#### Get Rubric by ID

```
GET /rubrics/:id
```

#### Create Rubric

```
POST /rubrics
```

Request Body:
```json
{
  "name": "string (required)",
  "description": "string",
  "framework": "string (required, CompetencyFramework ID)",
  "createdBy": "string"
}
```

#### Update Rubric

```
PATCH /rubrics/:id
```

Request Body:
```json
{
  "name": "string",
  "description": "string"
}
```

#### Delete Rubric

```
DELETE /rubrics/:id
```

#### Get All Criteria in a Rubric

```
GET /rubrics/:id/criteria
```

### Rubric Criteria

#### Get All Criteria

```
GET /criteria
```

#### Get Criterion by ID

```
GET /criteria/:id
```

#### Create Criterion

```
POST /criteria
```

Request Body:
```json
{
  "name": "string (required)",
  "description": "string",
  "competencyDefinition": "string (CompetencyDefinition ID)",
  "rubric": "string (required, Rubric ID)",
  "weight": "number",
  "createdBy": "string"
}
```

#### Update Criterion

```
PATCH /criteria/:id
```

Request Body:
```json
{
  "name": "string",
  "description": "string",
  "weight": "number"
}
```

#### Delete Criterion

```
DELETE /criteria/:id
```

#### Get All Levels in a Criterion

```
GET /criteria/:id/levels
```

### Rubric Criterion Levels

#### Get All Levels

```
GET /levels
```

#### Get Level by ID

```
GET /levels/:id
```

#### Create Level

```
POST /levels
```

Request Body:
```json
{
  "level": "number (required)",
  "name": "string",
  "description": "string (required)",
  "criterion": "string (required, RubricCriterion ID)",
  "examples": ["string"],
  "createdBy": "string"
}
```

#### Update Level

```
PATCH /levels/:id
```

Request Body:
```json
{
  "name": "string",
  "description": "string",
  "examples": ["string"]
}
```

#### Delete Level

```
DELETE /levels/:id
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Server Error

Error responses include a message field explaining the error. 