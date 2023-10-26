
const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: results.rows });
    }

    catch (err) {
        return next(err);
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        const id = req.params.id;
        const results = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);

        if (results.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        const comp_code = results.rows[0].comp_code;
        const compResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [comp_code]);

        return res.json({ invoice: results.rows[0], company: compResults.rows[0] });

    } catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );
        return res.status(201).json({ invoice: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/:id", async function (req, res, next) {
    try {
        const { amt } = req.body;
        const id = req.params.id;
        const results = await db.query(
            `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404)
        }
        return res.json({ invoice: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        const id = req.params.id;
        const results = await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);
        if (results.rowCount === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }
        return res.json({ status: "deleted" });


    } catch (err) {
        return next(err);
    }
});


router.get('/companies/:code', async function (req, res, next) {
    try {
        const code = req.params.code;
        const results = await db.query(`SELECT * FROM invoices WHERE comp_code = $1`, [code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404);
        }
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});




module.exports = router;