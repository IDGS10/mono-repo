const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


const errorHandler = require('./middleware/errorHandler');
const organizationRoutes = require('./routes/organizations');
const invitationRoutes = require('./routes/invitations');
const projectRoutes = require('./routes/projects');
const projectApprovalRoutes = require('./routes/projectApprovalRoutes');


const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'organizations-module'
  });
});

app.use('/api/organizations', organizationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-approvals', projectApprovalRoutes);


app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl 
  });
}); 

app.use(errorHandler);

module.exports = app;