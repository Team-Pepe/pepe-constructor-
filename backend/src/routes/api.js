const express = require('express');
const router = require('./index');

const apiRouter = express.Router();

// Usar el router principal
apiRouter.use('/', router);

module.exports = apiRouter;