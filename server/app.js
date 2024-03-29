
//-------- app.js -------------------------------------------------------------------------------------------------------*/

require('./config/settings');
const express = require("express");
const fs = require('fs');
const urlencodedParser = express.urlencoded({extended: false});
const app = express();
module.exports.app = app;

// CORS
const cors = require('cors');
app.use(cors());

// swagger UI
const swaggerUI = require("swagger-ui-express");
const swaggerFile = JSON.parse(fs.readFileSync(PROJECT.ROOT + "/api/openapi.json"));
app.use('/api', swaggerUI.serve, swaggerUI.setup(swaggerFile));

// logging
require(PROJECT.ROOT + '/middleware/log/winston.js');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const morganMiddleware = require(PROJECT.ROOT + '/middleware/log/morgan.js');
app.use(morganMiddleware);
require(PROJECT.ROOT + '/middleware/log/morgan_body.js');

// static files storage
app.use("/public", express.static(PROJECT.ROOT + "/public"));

// routers
const Main__rout = require("./routs/main__rout.js");
app.use("/", urlencodedParser, Main__rout);

// #404. page not found
app.use((request, response) => response.status(404).send('<main style="text-align: center; margin: 30vh 0;"><h1>#404.Page not found</h1></main>'));
