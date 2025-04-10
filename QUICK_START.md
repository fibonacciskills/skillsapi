# Quick Start Guide

This guide will help you get up and running with the Competency Framework API quickly.

## Prerequisites

- Node.js 14+
- MongoDB 4.4+

## Setup

1. Clone the repository and navigate to the project directory.

2. Install dependencies:
```bash
npm install
```

3. Copy the sample environment file:
```bash
cp .env.sample .env
```

4. Start MongoDB (if not already running):
```bash
# Using local MongoDB
mongod

# OR using Docker
docker run -d -p 27017:27017 --name mongodb mongo:4.4
```

5. Start the server:
```bash
npm start
```

6. The API should now be available at http://localhost:8000/api

## Importing Sample Data

The API comes with a utility to import competency data from CSV files:

```bash
# Format: npm run import <csv-file> <framework-name> [description] [version]
npm run import testskills.csv "Accounting Skills Framework" "Accounting competency framework" "1.0.0"
```

Once the import is complete, you can use the MongoDB ID of the framework to create associations between competencies:

```bash
# Get the framework ID first
curl http://localhost:8000/api/frameworks

# Then create associations using the framework ID
npm run create-associations <framework-id>
```

## Using the API

Here are some examples of how to use the API with curl:

### Get All Frameworks

```bash
curl http://localhost:8000/api/frameworks
```

### Create a New Framework

```bash
curl -X POST http://localhost:8000/api/frameworks \
  -H "Content-Type: application/json" \
  -d '{"name": "Digital Skills Framework", "description": "Framework for digital competencies", "version": "1.0.0"}'
```

### Get All Competency Definitions in a Framework

```bash
curl http://localhost:8000/api/frameworks/<framework-id>/definitions
```

### Create a Direct Association Between Two Competencies

```bash
curl -X POST http://localhost:8000/api/definitions/<definition-id>/direct-associations \
  -H "Content-Type: application/json" \
  -d '{"targetDefinitionId": "<target-definition-id>"}'
```

### Create an Indirect Association (Resource Association)

```bash
curl -X POST http://localhost:8000/api/associations \
  -H "Content-Type: application/json" \
  -d '{
    "source": "<source-definition-id>",
    "destination": "<destination-definition-id>",
    "description": "These competencies are related",
    "framework": "<framework-id>",
    "weight": 3
  }'
```

## Next Steps

1. Check out the full [API Documentation](docs/API_DOCUMENTATION.md) for more details on all available endpoints.

2. For a production deployment, make sure to:
   - Configure authentication
   - Set up proper error monitoring
   - Implement input validation
   - Ensure data backups
   - Consider using a MongoDB Atlas cluster or other managed database service

3. Explore the code to understand the data models and relationships: 