# ERP IoT - Frontend Monorepo

A specialized ERP system for comprehensive IoT device management, developed as a modular monorepo for maximum scalability and team collaboration.

## Overview

This project is the **main frontend** of the ERP IoT system, designed to manage IoT devices at scale. It's built as a **modular monorepo** where multiple specialized teams work independently on different modules, maintaining code coherence and reusability.

### Main Objective
Develop a scalable web platform that enables:
- Centralized IoT device management
- Real-time data analytics
- Organization and project administration
- Security and access control
- IoT device swarm management

---

## Project Architecture

### Modular Structure
```
src/
├── shared/                   # Shared code across all modules
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Shared custom hooks
│   ├── services/              # Common APIs and services
│   ├── store/                 # Global state
│   ├── utils/                 # General utilities
│   └── types/                 # Common type definitions
├── modules/                  # Independent modules per team
│   ├── analytics/             # Analytics Team
│   ├── device-manager/        # Device Manager Team
│   ├── organizations/         # Organizations Team
│   ├── projects/              # Projects Team
│   ├── security/              # Security Team
│   └── swarm-manager/         # Swarm Manager Team
├── router/                   # Main routing configuration
├── App.jsx                   # Root component
└── main.jsx                  # Entry point
```

### Development Philosophy
- **High-Scale Scalability**: Each module can grow independently
- **Separation of Concerns**: Each team has complete domain over their module
- **Shared Code**: Maximum reusability without duplications
- **Parallel Development**: Multiple teams working simultaneously without conflicts

---

## Teams and Responsibilities

### **Analytics Team**
**Responsibilities:**
- Main dashboard with real-time metrics
- IoT device performance analysis
- Data reports and visualizations
- KPIs and automatic alerts

**Key Features:**
- Interactive dashboards
- Telemetry charts
- Predictive analytics
- Report exports

---

### **Device Manager Team**
**Responsibilities:**
- Individual IoT device management
- Configuration and parameterization
- Health and status monitoring
- OTA (Over The Air) updates

**Key Features:**
- Device inventory
- Remote configuration
- Real-time diagnostics
- Firmware management

---

### **Organizations Team**
**Responsibilities:**
- Organizational structure management
- User and role administration
- Permission configuration
- Multi-tenancy and data segregation

**Key Features:**
- Company/organization management
- Hierarchical structure
- User administration
- Organization-based access control

---

### **Projects Team**
**Responsibilities:**
- IoT project management
- Device assignment to projects
- Objective and KPI tracking
- Planning and resources

**Key Features:**
- Project creation and management
- Resource allocation
- Progress tracking
- Temporal planning

---

### **Security Team**
**Responsibilities:**
- Authentication and authorization
- Certificate and token management
- Security auditing and logs
- Access policies and compliance

**Key Features:**
- Authentication system
- Role and permission management
- Access auditing
- Security policies

---

### **Swarm Manager Team**
**Responsibilities:**
- Device group management (swarms)
- Coordination of related devices
- Mass deployments
- Group operation orchestration

**Key Features:**
- Swarm creation and management
- Mass operations
- Device coordination
- Group policies

---

## Technology Stack

### Frontend Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | `v20.12.2` | JavaScript runtime |
| **React** | `19.1.2` | UI library |
| **React Router** | `^6.x` | Navigation and routing |
| **Redux Toolkit** | `^2.x` | Global state management |

### Styling & UI
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | `^3.4.x` | Utility-first CSS framework |
| **Headless UI** | `^2.x` | Accessible components |
| **Heroicons** | `^2.x` | Iconography |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | `^5.x` | Build tool and dev server |
| **ESLint** | `^9.x` | Code linting |
| **Prettier** | `^3.x` | Code formatting |

### Testing (Coming Soon)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | `^1.x` | Testing framework |
| **Testing Library** | `^14.x` | React component testing |

---

## Quick Start

### Prerequisites
```bash
# Check versions
node --version  # Should be v20.12.2
npm --version   # v10.x.x recommended
```

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/erp-iot-frontend.git
cd erp-iot-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
# http://localhost:5173
```

### Available Scripts
```bash
# Development
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build

# Code quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting errors
npm run format       # Format code with Prettier

# Testing (coming soon)
npm run test         # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Test coverage
```

---

## Development Configuration

### Environment Variables
```bash
# .env.local
VITE_APP_TITLE="ERP IoT"
VITE_API_BASE_URL="http://localhost:8080/api"
VITE_WS_URL="ws://localhost:8080/ws"
VITE_ENVIRONMENT="development"
```

### Branch Structure
```
main                    # Main branch (production)
├── develop            # Development branch
├── feature/analytics  # Analytics team features
├── feature/devices    # Device Manager team features
├── feature/orgs       # Organizations team features
├── feature/projects   # Projects team features
├── feature/security   # Security team features
└── feature/swarm      # Swarm Manager team features
```

---

## Developer Guide

### Code Conventions
- **Components**: PascalCase (`DeviceCard.jsx`)
- **Hooks**: camelCase with "use" prefix (`useDeviceData.js`)
- **Services**: camelCase (`deviceService.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

### Workflow
1. **Create branch** from `develop`
2. **Develop** in your assigned module
3. **Follow** established modular structure
4. **Use shared/** for common code
5. **Create PR** towards `develop`
6. **Code review** by the team
7. **Merge** after approval

### Collaboration Rules
**Allowed:**
- Modify your module's code
- Use components from `shared/`
- Propose changes to `shared/` via PR

**Not allowed:**
- Directly modify other modules' code
- Duplicate code that should be in `shared/`
- Import internal files from other modules

---

## Backend Integration

### Microservices Architecture
Each frontend team consumes independent APIs:

```
Frontend Modules     ←→     Backend Services
├── analytics        ←→     analytics-service
├── device-manager   ←→     device-service
├── organizations    ←→     org-service
├── projects         ←→     project-service
├── security         ←→     auth-service
└── swarm-manager    ←→     swarm-service
```

### Service Communication
- **HTTP/REST**: For CRUD operations

---

## Contributing

### For New Developers
1. Read this README completely
3. Set up your development environment
4. Join your team's Slack channel
5. Request access to relevant backend repositories

### Reporting Issues
- Use provided issue templates
- Tag appropriately (bug, feature, enhancement)
- Assign to corresponding team

### Pull Requests
- Follow PR template
- Include tests (when available)
- Update documentation if necessary
- Request review from corresponding team

---

## Contact and Support

### Development Teams
- **Analytics**: 2022371156@uteq.edu.mx
- **Device Manager**: 
- **Organizations**: 
- **Projects**: 
- **Security**: 
- **Swarm Manager**: 2022371199@uteq.edu.mx

---

## License

This project is private property of IDGS10. All rights reserved.

---

**Ready to build the future of IoT?**

Welcome to the most ambitious IoT ERP development team in the market!