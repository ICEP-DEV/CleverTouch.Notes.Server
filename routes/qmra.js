const express = require('express');
const connection = require("../config/config");
const router = express.Router();


const calculateExponentialForCryptosporidium = (r, count) => {
    // Implement the exponential calculation for Cryptosporidium parvum

    const calculatedResult = 1 - Math.pow(2.71828, -r * count);
    return calculatedResult;
};

const calculateExponentialForGiardia = (k, count) => {
    // Implement the exponential calculation for Giardia lambia 
    const calculatedResult = 1 - Math.pow(2.71828, -k * count);
    return calculatedResult;
};

function calculateBetaPoisson(alpha, beta, count) {
    // Perform the Beta-Poisson calculation here
    const calculatedResult = (1 - (1 + (count / beta)) ** - alpha);
    // console.log(calculatedResult)
    return calculatedResult;
};

const calculateEntamoebaColi = (alpha, nFifty, count) => {
    // Perform the Entamoeba Coli calculation here
    const calculatedResult = 1 - (1 + (count / nFifty) * (Math.pow(2, (1 / alpha)) - 1));
    return calculatedResult;
};

const calculateProbabiltyInfection = (probInfect, numofExposure) => {
    // Perform the calculation for Pi here
    const calculatedResult = 1 - Math.pow((1 - probInfect), -numofExposure);
    if (calculatedResult <= 0) {
        //No feacal contamination
    } else if (calculatedResult >= 1) {
        //action plan 
    }
    return calculatedResult;
};

router.post('/add_indicator_qmra', (req, res) => {
    let is_customize_Pathogen = req.body.is_customize_Pathogen;
    let pathogen = req.body.organism;
    let n50 = req.body.n50;
    let constant = req.body.constant;
    let alpha = req.body.alpha;
    let beta = req.body.beta;
    let totalQmra = 0;
    var samplingId = req.body.samplingId;
    let best_fit_model = req.body.best_fit_model

    let indicator = req.body.indicator;
    let ratio = req.body.ratio;
    let count_indicator = req.body.count_indicator;
    let estimated_count = req.body.estimated_count;
    let is_customized = req.body.is_customizedIndicator;

    switch (pathogen.toLocaleLowerCase()) {
        case 'Campylobacter jejuni'.toLocaleLowerCase():
            totalQmra = calculateBetaPoisson(alpha, beta, count_indicator)
            break;
        case 'E.coli 0157:H7'.toLocaleLowerCase():
            totalQmra = calculateBetaPoisson(alpha, beta, count_indicator)
            break;
        case 'Salmonella typhi'.toLocaleLowerCase():
            totalQmra = calculateBetaPoisson(alpha, beta, count_indicator)
            break;
        case 'S.Flexneri'.toLocaleLowerCase():
            totalQmra = calculateBetaPoisson(alpha, beta, count_indicator)
            break;
        case 'Vibrio Cholera'.toLocaleLowerCase():
            totalQmra = calculateBetaPoisson(alpha, beta, count_indicator)
            break;
        case 'Entamoeba coli'.toLocaleLowerCase():
            totalQmra = calculateEntamoebaColi(alpha, n50, count_indicator)
            break;
        case 'Giardia lambia'.toLocaleLowerCase():
            totalQmra = calculateExponentialForGiardia(constant, count_indicator)
            break;
    }

    var duration_type = req.body.duration_type;
    //var probability = (1 - (1 - totalQmra)) ** (-durationType)
    var likeliOfInfection = null
    // prepare insetion of FIB indicatore
    var fibIndicatorBody = [indicator, ratio, count_indicator, estimated_count, is_customized, samplingId]
    var fib_sql = `INSERT INTO fib_indicator(indicator,ratio,count_indicator,estimated_count,is_customized,samplingId)
                VALUES(?,?,?,?,?,?)`;

    connection.query(fib_sql, fibIndicatorBody, (err, results) => {
        if (err) {
            return res.status(200).send("Failed to load data!" + err);
        }
        else {
            console.log(results)
            if (results.affectedRows > 0) {
                var indicator_id = results.insertId
                // Prepare insertion of QMRA
                var qmra_body = [pathogen, best_fit_model, alpha, beta, constant, n50, totalQmra, likeliOfInfection, duration_type, is_customize_Pathogen, indicator_id]
                var qmra_sql = `INSERT INTO qmra(pathogen,best_fit_model,alpha,beta,constant,n50,probability_of_infection,likelihood_of_infection,duration_type,is_customized,indicator_id)
                                VALUES(?,?,?,?,?,?,?,?,?,?,?)`
                connection.query(qmra_sql, qmra_body, (error, row) => {
                    console.log('third test')

                    if (error) {
                        console.log(error)
                        throw err
                    };
                    console.log('fifth test')

                    if (row.affectedRows > 0) {
                        console.log('fourth test')

                        var qmra_id = row.insertId
                        res.send({ success: true, totalQmra, qmra_id })
                    }
                })

            }
            else {
                res.status(200).json({ success: false, message: "Something went wrong try again later" });
            }

        }
    });

})

router.put('/likelihood_test/:qmra_id', (req, res) => {
    var duration_type = req.body.duration_type;
    var probability_of_infection = req.body.probability_of_infection
    var duration_number = 0;
    if(duration_type.toLocaleLowerCase() === 'daily'){
        duration_number = 31
    }
    else if(duration_type.toLocaleLowerCase() === 'wekkly'){
        duration_number = 54
    }
    else if(duration_type.toLocaleLowerCase() === 'monthly'){
        duration_number = 12
    }
    else if(duration_type.toLocaleLowerCase() === 'quartely'){
        duration_number = 4
    }
    else {
        duration_number = 1
    }
    var likelihood_of_infection = (1 - (1 - probability_of_infection)) ** (-duration_number)
    var likelihood_body = [likelihood_of_infection, req.params.qmra_id]
    var sql = `UPDATE qmra
                SET likelihood_of_infection = ?
                WHERE qmra_id = ?;`
    connection.query(sql, likelihood_body, (err, results)=>{
        if(err) throw err;
        if(results.affectedRows > 0){
            res.send({success:true, likelihood_of_infection})
        }
        else{
            res.send({success:false, message:"could not perform likelihood of infection"})
        }
    })
})

router.post('/mst', (req, res)=>{
    
})

router.get('/qmra_group_results', (req, res) => {
    var group_sql = `select *
    from qmra
    group by samplingId`

    connection.query(group_sql, (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.send({ results, success: true })
        }
        else {
            res.send({ message: "No data found", success: false })
        }

    })
})

router.get('/qmra_results', (req, res) => {

    var select_all_sql = 'select * from qmra'

    connection.query(select_all_sql, (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.send({ results, success: true })
        }
        else {
            res.send({ message: "No data found", success: false })
        }

    })

})

router.get('/qmra_group', (req, res) => {
    var sql = 'select count(samplingId), samplingId count_per_sample from  qmra group by samplingId;'
    connection.query(sql, (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.send({ success: true, results })
        }
        else {
            res.send({ success: false, message: "cannot find data" })
        }
    })
})

router.get('/qmra_results', (req, res) => {
    var sql = 'select * from  qmra '
    connection.query(sql, (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.send({ success: true, results })
        }
        else {
            res.send({ success: false, message: "cannot find data" })
        }
    })
})
module.exports = router
