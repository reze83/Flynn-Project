/**
 * Architecture Skills - API design patterns
 */

import type { Skill } from "../types.js";

export const apiDesign: Skill = {
  id: "api-design",
  name: "API Design Patterns",
  description:
    "REST API design, GraphQL patterns, OpenAPI specification, versioning strategies, and error handling.",
  category: "architecture",
  triggers: [
    "api",
    "rest",
    "graphql",
    "openapi",
    "swagger",
    "endpoint",
    "http",
    "versioning",
    "pagination",
  ],
  tier1TokenEstimate: 45,
  tier2TokenEstimate: 2200,
  instructions: `# API Design Patterns

## REST API Design

### URL Structure
\`\`\`
# Resource-oriented URLs
GET    /users              # List users
POST   /users              # Create user
GET    /users/{id}         # Get user
PUT    /users/{id}         # Update user (full)
PATCH  /users/{id}         # Update user (partial)
DELETE /users/{id}         # Delete user

# Nested resources
GET    /users/{id}/posts   # User's posts
POST   /users/{id}/posts   # Create post for user

# Query parameters for filtering
GET    /users?role=admin&status=active
GET    /posts?author=123&published=true

# Pagination
GET    /users?page=2&limit=20
GET    /users?cursor=abc123&limit=20
\`\`\`

### HTTP Status Codes
\`\`\`
2xx Success:
  200 OK              - Successful GET, PUT, PATCH
  201 Created         - Successful POST
  204 No Content      - Successful DELETE

4xx Client Errors:
  400 Bad Request     - Invalid input
  401 Unauthorized    - Not authenticated
  403 Forbidden       - Not authorized
  404 Not Found       - Resource doesn't exist
  409 Conflict        - Resource conflict
  422 Unprocessable   - Validation failed

5xx Server Errors:
  500 Internal Error  - Server error
  502 Bad Gateway     - Upstream error
  503 Unavailable     - Service down
\`\`\`

### Error Response Format
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_abc123"
  }
}
\`\`\`

### Pagination Patterns

#### Offset-based
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
\`\`\`

#### Cursor-based (recommended)
\`\`\`json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIzfQ",
    "hasMore": true
  }
}
\`\`\`

## Versioning Strategies

### URL Versioning
\`\`\`
/api/v1/users
/api/v2/users
\`\`\`

### Header Versioning
\`\`\`
Accept: application/vnd.api+json; version=2
\`\`\`

### Query Parameter
\`\`\`
/api/users?version=2
\`\`\`

## OpenAPI Specification

### Basic Structure
\`\`\`yaml
openapi: 3.1.0
info:
  title: User API
  version: 1.0.0
  description: API for managing users

servers:
  - url: https://api.example.com/v1
    description: Production

paths:
  /users:
    get:
      summary: List users
      operationId: listUsers
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'

components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
\`\`\`

## GraphQL Patterns

### Schema Design
\`\`\`graphql
type Query {
  user(id: ID!): User
  users(first: Int, after: String): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
}

type User {
  id: ID!
  email: String!
  name: String
  posts(first: Int): PostConnection!
}

# Relay-style pagination
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

# Input types
input CreateUserInput {
  email: String!
  name: String
}

# Payload types (for mutations)
type CreateUserPayload {
  user: User
  errors: [Error!]
}
\`\`\`

### Best Practices
- Use connections for pagination (Relay spec)
- Return payloads with potential errors
- Use input types for mutations
- Implement DataLoader for N+1 prevention`,
  resources: ["https://swagger.io/specification/", "https://graphql.org/learn/best-practices/"],
};

export const ARCHITECTURE_SKILLS: Record<string, Skill> = {
  "api-design": apiDesign,
};
