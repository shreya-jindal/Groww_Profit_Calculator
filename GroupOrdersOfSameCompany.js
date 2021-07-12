
function GroupOrdersOfSameCompany(IntradayBuyOrders,IntradaySellOrders,DeliveryBuyOrders,DeliverySellOrders) {
    let newIntradayBuyOrders = [];
    let newIntradaySellOrders = [];
    let newDeliveryBuyOrders = [];
    let newDeliverySellOrders = [];

    for (let i = 0; i < IntradayBuyOrders.length; i++) {

        let ComapanyName = IntradayBuyOrders[i].name;
        let index = -1
        for (let j = 0; j < newIntradayBuyOrders.length; j++) {
            if (newIntradayBuyOrders[j]['name'] == ComapanyName) {
                index = j;
                break;
            }
        }
        if (index == -1) {
            IntradayBuyOrders[i]['quantity'] = Number(IntradayBuyOrders[i]['quantity'])
            newIntradayBuyOrders.push(IntradayBuyOrders[i]);
        } else {

            let q1 = Number(newIntradayBuyOrders[index]['quantity']);
            let q2 = Number(IntradayBuyOrders[i]['quantity']);
            let p1 = newIntradayBuyOrders[index]['price'];
            let p2 = IntradayBuyOrders[i]['price'];

            let obj = {};
            obj['name'] = ComapanyName;
            obj['quantity'] = q1 + q2;
            obj['price'] = (q1 * p1 + q2 * p2) / (q1 + q2);
            obj['price']=obj['price'].toFixed(5);

            newIntradayBuyOrders[index] = obj;
        }

    }

    for (let i = 0; i < IntradaySellOrders.length; i++) {

        let ComapanyName = IntradaySellOrders[i].name;
        let index = -1
        for (let j = 0; j < newIntradaySellOrders.length; j++) {
            if (newIntradaySellOrders[j]['name'] == ComapanyName) {
                index = j;
                break;
            }
        }
        if (index == -1) {
            IntradaySellOrders[i]['quantity'] = Number(IntradaySellOrders[i]['quantity'])
            newIntradaySellOrders.push(IntradaySellOrders[i]);
        } else {

            let q1 = Number(newIntradaySellOrders[index]['quantity']);
            let q2 = Number(IntradaySellOrders[i]['quantity']);
            let p1 = newIntradaySellOrders[index]['price'];
            let p2 = IntradaySellOrders[i]['price'];

            let obj = {};
            obj['name'] = ComapanyName;
            obj['quantity'] = q1 + q2;
            obj['price'] = (q1 * p1 + q2 * p2) / (q1 + q2);
            obj['price']=obj['price'].toFixed(5);

            newIntradaySellOrders[index] = obj;
        }

    }

    for (let i = 0; i < DeliveryBuyOrders.length; i++) {

        let ComapanyName = DeliveryBuyOrders[i].name;
        let index = -1
        for (let j = 0; j < newDeliveryBuyOrders.length; j++) {
            if (newDeliveryBuyOrders[j]['name'] == ComapanyName) {
                index = j;
                break;
            }
        }
        if (index == -1) {
            DeliveryBuyOrders[i]['quantity'] = Number(DeliveryBuyOrders[i]['quantity'])
            newDeliveryBuyOrders.push(DeliveryBuyOrders[i]);
        } else {

            let q1 = Number(newDeliveryBuyOrders[index]['quantity']);
            let q2 = Number(DeliveryBuyOrders[i]['quantity']);
            let p1 = newDeliveryBuyOrders[index]['price'];
            let p2 = DeliveryBuyOrders[i]['price'];

            let obj = {};
            obj['name'] = ComapanyName;
            obj['quantity'] = q1 + q2;
            obj['price'] = (q1 * p1 + q2 * p2) / (q1 + q2);
            obj['price']=obj['price'].toFixed(5);

            newDeliveryBuyOrders[index] = obj;
        }

    }

    for (let i = 0; i < DeliverySellOrders.length; i++) {

        let ComapanyName = DeliverySellOrders[i].name;
        let index = -1
        for (let j = 0; j < newDeliverySellOrders.length; j++) {
            if (newDeliverySellOrders[j]['name'] == ComapanyName) {
                index = j;
                break;
            }
        }
        if (index == -1) {
            DeliverySellOrders[i]['quantity'] = Number(DeliverySellOrders[i]['quantity'])
            newDeliverySellOrders.push(DeliverySellOrders[i]);
        } else {

            let q1 = Number(newDeliverySellOrders[index]['quantity']);
            let q2 = Number(DeliverySellOrders[i]['quantity']);
            let p1 = newDeliverySellOrders[index]['price'];
            let p2 = DeliverySellOrders[i]['price'];

            let obj = {};
            obj['name'] = ComapanyName;
            obj['quantity'] = q1 + q2;
            obj['price'] = (q1 * p1 + q2 * p2) / (q1 + q2);
            obj['price']=obj['price'].toFixed(5);

            newDeliverySellOrders[index] = obj;
        }

    }

    //create IntradaySellOrders with corresponding index in IntradayBuyOrders
    IntradaySellOrders = [];
    for (let i = 0; i < newIntradayBuyOrders.length; i++) {
        let CompanyName = newIntradayBuyOrders[i].name;
        for (let j = 0; j < newIntradaySellOrders.length; j++) {
            if (newIntradaySellOrders[j]['name'] == CompanyName) {
                IntradaySellOrders.push(newIntradaySellOrders[j])
                break;
            }
        }
    }

    IntradayBuyOrders = newIntradayBuyOrders;
    DeliveryBuyOrders = newDeliveryBuyOrders;
    DeliverySellOrders = newDeliverySellOrders;

}

module.exports=GroupOrdersOfSameCompany;