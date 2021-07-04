let puppeteer = require("puppeteer")

let GrowwLink = "https://groww.in/";
let GrowwCalculatorLink = "https://groww.in/calculators/brokerage-calculator/"
let email_id = "XXXX@YYY.com";                          // WRITE GROWW LOGIN HERE
let password = "ZZZZZZZ";                               // WRITE PASSWORD HERE
let pin = "WXYZ";                                       // WRITE PIN HERE
let filePath = '.\Profit.csv';
pin="0"+pin;
console.log(pin);
let IntradayBuyOrders, IntradaySellOrders, DeliveryBuyOrders, DeliverySellOrders;


(async function () {

    let Growwbrowser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: null,
        args: ["--start-maximised"],
        executablePath: 'C://Program Files//Google//Chrome//Application//chrome.exe',
    })
    let GrowwPage = await Growwbrowser.newPage();
    await GrowwPage.goto(GrowwLink);

    //Login the groww account
    await GrowwPage.waitForSelector(".onMount-appear-done.onMount-enter-done .btn51Btn.btn51RipplePrimary.btn51Primary");
    await GrowwPage.click(".onMount-appear-done.onMount-enter-done .btn51Btn.btn51RipplePrimary.btn51Primary");
    await GrowwPage.waitForSelector("#login_email1");
    await GrowwPage.type("#login_email1", email_id);
    await GrowwPage.click(".lils382ContinueBtn");
    await GrowwPage.type("#login_password1", password);
    await GrowwPage.click(".col.l12.leps592LoginButton")
    await GrowwPage.waitForSelector("#otpinput88parent");
    await GrowwPage.type("#otpinput88parent", pin);

    //navigate to all orders
    await GrowwPage.waitForSelector(".hdQuickLabel:nth-child(2)")
    await GrowwPage.click(".hdQuickLabel:nth-child(2)");
    await GrowwPage.waitForSelector(".col.l12.stockInvPortLink.right-align.valign-wrapper")
    await GrowwPage.click(".col.l12.stockInvPortLink.right-align.valign-wrapper")

    //select successful orders
    await GrowwPage.waitForSelector("[fill-rule='evenodd']");
    await GrowwPage.evaluate(function () {
        let successfulOrdersCheckBox = document.querySelectorAll(".c11CLabel")[3];
        successfulOrdersCheckBox.click();
    })

    //find count of today's order;
    let countOfTodaysOrders = 0;

    function getCountOfTodaysOrders() {
        var promise = new Promise(function (resolve, reject) {
            setTimeout(async function () {

                let countOfTodaysOrders = await GrowwPage.evaluate(function () {

                    let HeadingsArray = document.querySelectorAll(".ord131DateStyle");
                    let idx = -1;
                    let countOfTodaysOrders;

                    for (let i = 0; i < HeadingsArray.length; i++) {
                        if (HeadingsArray[i].innerText.includes("24 Jun")) {
                            idx = i;
                            break;
                        }
                    }
                    if (idx != -1) {
                        countOfTodaysOrders = 1;
                        let TodayHeadingDiv = HeadingsArray[idx].parentNode.parentNode;
                        let nextHeadingDiv = HeadingsArray[idx + 1].parentNode.parentNode;
                        let siblingDiv = TodayHeadingDiv.nextElementSibling;
                        while (siblingDiv != nextHeadingDiv) {
                            countOfTodaysOrders++;
                            siblingDiv = siblingDiv.nextElementSibling;
                        }
                    } else {
                        countOfTodaysOrders = 0;
                    }
                    console.log(countOfTodaysOrders);
                    return countOfTodaysOrders;

                })
                resolve(countOfTodaysOrders);

            }, 4000);
        });
        return promise;
    };
    countOfTodaysOrders = await getCountOfTodaysOrders();

    countOfTodaysOrders = 8;

    //extract Today's Order details and store them
    if (countOfTodaysOrders > 0) {
        console.log("countOfTodaysOrders999999", countOfTodaysOrders);

        [IntradayBuyOrders, IntradaySellOrders, DeliveryBuyOrders, DeliverySellOrders] = await GrowwPage.evaluate(function (countOfTodaysOrders) {

            function priceStringToNumber(price) {
                price = price.slice(1);
                return Number(price.split(",").join(""));
            }

            let IntradayBuyOrders = [];
            let IntradaySellOrders = [];
            let DeliveryBuyOrders = [];
            let DeliverySellOrders = [];

            let ShareNames = document.querySelectorAll(".ord131DescLine1.truncate")
            let ShareQuantity = document.querySelectorAll(".ord131DataSec2 .ord131DescLine1");
            let SharePrice = document.querySelectorAll(".ord131DataSec3 .ord131DescLine1");
            let OrderType = document.querySelectorAll(".ord131DescLine2.truncate")


            console.log("countOfTodaysOrders999999", countOfTodaysOrders);

            for (let i = 0; i < countOfTodaysOrders; i++) {
                let ShareInfo = {};
                ShareInfo["name"] = ShareNames[i].innerText;
                ShareInfo["quantity"] = ShareQuantity[i].innerText;
                ShareInfo["price"] = SharePrice[i].innerText;
                ShareInfo["price"] = priceStringToNumber(SharePrice[i].innerText);

                OrderType[i].innerText.split(" · ");
                let buyOrSell, intradayOrDelivery;
                [buyOrSell, intradayOrDelivery] = OrderType[i].innerText.split(" · ");

                if (buyOrSell == "Buy" && intradayOrDelivery == "Intraday") {
                    IntradayBuyOrders.push(ShareInfo);
                } else if (buyOrSell == "Buy" && intradayOrDelivery == "Delivery") {
                    DeliveryBuyOrders.push(ShareInfo);
                } else if (buyOrSell == "Sell" && intradayOrDelivery == "Intraday") {
                    IntradaySellOrders.push(ShareInfo);
                } else {
                    DeliverySellOrders.push(ShareInfo);
                }

            }
            console.log("IntradayBuyOrders: ", IntradayBuyOrders);
            console.log("IntradaySellOrders: ", IntradaySellOrders);
            console.log("DeliveryBuyOrders: ", DeliveryBuyOrders);
            console.log("DeliverySellOrders: ", DeliverySellOrders);

            return [IntradayBuyOrders, IntradaySellOrders, DeliveryBuyOrders, DeliverySellOrders];

        }, countOfTodaysOrders);

    }
     Growwbrowser.close();
    GroupOrdersOfSameCompany();

    let TodaysProfit=PerformCalculation();


    AddProfitToFile(TodaysProfit, filePath);

})();


function GroupOrdersOfSameCompany() {
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


function priceStringToNumber(price) {
    price = price.slice(1);
    return Number(price.split(",").join(""));
}

function AddProfitToFile(TodaysProfit, filePath) {

    let TodaysDate = new Date().toDateString().split(' ').slice(1).join(' ');
    let todaysRow = TodaysDate + ":" + TodaysProfit;
  
    let FileData = fs.readFileSync(filePath).toString();
    if (FileData.length < 4) {
      let totalRow = "Total:" + TodaysProfit;
      FileData = todaysRow + "\n" + totalRow;
      console.log(FileData);
      fs.writeFileSync(filePath, FileData);
      return;
    }
  
    let FileDataRows = FileData.split("\n");
    let TotalProfit = FileDataRows.pop();
    let NewTotal = Number(TotalProfit.split(":")[1]) + TodaysProfit;
    let totalRow = "Total:" + NewTotal;
    FileData = FileDataRows.join("\n")
    FileData = FileData + "\n" + todaysRow + "\n" + totalRow;
    console.log(FileData);
  
    fs.writeFileSync(filePath, FileData);
  }


async function PerformCalculation() {
    console.log(IntradayBuyOrders);
    console.log(IntradaySellOrders);
    console.log(DeliveryBuyOrders);
    console.log(DeliverySellOrders);

    let CalculatorBrowser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: null,
        args: ["--start-maximised"],
        executablePath: 'C://Program Files//Google//Chrome//Application//chrome.exe',
    })


    let page = await CalculatorBrowser.newPage();
    await page.goto(GrowwCalculatorLink);
    await page.waitForSelector(".gc_brokerage_frame");
    await page.evaluate(function () {
        let iframeTag = document.querySelector(".gc_brokerage_frame");
        let intradayBtn = iframeTag.contentWindow.document.getElementById("nav-contact-tab")
        intradayBtn.click();
    })


    let intradayProfit = await page.evaluate(function (IntradayBuyOrders,IntradaySellOrders) {
        let iframeTag = document.querySelector("iframe");
        let inputsArray = iframeTag.contentWindow.document.querySelectorAll("input");

        function priceStringToNumber(price) {
            price = price.slice(1);
            return Number(price.split(",").join(""));
        }
        inputsArray[25].click();
        let flag=0;
        let intradayProfit=0;
        
        for(let i = 0; i < IntradayBuyOrders.length; i++) {
            inputsArray[27].value = IntradayBuyOrders[i].quantity;
            inputsArray[28].value = IntradayBuyOrders[i].price;
            inputsArray[29].value = IntradaySellOrders[i].price;
            
            if(flag==0){
            inputsArray[26].click();
            flag=1;
            }else{
            inputsArray[25].click();
            flag=0;
            }

            let NetValue = priceStringToNumber(inputsArray[38].value);
            intradayProfit+=NetValue;
        }

        console.log(intradayProfit);
        return Promise.resolve(intradayProfit);
    },IntradayBuyOrders,IntradaySellOrders);

    return intradayProfit;

    //Calculation for Delivery Buy Orders (Append Net Values to JSON array)
    DeliveryBuyOrders = await page.evaluate(function (DeliveryBuyOrders) {
        let iframeTag = document.querySelector("iframe");
        let inputsArray = iframeTag.contentWindow.document.querySelectorAll("input");

        function priceStringToNumber(price) {
            price = price.slice(1);
            return Number(price.split(",").join(""));
        }

        inputsArray[0].click();
        let flag=0;
        
        for(let i = 0; i < DeliveryBuyOrders.length; i++) {
            inputsArray[2].value = DeliveryBuyOrders[i].quantity;
            inputsArray[3].value = DeliveryBuyOrders[i].price;
            
            if(flag==0){
            inputsArray[1].click();
            flag=1;
            }else{
            inputsArray[0].click();
            flag=0;
            }

            let NetValue = priceStringToNumber(inputsArray[12].value);
            DeliveryBuyOrders[i]["EffectiveBuyPrice"]=NetValue/DeliveryBuyOrders[i].quantity;
        }

        console.log(DeliveryBuyOrders);
        return Promise.resolve(DeliveryBuyOrders);
    },DeliveryBuyOrders);

    fs.appendFileSync(".\order.txt",JSON.stringify(DeliveryBuyOrders));

    console.log(intradayProfit);


};