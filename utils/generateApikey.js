const { v4: uuidv4 } = require("uuid");

const generateApiKey = () => uuidv4();

module.exports = generateApiKey;
