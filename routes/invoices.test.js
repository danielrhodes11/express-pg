/// Test invoices routes
process.env.NODE_ENV = 'test';

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;
const testCompany = { code: 'testla', name: 'TESLA', description: 'Maker of Cars.' };

beforeEach(async () => {
    // Insert the test company into the database
    await db.query(
        `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)`,
        [testCompany.code, testCompany.name, testCompany.description]
    );

    // Insert the test invoice using the test company's code
    const result = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ($1, $2, $3, $4) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [testCompany.code, 100, false, null]
    );

    testInvoice = result.rows[0];
});

afterEach(async () => {
    // Delete the test invoice using the ID
    await db.query(`DELETE FROM invoices WHERE id = $1`, [testInvoice.id]);

    // Delete the test company using the code
    await db.query(`DELETE FROM companies WHERE code = $1`, [testCompany.code]);
});

afterAll(async () => {
    await db.end();
});


describe("GET /invoices", () => {
    test("Get a list with one invoice", async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        const id = testInvoice.id;
        const comp_code = testInvoice.comp_code;
        expect(res.body).toEqual({ invoices: [{ id, comp_code }] });
    });
});

describe("GET /invoices/:id", () => {
    test("Get a single invoice", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        const formattedTestInvoice = {
            ...testInvoice,
            add_date: testInvoice.add_date.toISOString(),
        };
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: formattedTestInvoice, company: testCompany });
    });
    test("Responds with 404 if can't find invoice", async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app)
            .post('/invoices')
            .send({ comp_code: testCompany.code, amt: 100 });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: testCompany.code,
                amt: 100,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });
});

describe("PUT /invoices/:id", () => {
    test("Updates an existing invoice", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 200 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: testCompany.code,
                amt: 200,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });
    test("Responds with 404 if can't find invoice", async () => {
        const res = await request(app).put(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /invoices/:id", () => {
    test("Deletes an existing invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: "deleted" });
    });
    test("Responds with 404 if can't find invoice", async () => {
        const res = await request(app).delete(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("GET invoices/companies/:code", () => {
    test("Get a list of invoices for a single company", async () => {
        const res = await request(app).get(`/invoices/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        const formattedTestInvoice = {
            ...testInvoice,
            add_date: testInvoice.add_date.toISOString(),
        };
        expect(res.body).toEqual({ invoices: [formattedTestInvoice] });
    });
});