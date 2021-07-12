let puppeteer = require("puppeteer")
let fs = require("fs")
let GrowwCalculatorLink = "https://groww.in/calculators/brokerage-calculator/"
let CsvUtils=require('./CsvUtils.js')

async function PerformCalculation(IntradayBuyOrders, IntradaySellOrders, DeliveryBuyOrders, DeliverySellOrders, OldDeliveryBuyOrders,HoldingFilePath) {

    let CalculatorBrowser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: null,
        args: ["--start-maximised"]
    })

    let page = await CalculatorBrowser.newPage();
    await page.goto(GrowwCalculatorLink);
    await page.waitForSelector(".gc_brokerage_frame");
    await page.evaluate(function () {
        let iframeTag = document.querySelector(".gc_brokerage_frame");
        let intradayBtn = iframeTag.contentWindow.document.getElementById("nav-contact-tab")
        intradayBtn.click();
    })

    let intradayProfit, IntradayChargesArray;

    [intradayProfit, IntradayChargesArray] = await page.evaluate(function (IntradayBuyOrders, IntradaySellOrders) {
        let iframeTag = document.querySelector("iframe");
        let inputsArray = iframeTag.contentWindow.document.querySelectorAll("input");
        function toNumber(num) {
            num = num.split(",").join("");
            return Number(num);
        }

        function priceStringToNumber(price) {
            price = price.slice(1);
            return Number(price.split(",").join(""));
        }
        inputsArray[25].click();
        let flag = 0;
        let intradayProfit = 0;

        let IntradayChargesArray = []
        for (let i = 0; i < IntradayBuyOrders.length; i++) {
            inputsArray[27].value = IntradayBuyOrders[i].quantity;
            inputsArray[28].value = IntradayBuyOrders[i].price;
            inputsArray[29].value = IntradaySellOrders[i].price;

            if (flag == 0) {
                inputsArray[26].click();
                flag = 1;
            } else {
                inputsArray[25].click();
                flag = 0;
            }

            let NetValue = priceStringToNumber(inputsArray[38].value);
            intradayProfit += NetValue;

            //storing detailed information of charges
            let IntradayOrderCharges = {}
            IntradayOrderCharges["Name"] = IntradayBuyOrders[i].name;
            IntradayOrderCharges["Quantity"] = IntradayBuyOrders[i].quantity;
            IntradayOrderCharges["BuyPrice"] = IntradayBuyOrders[i].price;
            IntradayOrderCharges["SellPrice"] = IntradaySellOrders[i].price;
            IntradayOrderCharges["Brokerage"] = Number(inputsArray[31].value);
            IntradayOrderCharges["STTCharges"] = Number(inputsArray[32].value);
            IntradayOrderCharges["ExchangeTxnCharges"] = Number(inputsArray[33].value);
            IntradayOrderCharges["SEBICharges"] = Number(inputsArray[34].value);
            IntradayOrderCharges["GST"] = Number(inputsArray[35].value);
            IntradayOrderCharges["StampDuty"] = Number(inputsArray[36].value);
            IntradayOrderCharges["TotalCharges"] = toNumber(inputsArray[37].value);
            IntradayOrderCharges["NetValue"] = NetValue;

            IntradayChargesArray.push(IntradayOrderCharges);
        }
        return Promise.resolve([intradayProfit, IntradayChargesArray]);
    }, IntradayBuyOrders, IntradaySellOrders);

    //maintaining intraday charges sheet
    CsvUtils.writeIntradayChargesToCSV(IntradayChargesArray);


    //EffectivePrices are the prices including charges of every share

    //Calculation for Delivery Buy Orders (Append Net Values to JSON array)
    let TodayDeliveryBuyChargesArray;
    [DeliveryBuyOrders, TodayDeliveryBuyChargesArray] = await page.evaluate(function (DeliveryBuyOrders) {
        let iframeTag = document.querySelector("iframe");
        let inputsArray = iframeTag.contentWindow.document.querySelectorAll("input");

        function toNumber(num) {
            num = num.split(",").join("");
            return Number(num);
        }

        function priceStringToNumber(price) {
            price = price.slice(1);
            return Number(price.split(",").join(""));
        }

        inputsArray[0].click();
        let flag = 0;

        let TodayDeliveryBuyChargesArray = [];

        for (let i = 0; i < DeliveryBuyOrders.length; i++) {
            inputsArray[2].value = DeliveryBuyOrders[i].quantity;
            inputsArray[3].value = DeliveryBuyOrders[i].price;

            if (flag == 0) {
                inputsArray[1].click();
                flag = 1;
            } else {
                inputsArray[0].click();
                flag = 0;
            }

            let NetValue = priceStringToNumber(inputsArray[12].value);
            DeliveryBuyOrders[i]["EffectiveBuyPrice"] = Number(NetValue / DeliveryBuyOrders[i].quantity.toFixed(5));

            let TodayDeliveryBuyCharges = {};
            TodayDeliveryBuyCharges["name"] = DeliveryBuyOrders[i].name;
            TodayDeliveryBuyCharges["quantity"] = DeliveryBuyOrders[i].quantity;
            TodayDeliveryBuyCharges["price"] = DeliveryBuyOrders[i].price;
            TodayDeliveryBuyCharges["Brokerage"] = Number(inputsArray[5].value);
            TodayDeliveryBuyCharges["STTCharges"] = toNumber(inputsArray[6].value);
            TodayDeliveryBuyCharges["ExchangeTxnCharges"] = Number(inputsArray[7].value);
            TodayDeliveryBuyCharges["SEBICharges"] = Number(inputsArray[8].value);
            TodayDeliveryBuyCharges["GST"] = Number(inputsArray[9].value);
            TodayDeliveryBuyCharges["StampDuty"] = Number(inputsArray[10].value);
            TodayDeliveryBuyCharges["TotalCharges"] = toNumber(inputsArray[11].value);
            TodayDeliveryBuyCharges["NetValue"] = NetValue;

            TodayDeliveryBuyChargesArray.push(TodayDeliveryBuyCharges);
        }

        return Promise.resolve([DeliveryBuyOrders, TodayDeliveryBuyChargesArray]);
    }, DeliveryBuyOrders);
    CsvUtils.writeDeliveryBuyChargesToCSV(TodayDeliveryBuyChargesArray);

    //append Old Delivery Buy Orders in new to check if the corresponding buy order was placed before today
    for (let i = 0; i < OldDeliveryBuyOrders.length; i++) {
        DeliveryBuyOrders.push(OldDeliveryBuyOrders[i]);
    }
    

    if (DeliverySellOrders.length == 0)
    {
        let Profit=[0,intradayProfit]
        return Profit;
    }

    //CALCULATION FOR DELIVERY PROFIT

    //Calculation for Delivery Sell Orders (Append Net Values to JSON array)
    let TodayDeliverySellChargesArray;
    [DeliverySellOrders, TodayDeliverySellChargesArray] = await page.evaluate(function (DeliverySellOrders) {
        let iframeTag = document.querySelector("iframe");
        let inputsArray = iframeTag.contentWindow.document.querySelectorAll("input");

        function toNumber(num) {
            num = num.split(",").join("");
            return Number(num);
        }

        function priceStringToNumber(price) {
            price = price.slice(1);
            return Number(price.split(",").join(""));
        }

        inputsArray[13].click();
        let flag = 0;
        let TodayDeliverySellChargesArray = []
        for (let i = 0; i < DeliverySellOrders.length; i++) {
            inputsArray[15].value = DeliverySellOrders[i].quantity;
            inputsArray[16].value = DeliverySellOrders[i].price;

            if (flag == 0) {
                inputsArray[14].click();
                flag = 1;
            } else {
                inputsArray[13].click();
                flag = 0;
            }

            let NetValue = priceStringToNumber(inputsArray[24].value);
            DeliverySellOrders[i]["EffectiveSellPrice"] = Number((NetValue / DeliverySellOrders[i].quantity).toFixed(5));

            let TodayDeliverySellCharges = {};
            TodayDeliverySellCharges["name"] = DeliverySellOrders[i].name;
            TodayDeliverySellCharges["quantity"] = DeliverySellOrders[i].quantity;
            TodayDeliverySellCharges["price"] = DeliverySellOrders[i].price;
            TodayDeliverySellCharges["Brokerage"] = Number(inputsArray[18].value);
            TodayDeliverySellCharges["STTCharges"] = toNumber(inputsArray[19].value);
            TodayDeliverySellCharges["ExchangeTxnCharges"] = Number(inputsArray[20].value);
            TodayDeliverySellCharges["SEBICharges"] = Number(inputsArray[21].value);
            TodayDeliverySellCharges["GST"] = Number(inputsArray[22].value);
            TodayDeliverySellCharges["TotalCharges"] = toNumber(inputsArray[23].value);
            TodayDeliverySellCharges["NetValue"] = NetValue;

            TodayDeliverySellChargesArray.push(TodayDeliverySellCharges);
        }

        return Promise.resolve([DeliverySellOrders, TodayDeliverySellChargesArray]);
    }, DeliverySellOrders);
    CsvUtils.writeDeliverySellChargesToCSV(TodayDeliverySellChargesArray);

    let DeliveryProfit = 0;

    for (let i = 0; i < DeliverySellOrders.length; i++) {
        for (let j = 0; j < DeliveryBuyOrders.length; j++) {
            if (DeliveryBuyOrders[j].name == DeliverySellOrders[i].name) {

                if (DeliveryBuyOrders[j].quantity > DeliverySellOrders[i].quantity) {
                    DeliveryProfit += DeliverySellOrders[i].quantity * (DeliverySellOrders[i].EffectiveSellPrice - DeliveryBuyOrders[j].EffectiveBuyPrice)
                    DeliveryBuyOrders[j].quantity -= DeliverySellOrders[i].quantity;
                    DeliverySellOrders[i].quantity = 0;
                } else {
                    DeliveryProfit += DeliveryBuyOrders[j].quantity * (DeliverySellOrders[i].EffectiveSellPrice - DeliveryBuyOrders[j].EffectiveBuyPrice)
                    DeliverySellOrders[i].quantity -= DeliveryBuyOrders[j].quantity;
                    DeliveryBuyOrders[j].quantity = 0;
                    DeliveryBuyOrders.splice(j, 1);
                    j--;
                }

            }
            if (DeliverySellOrders[i].quantity == 0)
                break;
        }
    }
    
    //saving remaining holdings to memory
    fs.writeFileSync(HoldingFilePath ,JSON.stringify(DeliveryBuyOrders));

    CalculatorBrowser.close();
    let Profit=[intradayProfit,DeliveryProfit];
    return Profit;

};


module.exports = PerformCalculation;