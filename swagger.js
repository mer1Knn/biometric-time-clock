const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Biometric Time Clock API",
      version: "1.0.0",
      description: "API for managing biometric time clock",
      contact: {
        name: "Merouane Kanoune",
        email: "kanounemerouane@gmail.com",
      },
    },
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
