const {
    check
} = require('express-validator')
const {
    contentDisposition
} = require('express/lib/utils')

const MAX_PERCENT = 21
const mongo = require('mongodb')

const updatePromos = async (appConfig) => {

    var content = await global.dbIns.collection("live_promos").find({}).toArray()


    content = content.filter(x => Number(x.percentage) < MAX_PERCENT)

    var dbIDs = []
    var dbIDs_ALL = []


    // ---------------------------
    var date = new Date()

    // Get content that has finished
    var oldPromos = content.filter(x => (new Date(x.endDate) - date < 0))

    // get content that should be active
    content = content.filter(x => ((new Date(x.endDate) - date > 0) && (date - new Date(x.startDate) > 0)))


    // ---------------------------

    console.log(content)
    // FIX THE DATES FOR NETO:
    for (i in content) {

        content[i].startDate = JSON.stringify(new Date(new Date(content[i].startDate) + 10 * 60 * 60 * 1000)).replace(/["Z]+/g, '').replace(':00.000', '')
        content[i].endDate = JSON.stringify(new Date(new Date(content[i].endDate) + 10 * 60 * 60 * 1000)).replace(/["Z]+/g, '').replace(':00.000', '')


        console.log(`Running ${content[i]._id}`)

        global.dbIns.collection('live_promos').updateOne({
            "_id": new mongo.ObjectID(content[i]._id)
        }, {
            $set: {
                status: "Running",
                statusColour: 'Blue'
            }
        })
    }

    console.log('OLD ------', oldPromos)
    // ---------------------------


    // First check if any content = allSkus
    const isAll = !!(oldPromos.find(p => p.filterType == 'allSkus') || content.find(p => p.filterType == 'allSkus')) // is bool
    var promiseArr = []

    // ---------------------------


    // Get SKUs, then get brands evenetally
    var skus = []
    await content.filter(x => x.filterType == 'skus').forEach(x => {
        skus.push(x.skus_to_change_price.split(','))
    })
    await oldPromos.filter(x => x.filterType == 'skus').forEach(x => {
        skus.push(x.skus_to_change_price.split(','))
    })

    // Get brands 
    var brands = []
    await content.filter(x => x.filterType == 'brands').forEach(x => {
        brands.push(x.skus_to_change_price.split(','))
    })
    await oldPromos.filter(x => x.filterType == 'brands').forEach(x => {
        brands.push(x.skus_to_change_price.split(','))
    })


    // Do SKUs    
    if (skus.length > 0) {



        const ntData = await require('./src/getNetoItems')([...new Set(skus.flat())].map(x => x.replace(/\s+/g, '')).filter((a) => a), appConfig, 'sku')
        //console.log(JSON.stringify(ntData))

        // Format data to add + remove promos via SKU

        content.filter(x => x.filterType == 'skus').forEach(x => {
            promiseArr.push(addPromo(x, ntData, appConfig, filterType = 'SKU'))
            dbIDs.push(x._id)
        })
        oldPromos.filter(x => x.filterType == 'skus').forEach(x => promiseArr.push(removePromo(x, ntData, appConfig, filterType = 'SKU')))
    }

    // Get SKUS by Brands
    if (brands.length > 0) {
        const ntByBrand = await require('./src/getNetoItems')([...new Set(brands.flat())].map(x => x.replace(/\s+/g, '')).filter((a) => a), appConfig, 'brands')

        // Format data to add + remove promos via Brand
        content.filter(x => x.filterType == 'Brand').forEach(x => {
            promiseArr.push(addPromo(x, ntByBrand, appConfig, filterType = 'Brand'))
            dbIDs.push(x._id)
        })
        oldPromos.filter(x => x.filterType == 'Brand').forEach(x => promiseArr.push(removePromo(x, ntByBrand, appConfig, filterType = 'Brand')))
    }



    if (promiseArr.length > 0) {

        const skuData = await Promise.all(promiseArr)
        //console.log('SKU data', JSON.stringify(skuData.flat(), null, 2))



        const payload = await formatSKUS(skuData.flat())
        // resolve into ONE SKU per item:
        //console.log(JSON.stringify(payload, null, 2), '-DONE-')


        // update Prices:
        try {
            var responseArr = await require('./src/updateNetoPrices.js')(payload, appConfig)
            console.log('Neto Response', responseArr)


            console.log(dbIDs, 'dbIDs')
            for (i in dbIDs) {
                console.log(dbIDs[i])
                global.dbIns.collection('live_promos').updateOne({
                    "_id": dbIDs[i]
                }, {
                    $set: {
                        status: "Live",
                        statusColour: 'Green'
                    }
                })
            }
        } catch (e) {
            console.log(e, e.message)
        }

    } else {
        console.log('No Promos active (Non ALL)')
    }


    if (isAll) {
        var allPromiseArr = []
        const allSKU = await require('./src/getNetoItems')([], appConfig, 'all')

        //console.log('All SKUSL: \n', allSKU)

        var allPromo = content.filter(p => p.filterType == 'allSkus')
        var dbIDs_ALL = allPromo.map(x => x._id)


        var allOldPromo = oldPromos.filter(p => p.filterType == 'allSkus')

        allPromiseArr.push(addPromoALL(allPromo, allSKU, appConfig))
        allPromiseArr.push(removePromoALL(allOldPromo, allSKU, appConfig))

        const skuDataALL = await Promise.all(allPromiseArr)

        //console.log(skuDataALL, '00303')
        const payloadALL = await formatSKUS(skuDataALL.flat())
        // resolve into ONE SKU per item:
        //console.log(JSON.stringify(payloadALL, null, 2), '-DONE Formating ALL-')


        // update Prices:
        try {
            await require('./src/updateNetoPrices.js')(payloadALL, appConfig)
            console.log(dbIDs_ALL, 'dbID_Alls')
            for (i in dbIDs_ALL) {

                global.dbIns.collection('live_promos').updateOne({
                    "_id": dbIDs_ALL[i]
                }, {
                    $set: {
                        status: "Live",
                        statusColour: 'Green'
                    }
                })
            }
        } catch (e) {
            console.log(dbIDs_ALL, 'dbIDs')
            for (i in dbIDs_ALL) {
                global.dbIns.collection('live_promos').updateOne({
                    "_id": dbIDs_ALL[i]
                }, {
                    $set: {
                        status: "Possible Error. Check",
                        statusColour: 'Red'
                    }
                })
            }

        }


    }
    console.log('Ending...')


}

module.exports = updatePromos

async function formatSKUS(skuData) {
    var singleSku = {}

    //console.log("----", skuData)

    for await (dict of skuData) {
        console.log(dict)
        if (!singleSku[dict["SKU"]]) {
            singleSku[dict["SKU"]] = {}
            singleSku[dict["SKU"]].SKU = dict["SKU"]
            singleSku[dict["SKU"]].PriceGroups = {
                PriceGroup: []
            }

            singleSku[dict["SKU"]].PromotionStartDate = dict.PromotionStartDateLocal
            singleSku[dict["SKU"]].PromotionExpiryDate = dict.PromotionExpiryDateLocal

        }


        singleSku[dict["SKU"]].PriceGroups.PriceGroup.push(dict.PG)
        singleSku[dict["SKU"]].PromotionStartDate = (dict.PromotionStartDateLocal - singleSku[dict["SKU"]].PromotionStartDate > 0) ? dict.PromotionStartDateLocal : singleSku[dict["SKU"]].PromotionStartDate;
        singleSku[dict["SKU"]].PromotionExpiryDate = (dict.PromotionExpiryDateLocal - singleSku[dict["SKU"]].PromotionExpiryDate > 0) ? dict.PromotionExpiryDateLocal : singleSku[dict["SKU"]].PromotionExpiryDate;
    }


    return Object.keys(singleSku).map(key => singleSku[key])

}


function changeDaterange(propStart, propEnd, currStart, currEnd) {
    return ((propStart - currStart < 0) || (propEnd - currEnd > 0))
}



// For the dates - the date is already an active date - therefore, any active date is ok
async function addPromo(promo, skus, appConfig, filterType) {

    if (!promo) {
        return []
    }


    var changedSkus = []
    const promoID = promo.priceGroups



    const filterToPromo = [...new Set(promo.skus_to_change_price.split(',').map(x => x.replace(/\s+/g, '')).filter((a) => a))]
    for await (const i of skus) {
        try {

            // Choose filter
            var filter = i[filterType]

            var sku = i.SKU
            if ((filterToPromo.includes(filter)) && !!i.PriceGroups[0].PriceGroup) {

                // change it
                // console.log(sku)


                if (Array.isArray(i.PriceGroups[0].PriceGroup)) {
                    // Find the right pricegroup

                    var pg = i.PriceGroups[0].PriceGroup.find(x => (x.GroupID == appConfig.pg[promoID]))
                } else if (i.PriceGroups[0].PriceGroup.GroupID == appConfig.pg[promoID]) {
                    var pg = i.PriceGroups[0].PriceGroup
                } else {
                    continue
                }

                // if it has a price, add a promo price:
                if (!!pg && Number(pg.Price) && ((Number(pg.Price) * ((100 - promo.percentage) / 100)).toFixed(2) != Number(pg.PromotionPrice) || changeDaterange(promo.startDate, promo.endDate, sku.PromotionStartDateUTC, sku.PromotionExpiryDateUTC))) {
                    changedSkus.push({
                        SKU: i.SKU,

                        PG: {
                            "Group": appConfig.pg[promoID],
                            "PromotionPrice": (Number(pg.Price) * ((100 - promo.percentage) / 100)).toFixed(2)
                        },
                        PromotionStartDateLocal: promo.startDate,
                        PromotionExpiryDateLocal: promo.endDate

                    })

                }
                // Reset
                pg = 0
            }

        } catch (e) {
            console.log(e)
            console.log(i)
        }

    }


    return changedSkus

}


// For the dates - the date is already an active date - therefore, any active date is ok
async function addPromoALL(promos, skus, appConfig) {

    const STARTDATE = 0
    const ENDDATE = 1

    if (promos.length == 0) {
        return []
    }
    var changedSKUs = []
    var promoDict = {}
    var timeDict = {}
    promos.forEach(p => {
        promoDict[p.priceGroups] = p.percentage
        timeDict[p.priceGroups] = [p.startDate, p.endDate]
    })


    //console.log(promoDict)


    skus.forEach(item => {
        //console.log(JSON.stringify(item, null, 2))

        // find promo
        Object.keys(promoDict).forEach(key => {

            if (!!item.PriceGroups[0].PriceGroup) {
                if (Array.isArray(item.PriceGroups[0].PriceGroup)) {
                    var pg = item.PriceGroups[0].PriceGroup.find(x => (x.GroupID == appConfig.pg[key]))
                } else if (item.PriceGroups[0].PriceGroup.GroupID == appConfig.pg[key]) {
                    pg = item.PriceGroups[0].PriceGroup
                }

                if ((!!pg) && Number(pg.Price) && ((Number(pg.Price) * ((100 - promoDict[key]) / 100)).toFixed(2) != Number(pg.PromotionPrice)) || changeDaterange(timeDict[key][STARTDATE], timeDict[key][ENDDATE], item.PromotionStartDateUTC, item.PromotionExpiryDateUTC)) {

                    changedSKUs.push({
                        SKU: item.SKU,

                        PG: {
                            "Group": appConfig.pg[key],
                            "PromotionPrice": (Number(pg.Price) * ((100 - promoDict[key]) / 100)).toFixed(2)
                        },
                        PromotionStartDateLocal: timeDict[key][STARTDATE],
                        PromotionExpiryDateLocal: timeDict[key][ENDDATE]

                    })
                }
                // Reset
                pg = 0

            }

        })
        //console.log(changedSKUs, '****')
    })

    return changedSKUs

}


// If we remove the promo price for the expired promo - doesn't matter if the Promotion is `on`, there is nothing there to triggger it. 
async function removePromo(promo, skus, appConfig, filterType) {

    if (!promo) {
        return []
    }

    const filterToPromo = [...new Set(promo.skus_to_change_price.split(',').map(x => x.replace(/ /g, '')).filter((a) => a))]

    var changedSkus = []
    const promoID = promo.priceGroups

    for await (const i of skus) {

        // Choose filter
        var filter = i[filterType]


        if ((filterToPromo.includes(filter)) && (!!i.PriceGroups[0].PriceGroup)) {


            // change it
            // console.log(sku)
            // Find the right pricegroup
            if (Array.isArray(i.PriceGroups[0].PriceGroup)) {
                var pg = i.PriceGroups[0].PriceGroup.find(x => (x.GroupID == appConfig.pg[promoID]))
            } else if (i.PriceGroups[0].PriceGroup.GroupID == appConfig.pg[promoID]) {
                var pg = i.PriceGroups[0].PriceGroup
            } else {
                continue
            }
            // if it has a price, add a promo price:
            if (!!pg && Number(pg.Price)) {
                changedSkus.push({
                    SKU: i.SKU,

                    PG: {
                        "Group": appConfig.pg[promoID],
                        "PromotionPrice": 0
                    }
                })
            }
            // Reset
            pg = 0
        }
    }


    // Remove this promo:
    const mongo = require('mongodb')
    global.dbIns.collection('live_promos').deleteOne({
        "_id": new mongo.ObjectID(promo._id)
    });


    return changedSkus
}

// If we remove the promo price for the expired promo - doesn't matter if the Promotion is `on`, there is nothing there to triggger it. 
async function removePromoALL(promos, skus, appConfig) {

    //console.log(promos)

    if (promos.length == 0) {
        return []
    }

    var changedSKUs = []
    var promoDict = {}
    promos.forEach(p => {
        promoDict[p.priceGroups] = p.percentage

    })



    var sd = JSON.stringify(new Date()).replace(/["Z]+/g, '').replace(':00.000', '')
    var ed = JSON.stringify(new Date()).replace(/["Z]+/g, '').replace(':00.000', '')

    //console.log(promoDict)


    skus.forEach(item => {
        //console.log(JSON.stringify(item, null, 2))

        // find promo
        Object.keys(promoDict).forEach(key => {

            if (!!item.PriceGroups[0].PriceGroup) {
                if (Array.isArray(item.PriceGroups[0].PriceGroup)) {
                    var pg = item.PriceGroups[0].PriceGroup.find(x => (x.GroupID == appConfig.pg[key]))
                } else if (item.PriceGroups[0].PriceGroup.GroupID == appConfig.pg[key]) {
                    pg = item.PriceGroups[0].PriceGroup
                }

                if ((!!pg) && Number(pg.Price)) {
                    changedSKUs.push({
                        SKU: item.SKU,

                        PG: {
                            "Group": appConfig.pg[key],
                            "PromotionPrice": 0
                        },
                        PromotionStartDateLocal: sd,
                        PromotionExpiryDateLocal: ed

                    })
                }
                // Reset
                pg = 0

            }

        })

    })


    // Remove this promo:
    const mongo = require('mongodb')
    promos.forEach(promo => {
            global.dbIns.collection('live_promos').deleteOne({
                "_id": new mongo.ObjectID(promo._id)
            });
        }

    )

    return changedSKUs
}