require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const migrate = require('./db/migrate');
const seed = require('./db/seed');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/laboratories', require('./routes/laboratories.routes'));
app.use('/api/antibodies',   require('./routes/antibodies.routes'));
app.use('/api/experiments',  require('./routes/experiments.routes'));
app.use('/api/billing',      require('./routes/billing.routes'));
app.use('/api/repository',   require('./routes/repository.routes'));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

(async () => {
  await migrate();
  await seed();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
