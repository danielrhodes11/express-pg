process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompanies;
beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('testla', 'TESLA', 'Maker of Cars.') RETURNING  code, name, description`);
    testCompanies = result.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("Get a list with one company", async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompanies] });

    });
});

describe("GET /companies/:code", () => {
    test("Get a single company", async () => {
        const res = await request(app).get(`/companies/${testCompanies.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: { ...testCompanies, invoices: [] } });
    });
    test("Responds with 404 if can't find company", async () => {
        const res = await request(app).get(`/companies/0`);
        expect(res.statusCode).toBe(404);
    });
});


describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app)
            .post('/companies')
            .send({ name: 'HOWDY', description: 'BIG SKY!' });

        expect(res.statusCode).toBe(201);

        expect(res.body).toEqual({
            company: {
                code: 'howdy', name: 'HOWDY', description: 'BIG SKY!'
            }
        });
    });
});



describe("PUT /companies/:code", () => {
    test("Updates an existing company", async () => {
        const res = await request(app).put(`/companies/${testCompanies.code}`).send({ code: 'testla', name: 'TESLAAAA', description: 'Maker of the batmobile.' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: { code: 'testla', name: 'TESLAAAA', description: 'Maker of the batmobile.' }
        });

    });
    test("Responds with 404 if can't find company", async () => {
        const res = await request(app).put(`/companies/0`);
        expect(res.statusCode).toBe(404);
    });

});


describe("DELETE /companies/:code", () => {
    test("Deletes an existing company", async () => {
        const res = await request(app).delete(`/companies/${testCompanies.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: "deleted" });
    });
    test("Responds with 404 if can't find company", async () => {
        const res = await request(app).delete(`/companies/0`);
        expect(res.statusCode).toBe(404);
    });
});