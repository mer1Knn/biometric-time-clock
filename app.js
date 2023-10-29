const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const swaggerSetup = require("./swagger");

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
swaggerSetup(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const employeeSchema = new mongoose.Schema({
  lastName: String,
  firstName: String,
  dateCreated: Date,
  department: String,
  checkIn: Date,
  checkOut: Date,
  timeElapsed: Number,
});

const Employee = mongoose.model("Employee", employeeSchema);

/**
 * @openapi
 * /add-employee:
 *   get:
 *     summary: View the employee creation form
 *     description: Render the 'add-employee.ejs' view.
 */
app.get("/add-employee", (req, res) => {
  res.render("add-employee"); // Render the 'add-employee.ejs' view
});

/**
 * @openapi
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     description: Create a new employee with the specified details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lastName:
 *                 type: string
 *               firstName:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
app.post("/employees", async (req, res) => {
  try {
    const { lastName, firstName, department } = req.body;
    const dateCreated = new Date();
    const employee = new Employee({
      lastName,
      firstName,
      dateCreated,
      department,
    });
    await employee.save();
    res.redirect("/employees"); // Redirect to the list of employees after creation
  } catch (error) {
    res.status(500).json({ error: "Unable to create employee" });
  }
});

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: Get a list of employees
 *     description: Get a list of all employees with an optional date filter.
 *     parameters:
 *       - in: query
 *         name: dateCreated
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter employees by date of creation (e.g., "2021-01-05").
 *     responses:
 *       200:
 *         description: A list of employees
 *       500:
 *         description: Internal server error
 */
app.get("/employees", async (req, res) => {
  try {
    const { dateCreated } = req.query;
    const query = dateCreated ? { dateCreated: new Date(dateCreated) } : {};
    const employees = await Employee.find(query);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch employees" });
  }
});

/**
 * @openapi
 * /check-in:
 *   get:
 *     summary: View the check-in form
 *     description: Render the 'checkin.ejs' view.
 */
app.get("/check-in", (req, res) => {
  res.render("checkin"); // Render the 'checkin.ejs' view
});

/**
 * @openapi
 * /check-in:
 *   post:
 *     summary: Check-in an employee
 *     description: Record an employee's check-in time and prevent duplicate check-ins.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: The ID of the employee.
 *               comment:
 *                 type: string
 *                 description: An optional comment.
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Bad request
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
app.post("/check-in", async (req, res) => {
  try {
    const { employeeId, comment } = req.body;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (employee.checkIn) {
      return res.status(400).json({ error: "Employee is already checked in" });
    }

    employee.checkIn = new Date();
    employee.checkOut = undefined;
    await employee.save();
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Unable to perform check-in" });
  }
});

/**
 * @openapi
 * /check-out:
 *   get:
 *     summary: View the check-out form
 *     description: Render the 'checkout.ejs' view.
 */
app.get("/check-out", (req, res) => {
  res.render("checkout"); // Render the 'checkout.ejs' view
});

/**
 * @openapi
 * /check-out:
 *   post:
 *     summary: Check-out an employee
 *     description: Record an employee's check-out time and calculate the elapsed time.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: The ID of the employee.
 *               comment:
 *                 type: string
 *                 description: An optional comment.
 *     responses:
 *       200:
 *         description: Check-out successful
 *       400:
 *         description: Bad request
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
app.post("/check-out", async (req, res) => {
  try {
    const { employeeId, comment } = req.body;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (!employee.checkIn) {
      return res.status(400).json({ error: "Employee has not checked in" });
    }

    employee.checkOut = new Date();
    const timeElapsed = Math.floor(employee.checkOut - employee.checkIn);
    employee.checkIn = undefined;
    employee.timeElapsed = timeElapsed;
    await employee.save();
    res.json({ timeElapsed, comment });
  } catch (error) {
    res.status(500).json({ error: "Unable to perform check-out" });
  }
});

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     summary: Get employee details by ID
 *     description: Get details of a specific employee by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the employee.
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
app.get("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
    } else {
      res.render("employee", { employee });
    }
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch employee details" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
module.exports = app;
