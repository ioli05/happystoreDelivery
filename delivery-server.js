// Libraries
const express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql2');
const axios = require("axios");

// Server prop
const app = express()
const port = 5004

// Final vars
const SERVICE_NAME = "DeliveryService";

// Endpoints
// const MONITORING_URL = "http://localhost:5005/log"; 
// const GET_CART_URL = "http://localhost:5002/cart/";
const GET_CART_URL = "http://cart-service:5002/cart/";
const MONITORING_URL = "http://monitoring-service:5005/log";


// create application/json parser
var jsonParser = bodyParser.json()

// DB Conn
var promisePool;

// Define paths

// POST /login gets urlencoded bodies
app.post('/deliveryCart/:guid', jsonParser, async function (req, res) {
    postAsyncLog("Endpoint create delivery called")

    const cartResponse = await fetchCartForGuid(req.params.guid)
    const cartDetailsRows = cartResponse.data.cartDetails

    postAsyncLog(`Cart Results to be Delivered fetched: ${cartDetailsRows}`)

    cartDetailsRows.forEach(async element => {
        const queryString = `INSERT INTO delivery (guid, item, quantity, deliveryState) VALUES (${element.guid}, '${element.item}',
        ${element.quantity}, 'deliverying')`;

        await promisePool.query(queryString)
    });
    postAsyncLog(`Delivery Results were added for cart guid: ${req.params.guid}`)

    await promisePool.query(`DELETE FROM cart WHERE guid = '${req.params.guid}'`)

    postAsyncLog(`Emptyed the cart and delivered the item for cart guid: ${req.params.guid}`)

    res.send("")
})

// Fetch details results
/**
 * {
    "deliveryDetailsRows": [
        {
            "guid": 1,
            "items": "cola",
            "quantity": 1,
            "stateOfDelivery": "deliverying"
        }
    ]
}
*/
app.get('/deliveryCart/:guid', jsonParser, async function (req, res) {
    postAsyncLog("Endpoint fetch delivery called")

    const queryString = `select * from delivery where guid = ${req.params.guid}`;

    const deliveryDetailsRows = await promisePool.query(queryString)

    deliveryDetailsRows.forEach(element => {
        res.json({ deliveryDetailsRows })
    });
    postAsyncLog(`Fetched deliveyr details for cart guid: ${req.params.guid}`)
})

app.get('/', (req, res) => res.send('Hello World!'))

// Define http Method For generic use
const postAsyncLog = async message => {
    try {
        params = {
            service: SERVICE_NAME,
            timestamp: Date.now(),
            message: message,
        }

        const response = await axios.post(MONITORING_URL, params);
        if(response.status == 200) {
            console.log("Successfully sent to monitoring");
        }   
    } catch (error) {
        console.log(error);
    }
};

const fetchCartForGuid = async guid => {
    try {
        const response = await axios.get(GET_CART_URL + guid);
        return response;
    } catch (error) {
        console.log(error);
    }
};


// Start server and establish connection to db
app.listen(port, () => {

    console.log(`Example app listening at http://localhost:${port}`)

    console.log(`Establish connection to db...`)

    //  DB Connection
    const pool = mysql.createPool({
        host: 'db-service',
        user: 'root',
        database: 'happystoredb',
        password: 'admin',
        port: 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // now get a Promise wrapped instance of that pool
    promisePool = pool.promise();
})