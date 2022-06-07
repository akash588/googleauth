const express = require('express');
const app = express();
const fs = require('fs')
const {
    body,
    validationResult
} = require('express-validator');

const flash = require('express-flash-notification');

const MAX_PERCENT = 21


const {
    engine
} = require('express-handlebars'); // before 6.0.0

const port = 1024;

const multer = require('multer');
const {
    json
} = require('express/lib/response');
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(express.static(__dirname + '/views/layouts'));

app.engine('handlebars', engine({
    defaultLayout: 'main'
}))
app.set('view engine', 'handlebars')


app.post('/updatePromos', async (req, res) => {

    const config = require('./config')
    await buildtable(remove = false, running = true)
    require('./index.js')(config.dev)
    res.render('see-active', {
        layout: 'main',
        listExists: true,
        errors: [{
            field: 'Update',
            error: `Running the promo update. Please wait. You can re-render the table if you are wondering the status. Please don't click the button again.`
        }]
    })


})





app.get('/', async (req, res) => {
    res.render('form')

})
app.get('/see_active', (req, res) => {
    res.render('see-active')
});


app.post('/removePromo', async (req, res) => {


    console.log("REQUEST", req.body)

    var removeID = req.body.removeID
    var removeBN = req.body.removeBN
    if ((removeBN == removeID) && (require('./pw').includes(req.body.pwdR))) {

        console.log('ID', removeID)

        const mongo = require('mongodb')
        await global.dbIns.collection('live_promos').updateOne({
            "_id": new mongo.ObjectID(removeID)
        }, {
            $set: {
                endDate: new Date(),
                statusColour: 'Red',
                status: "Promotion Deleted"
            }
        });
        await buildtable(removeID)
        res.render('see-active', {
            layout: 'main',
            listExists: true,
            errors: [{
                field: 'Remove',
                error: `Promo Removed. Please wait a moment.`
            }]
        })
    } else {
        res.render('see-active', {
            layout: 'main',
            listExists: true,
            errors: [{
                field: 'Remove',
                error: `ID or Password does not match. Please try again.`
            }]
        })
    }


});
app.get('/home', (req, res) => res.render('form'));


app.get('/thank-you', (req, res) => res.render('see-active'));

app.post('/form_post', async (req, res, next) => {
    console.log('req', req.body)

    const errors = await getErrors(req.body)
    if (errors.length > 0) {
        res.render('form', {
            layout: 'main',
            listExists: true,
            errors: errors
        })
        return
    } else {
        var response = req.body

        response.isPromo = true
        response.statusColour = 'Red'
        response.status = 'Pending Initialization'
        global.dbIns.collection('live_promos').insertOne(response)
        // Save this to MongoDB
        res.render('form', {
            layout: 'main',
            listExists: true,
            errors: [{
                field: 'success',
                error: `Promo created for ${response.priceGroups}`
            }]
        })

    }
});

app.post('/see_active', async (req, res, next) => {
    try {
        await buildtable()

        res.redirect(303, 'see_active')
    } catch (e) {
        console.log(e, e.message)
    }
});
app.post('/go_home', (req, res, next) => {

    res.redirect(303, 'home')
});




app.use((req, res) => res.status(404).render('404'));
app.use((err, req, res, next) => res.status(500).render('500'));
app.listen(port, () => {
    console.log(`Listening on http://127.0.0.1:${port}`)

    try {

        const _connectToDb = require('./utl/database');

        _connectToDb(async function (connection) {

            if (connection.isSuccess) {
                console.log("---------- Connected to DB ----------");
                global.dbIns = connection.db;
            }
        })
    } catch (e) {
        console.log("Not connected to Database - please contact administator ", e, e.message)
    }
})




async function buildtable(remove = false, running = false) {
    console.log('Generating Table...')
    var content = await global.dbIns.collection("live_promos").find({}).toArray()

    //console.log(content)

    var html = `<table class="table">
    <tr>
    <th></th>
    <th>Filter</th>
    <th>Filter Values</th>
    <th>Price Group</th>
    <th>Percentage Off </th>
    <th>Start Date</th>
    <th>End Date</th>
    <th>Status</th>
    <th>Unique ID</th>
    <th></th>
  </tr>`
    const mongo = require('mongodb')

    content = content.filter(x => x.isPromo == true)
    if (content.length == 0) {
        html = `<h3>No promos are listed</h3>`
    } else {
        var promoCounter = 1
        var today = new Date()
        content.forEach(p => {
            if (((!remove) || (p._id != new mongo.ObjectID(remove))) && (p.hide != true)) {

                if ((today - new Date(p.startDate) > 0) && (today - new Date(p.endDate) < 0)) {
                    var colour = "Green"

                } else {
                    var colour = 'Red'
                    if (today - new Date(p.endDate) > 0)
                        p.status = 'Promotion Expired'
                    p.statusColour = 'Red'

                }
                if (running) {
                    p.status = 'Running'
                    p.statusColour = 'Blue'
                }

                if (['skus'].includes(p['filterType'])) {
                    html += `<tr>
                        <td><div style="color:${colour};">${promoCounter}. </div></td>
                        <td>
                        Filter by SKUs
                        </td>
                        <td>
                            ${p.skus_to_change_price}</td>`

                } else if (p['filterType'] == 'allSkus') {
                    html += `<tr>
                        <td style="color:${colour};">${promoCounter}.</td>
                        <td>
                        Filter by All SKUs
                        </td>
                        <td>
                            All</td>`

                } else if (p['filterType'] == 'brands') {
                    html += `<tr>
                        <td style="color:${colour};">${promoCounter}.</td>

                        <td>
                        Filter by Brands
                        </td>
                        <td>
                            ${p.skus_to_change_price}</td>`
                }


                html += `   <td> ${p.priceGroups}</td>
                            <td> ${p.percentage}%</td>
                            <td> ${p.startDate}</td>
                            <td> ${p.endDate}</td>
                <td style="color:${p.statusColour};"> ${p.status}</td>
                            <td > ${p._id}</td>
                            <td>`
                if (p.status != 'Promotion Expired') {
                    html += `<form method="post" action="/removePromo">
                    <input type="password"  name="pwdR" autocomplete="current-password" placeholder="Pass Key" required>

                    <input type="text"  name="removeID" placeholder="Enter ID to confirm" required>
                    <button class="remove" value="${p._id}" name="removeBN">Remove</button>
                    </form>

                    </td>
                 </tr>`
                }
                promoCounter += 1
            }
        })

    }


    html += `</table>`

    //console.log(content)



    fs.writeFile('./views/see-active.handlebars', html, err => {
        if (err) {
            console.error(err)
            return
        }
        //file written successfully
    })

}










async function getErrors(data) {
    var errors = []
    // PW



    if (!require('./pw').includes(data.pwd)) {
        errors.push({
            field: 'pwd',
            error: 'Pass key does not match. Please chech again'
        })
    }

    // If SKU => SKUs
    if ((data.filterType == 'skus') && ((data.skus_to_change_price.length == 0)) || (data.skus_to_change_price.split(',').length < 1)) {
        errors.push({
            field: 'skus to filter',
            error: 'Issue with the SKUs to filter by'
        })
    }


    // If Brands 
    if ((data.filterType == 'brands') && ((data.skus_to_change_price.length == 0)) || (data.skus_to_change_price.split(',').length < 1)) {
        errors.push({
            field: 'brands to filter',
            error: 'Issue with the Brands'
        })
    }


    if ((data.filterType == 'allSkus')) {
        if (data.skus_to_change_price.length > 0) {
            errors.push({
                field: 'skus to filter',
                error: 'Text box must be empty to access all SKUs'
            })
        }
        if (data.confirmAll != 'on') {
            errors.push({
                field: 'Confirm All',
                error: 'Please confirm to select <<All>>'
            })
        }
    }


    // Price group sel;ected
    if (data.priceGroups == '------ NA ------') {
        errors.push({
            field: 'pricegroups',
            error: 'Select Price group'
        })
    }
    // SD < ED

    var sd = new Date(data.startDate)
    var ed = new Date(data.endDate)
    if (ed - sd < 0) {
        errors.push({
            field: 'dates',
            error: 'Start Date after end date'
        })
    }
    if (ed - new Date() < 0) {
        errors.push({
            field: 'dates',
            error: 'End Date prior to today'
        })
    }
    if (!(Number(data.percentage)) || (data.percentage > MAX_PERCENT)) {
        errors.push({
            field: 'percentage',
            error: 'Percentage incorrect or too high (Max 20).'
        })
    }

    return errors
}