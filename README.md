# Competency Framework API

A RESTful API server built on Node.js and Express for managing competency frameworks based on the provided data schema.

## Overview

This API provides functionality to manage competency frameworks, definitions, resource associations, rubrics, rubric criteria, and criterion levels. It implements the relationships shown in the competency framework schema, including direct and indirect associations between competency definitions.
https://somup.com/cTf6rpsuGT



## Features

- Create, read, update, and delete competency frameworks
- Manage competency definitions within frameworks
- Create direct associations between competency definitions
- Establish indirect associations via resource associations
- Define rubrics for competencies with weighted criteria
- Set up multiple proficiency levels for each criterion
- Attempting to implement an API based off of the data model but flexible to work with CASE 1.1 too. 
Source: https://opensource.ieee.org/scd/scd/-/tree/main/resources?ref_type=heads
View frameworks and skills
- ![Screenshot 2025-04-11 at 8 10 50 AM](https://github.com/user-attachments/assets/2d143ee9-fe22-4ad9-8596-963e8c197c60)
  JSON view to see the endpoints from the UI 
![Screenshot 2025-04-11 at 8 10 59 AM](https://github.com/user-attachments/assets/557cf824-885f-4f4b-888c-a27fa5f3a1b5)
Swagger Page
![Screenshot 2025-04-11 at 8 11 15 AM](https://github.com/user-attachments/assets/03b547e3-8479-4c65-ac45-b0b6598f79f2)


## Requirements

- Node.js >= 14.0.0
- MongoDB >= 4.4

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd competency-framework-api
```

2. Install dependencies:
```
npm install
```

3. Make sure MongoDB is running locally or update the connection string in `apiserver` to point to your MongoDB instance.

## Usage

1. Start the server:
```
npm start
```

2. For development with auto-restart:
```
npm run dev
```

3. The API will be available at http://localhost:8000/api

## API Documentation

See the [API Documentation](docs/API_DOCUMENTATION.md) for a complete list of endpoints and usage examples.

## Data Model

The API is built around the following core entities:

### Competency Framework
A container for a collection of competencies and rubrics.

### Competency Definition
A specific competency within a framework. It can have direct associations with other competency definitions and indirect associations through resource associations.

### Resource Association
Represents an indirect relationship between two competency definitions.

### Rubric
A collection of criteria for evaluating competencies.

### Rubric Criterion
A specific evaluation criterion within a rubric, which may be linked to a competency definition.

### Rubric Criterion Level
A level of proficiency for a specific criterion, with description and examples.

## Architecture

The server is built with a modular architecture:

- **Models**: MongoDB schemas defining the data structure using Mongoose
- **Routes**: Express routes handling API requests
- **Middleware**: Functions for common operations like finding resources by ID

### Relationships

The API manages several key relationships:

1. **Framework to Definition**: One-to-many relationship between frameworks and competency definitions
2. **Direct Associations**: Many-to-many relationships between competency definitions
3. **Indirect Associations**: Relationships between competency definitions through resource associations
4. **Framework to Rubric**: One-to-many relationship between frameworks and rubrics
5. **Rubric to Criterion**: One-to-many relationship between rubrics and criteria
6. **Criterion to Level**: One-to-many relationship between criteria and levels

## Security

This implementation focuses on the API functionality. For production use, consider adding:

- Authentication
- Authorization
- Input validation
- Rate limiting
- HTTPS

## License

[MIT](LICENSE) 
