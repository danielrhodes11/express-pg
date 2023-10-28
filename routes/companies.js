const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT code, name FROM companies`);
        return res.json({ companies: results.rows });
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:code", async function (req, res, next) {
    try {
        let code = req.params.code;
        const compResults = await db.query(
            `SELECT code, name, description FROM companies WHERE code = $1`, [code]);

        if (compResults.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        }
        const company = compResults.rows[0];
        return res.json({ company: company });
    } catch (err) {
        return next(err);
    }
});


router.post("/", async function (req, res, next) {
    try {
        let { code, name, description } = req.body;
        const result = await db.query(
            `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
            [code, name, description]
        );
        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/:code", async function (req, res, next) {
    try {
        let { code, name, description } = req.body;
        const result = await db.query(
            `UPDATE companies SET name=$2, description=$3 WHERE code=$1 RETURNING code, name, description`,
            [code, name, description]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        }
        return res.json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:code", async function (req, res, next) {
    try {
        let code = req.params.code;
        const result = await db.query(
            `DELETE FROM companies WHERE code = $1 RETURNING code`,
            [code]
        );
        if (result.rowCount === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});





module.exports = router;