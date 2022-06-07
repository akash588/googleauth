const axios = require('axios');
const limit = 500;
const axiosRetry = require('axios-retry');
const getNetoItems = async function (filters, appConfig, filterType, page = 0, responseArr = []) {


    var data = {
        Filter: {
            IsActive: true,
            Limit: limit,
            Page: page,
            OutputSelector: ['PriceGroups', "SKU", 'Brand', 'PromotionStartDateUTC', "PromotionExpiryDateUTC"]
        }
    };

    if (filterType == 'brands') {
        data.Filter.Brand = filters

    } else if (filterType == 'sku') {
        data.Filter.SKU = filters
    }


    console.log(filterType, 'to update:', filters)


    const config = {
        method: 'POST',
        url: appConfig.apiUrl,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            NETOAPI_KEY: appConfig.apiKey,
            NETOAPI_USERNAME: appConfig.userName,
            NETOAPI_ACTION: "GetItem",
        },
        data: data
    };
    console.log('responseArr length =', responseArr.length);
    try {
        //console.log(config)


        axiosRetry(axios, { retries: 3 });

        const netoResponse = await axios(config);
        if (Array.isArray(netoResponse.data.Item) && netoResponse.data.Item.length) {
            responseArr = [...responseArr, ...netoResponse.data.Item]
            page = page + 1;
            return getNetoItems(filters, appConfig, filterType, page, responseArr)
        } else {
            responseArr = [...responseArr, ...netoResponse.data.Item]
            return responseArr;
        }
    } catch (ex) {
        console.error(ex.message)
        return responseArr;
    }
}

module.exports = getNetoItems;