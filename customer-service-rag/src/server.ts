import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from './swagger';
import searchRouter from './routes/search';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerOptions.definition));

// Routes
app.use('/', searchRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
}); 