const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("./app");
const expect = chai.expect;

chai.use(chaiHttp);

describe("Employee Routes", () => {
  let testEmployeeId;

  describe("/add-employee", () => {
    it("should render the employee creation form", (done) => {
      chai
        .request(app)
        .get("/add-employee")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.include("Create Employee");
          done();
        });
    });
  });

  describe("/employees", () => {
    it("should get a list of employees", (done) => {
      chai
        .request(app)
        .get("/employees")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          done();
        });
    });

    it("should create a new employee", (done) => {
      const employeeData = {
        lastName: "Doe",
        firstName: "John",
        department: "HR",
      };

      chai
        .request(app)
        .post("/employees")
        .send(employeeData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("lastName", employeeData.lastName);
          expect(res.body).to.have.property(
            "firstName",
            employeeData.firstName
          );
          expect(res.body).to.have.property(
            "department",
            employeeData.department
          );
          testEmployeeId = res.body._id;
          done();
        });
    });

    it("should get employees with date filter", (done) => {
      chai
        .request(app)
        .get("/employees?dateCreated=2023-01-05")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          done();
        });
    });
  });

  describe("/check-in", () => {
    it("should render the check-in form", (done) => {
      chai
        .request(app)
        .get("/check-in")
        .end((err, res) => {
          expect(res).to.havestatus(200);
          expect(res.text).to.include("Check-in");
          done();
        });
    });

    it("should check in an employee", (done) => {
      const checkInData = {
        employeeId: testEmployeeId,
        comment: "Checked in successfully",
      };

      chai
        .request(app)
        .post("/check-in")
        .send(checkInData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("checkIn");
          done();
        });
    });

    it("should handle checking in an already checked-in employee", (done) => {
      const checkInData = {
        employeeId: testEmployeeId,
        comment: "Checked in again",
      };

      chai
        .request(app)
        .post("/check-in")
        .send(checkInData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property(
            "error",
            "Employee is already checked in"
          );
          done();
        });
    });
  });

  describe("/check-out", () => {
    it("should render the check-out form", (done) => {
      chai
        .request(app)
        .get("/check-out")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.include("Check-out");
          done();
        });
    });

    it("should check out an employee", (done) => {
      const checkOutData = {
        employeeId: testEmployeeId,
        comment: "Checked out successfully",
      };

      chai
        .request(app)
        .post("/check-out")
        .send(checkOutData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("timeElapsed");
          done();
        });
    });

    it("should handle checking out an employee that has not checked in", (done) => {
      const checkOutData = {
        employeeId: "nonexistent-employee-id",
        comment: "Attempt to check out",
      };

      chai
        .request(app)
        .post("/check-out")
        .send(checkOutData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property(
            "error",
            "Employee has not checked in"
          );
          done();
        });
    });
  });

  describe("/employees/:id", () => {
    it("should get employee details by ID", (done) => {
      chai
        .request(app)
        .get(`/employees/${testEmployeeId}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.include("Employee Details");
          done();
        });
    });

    it("should handle getting details of a nonexistent employee", (done) => {
      const nonexistentEmployeeId = "nonexistent-employee-id";
      chai
        .request(app)
        .get(`/employees/${nonexistentEmployeeId}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("error", "Employee not found");
          done();
        });
    });
  });
});
