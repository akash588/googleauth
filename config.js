module.exports = {
    dev: {
        apiUrl: 'https://kgtest.neto.com.au/do/WS/NetoAPI',
        userName: 'sample_user2',
        apiKey: 'GbQb6pvHaCcBNO18G9JZwXtjjIAcNdmc',
        pg: {
            woolies: 1,
            westfield: 2,
            bbq: 3,
            kogan: 4,
            catch: 8
        }
    },
    prod: {

        apiUrl: 'https://www.kgelectronic.com.au/do/WS/NetoAPI',
        userName: 'Catch-API',
        apiKey: '7rIN0GqZmXUS1mPIUEb2pLZZKnytoffy',
        pg: {
            woolies: 23,
            westfield: 28,
            bbq: 26,
            kogan: 5,
            catch: 4
        }

    }
}