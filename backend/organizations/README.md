# Organizations Module - IoT Ecosystem

The Organizations Module is a central component of the IoT ecosystem that manages organizations, user invitations, and project approvals. This module acts as a coordination point between user and project modules, facilitating organizational management and approval workflows.

# Key Features

Organization Management: Create, update, and manage organizations
Invitation System: Invite users to organizations with specific roles
Project Approval: Receive and manage project approval requests
RESTful API: Endpoints for integration with other modules
JWT Authentication: Token-based authentication system
Email Notifications: Automatic notification system
Data Validation: Robust validation with Joi

# Technologies Used

Node.js with Express.js
PostgreSQL as database
JWT for authentication
Nodemailer for email sending
Joi for data validation
Multer for file handling
Helmet and CORS for security

# Project Structure
```.
└── backend/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── utils/
    ├── package.json
    └── server.js
```

# Setup and Installation
1. Prerequisites

- Node.js
- PostgreSQL
- npm or yarn

2. Installation
# Navigate to project directory
cd organizations-module/backend

# Install dependencies
npm install

3. Environment Variables Configuration
Create a .env file in the project root:
```
# Server Configuration
NODE_ENV=development
PORT=3001

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=port
DB_NAME=database name
DB_USER=username
DB_PASSWORD=password
DB_SSL=false

# JWT
JWT_SECRET=super_secure_jwt_secret
JWT_EXPIRES_IN=24h

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email@gmail.com
EMAIL_PASSWORD=app_password
EMAIL_FROM=noreply@iot-ecosystem.com

# Frontend URL
FRONTEND_URL=http://localhost:5173 || production url

# Projects Module URL (for notifications)
PROJECTS_MODULE_URL=http://localhost:3002 ||
```
4. Database
Execute database migrations to create the necessary tables:
```
-- Organization types table
CREATE TABLE organization_types (
    id_type SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE organizations (
    id_organization SERIAL PRIMARY KEY,
    organization_uuid UUID DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_type_id INTEGER NOT NULL REFERENCES organization_types(id_type),
    organization_email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    logo_url VARCHAR(500),
    owner_id INTEGER NOT NULL,
    created_by_id INTEGER,
    modified_by_id INTEGER,
    isActive BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User invitations table
CREATE TABLE user_invitations (
    id_invitation SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id_organization),
    invited_email VARCHAR(255) NOT NULL,
    invited_name VARCHAR(255) NOT NULL,
    invited_role VARCHAR(50) NOT NULL CHECK (invited_role IN ('líder', 'encargado')),
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Project approvals table
CREATE TABLE project_approvals (
    temporal_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id_organization),
    temporal_project_id VARCHAR(255) NOT NULL,
    project_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    real_project_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
5. Run the Application
# install modules
```
npm install

# Development mode
npm run dev

# Production mode
npm start
```

# API Endpoints
Organizations
Public Endpoints
```
GET /api/organizations/active - Get active organizations
GET /api/organizations/:id/basic - Basic organization information
POST /api/organizations/auth/test-token - Generate test token
```
Authenticated Endpoints
```
GET /api/organizations/dashboard - Owner dashboard
GET /api/organizations/types - Organization types
POST /api/organizations - Create organization (owners only)
GET /api/organizations/:id - Get organization by ID
PUT /api/organizations/:id - Update organization
PATCH /api/organizations/:id/status - Change organization status
```
Invitations
Public Endpoints
```
GET /api/invitations/verify/:token - Verify invitation token
POST /api/invitations/accept/:token - Accept invitation
```
Authenticated Endpoints
```
POST /api/invitations - Create invitation (owners only)
GET /api/invitations/organization/:orgId - Invitations by organization
GET /api/invitations/:id - Get invitation by ID
POST /api/invitations/:id/resend - Resend invitation
PATCH /api/invitations/:id/revoke - Revoke invitation
DELETE /api/invitations/:id - Delete invitation
```
Projects and Approvals
Endpoint for Projects Module
```
POST /api/projects/approval-request - Create approval request
```
Authenticated Endpoints
```
GET /api/projects/pending/:orgId - Pending projects by organization
GET /api/projects/details/:temporalId - Project details
POST /api/projects/approve/:temporalId - Approve project
POST /api/projects/reject/:temporalId - Reject project
GET /api/projects/history/:orgId - Approval history
GET /api/projects/search/:orgId - Search projects
```
## Integration with Other Modules
Integration with Users Module
Invitation Acceptance Flow

Send Invitation: Organization owner sends an invitation
Verification: User receives an email and verifies token at:
```
GET /api/invitations/verify/:token
```
Acceptance: User accepts invitation at:
```
POST /api/invitations/accept/:token
```
Notification to Users Module: When an invitation is accepted, the users module should:

Create user with invitation data
Assign corresponding role and organization
Update invitation status to 'accepted'

Data Sent to Users Module
```
{
  "email": "user@email.com",
  "name": "User Name",
  "role": "líder|encargado",
  "organization_id": 123,
  "organization_name": "Organization Name",
  "invited_by": 456
}
```
Integration with Projects Module
Project Approval Flow

Approval Request: Projects module sends a request:
POST /api/projects/approval-request
Content-Type: application/json
```
{
  "organization_id": 123,
  "id": "temporal_project_id",
  "name": "Project Name",
  "description": "Description",
  "location": "Location",
  "startDate": "2025-01-01",
  "userId": 456,
  "budget": 50000,
  "duration": "6 months",
  "sensors": ["sensor1", "sensor2"]
}
```
Review: Organization owner reviews and approves/rejects
Approval Notification: Module sends notification to projects module:
POST {PROJECTS_MODULE_URL}/api/projects/create-approved
Content-Type: application/json
```
{
  "temporal_project_id": "temporal_id",
  "organization_id": 123,
  "status": "approved",
  "reviewed_by": 789,
  "review_notes": "Optional comments",
  "approved_at": "2025-01-01T12:00:00Z",
  "project_data": { /* complete project data */ }
}
```
Rejection Notification:
POST {PROJECTS_MODULE_URL}/api/projects/notify-rejection
Content-Type: application/json
```
{
  "temporal_project_id": "temporal_id",
  "organization_id": 123,
  "status": "rejected",
  "reviewed_by": 789,
  "review_notes": "Rejection reasons",
  "rejected_at": "2025-01-01T12:00:00Z"
}
```
## Required Configuration
The projects module must configure the environment variable:
PROJECTS_MODULE_URL=http://localhost:3002

## Get Organization ID
Other modules can obtain active organization information:
```
GET /api/organizations/active
```
Response:
```
{
  "organizations": [
    {
      "id_organization": 123,
      "organization_uuid": "uuid-string",
      "name": "Organization Name",
      "organization_type": "Type"
    }
  ]
}
```
For basic information of a specific organization:
```
GET /api/organizations/{id}/basic
```
# Authentication
JWT Token
All protected endpoints require a JWT token in the header:
httpAuthorization: Bearer your_jwt_token
Token Structure
```
{
  "id": 123,
  "name": "User",
  "email": "user@email.com",
  "role": "propietario|líder|encargado"
}
```
Generate Test Token
For development, you can generate a test token:
```
POST /api/organizations/auth/test-token
```
Roles and Permissions

- Propietario (Owner): Can create organizations, send invitations, approve projects
- Líder (Leader): Access to management functionalities (defined by users module)
- Encargado (Manager): Basic access (defined by users module)

Email Notifications
The system automatically sends emails for:

- Invitations: When an invitation is sent to a user
- Approvals: When a project is approved or rejected

```
SMTP Configuration
envEMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=app_password
```
Support
For technical support or questions, contact the IoT Ecosystem development team.

Version: 1.0.0

Last updated: August 2025








