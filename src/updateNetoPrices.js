const res = require('express/lib/response');
const axiosRetry = require('axios-retry');
const limit = 500

const updateNetoPrices = async function (payload, appConfig, responseArr = []) {
    try {

        data = payload.splice(0, limit)
        console.log("Updating Prices. Data length:" , data.length)



        var axios = require('axios');
        var data = {
            "Item": data
        };

        var config = {
            method: 'post',
            url: `${appConfig.apiUrl}`,
            headers: {
                'NETOAPI_ACTION': 'UpdateItem',
                'NETOAPI_USERNAME': `${appConfig.userName}`,
                'NETOAPI_KEY': `${appConfig.apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            data: data
        };

        //console.log(JSON.stringify(data, null, 2))
        axiosRetry(axios, { retries: 3 });
        const response = await axios(config);
        console.log(response.data, 'Response data')


        if (Array.isArray(response.data.Item) & response.data.Item.length > 0) {
            responseArr = [...response.data.Item, ...responseArr]
            console.log("Payload remaining SKUS: ", payload.length)
        }
        if (payload.length > 0) {
            console.log('More to update prices...')
            return updateNetoPrices(payload, appConfig, responseArr)
        } else {
            console.log('DONE updating...')
            return responseArr
        }

    } catch (ex) {
        console.log(ex.message)
        throw (ex);
    }
}

module.exports = updateNetoPrices;