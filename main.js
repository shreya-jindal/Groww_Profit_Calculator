let puppeteer = require("puppeteer")
let fs=require("fs")
let GrowwLink = "https://groww.in/";
let email_id = "XXXX@YYY.com";                          // WRITE GROWW LOGIN HERE
let password = "ZZZZZZZ";                               // WRITE PASSWORD HERE
let pin = "WXYZ";                                       // WRITE PIN HERE
let filePath = 'Profit.csv';
pin="0"+pin;
let HoldingFilePath="./Holdings.json"
const PerformCalculation=require('./PerformCalculation.js')
const GroupOrdersOfSameCompany=require('./GroupOrdersOfSameCompany.js')

let IntradayBuyOrders, IntradaySellOrders, DeliveryBuyOrders, DeliverySellOrders;

let OldDeliveryBuyOrders =JSON.parse( fs.readFileSync(HoldingFilePath).toString());

(async function () {
    try{
    let Growwbrowser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        defaultViewport: null,
        args: ["--start-maximised"]
    })
    let GrowwPage = await Growwbrowser.newPage();
    await GrowwPage.goto(GrowwLink);

    //Login the groww account
    await GrowwPage.waitForSelector(".onMount-appear-done.onMount-enter-done .btn51Btn.btn51RipplePrimary.btn51Primary");
    await GrowwPage.click(".onMount-appear-done.onMount-enter-done .btn51Btn.btn51RipplePrimary.btn51Primary");
    await GrowwPage.waitForSelector("#login_email1");
    await GrowwPage.type("#login_email1", email_id);
    await GrowwPage.click(".lils382ContinueBtn");
    await GrowwPage.waitForSelector("#login_password1");
    await GrowwPage.type("#login_password1", password);
    await GrowwPage.click(".col.l12.leps592LoginButton")
    await GrowwPage.waitForSelector("#otpinput88parent");
    await GrowwPage.type("#otpinput88parent", pin);

    //navigate to all order
    await GrowwPage.waitForNavigation();
    await GrowwPage.waitForSelector(".hdQuickLabel")
    await GrowwPage.evaluate(function(){
        let investmentTag=document.querySelectorAll(".hdQuickLabel");
        investmentTag[1].click();
    });
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
                    return countOfTodaysOrders;

                })
                resolve(countOfTodaysOrders);

            }, 4000);
        });
        return promise;
    };
    countOfTodaysOrders = await getCountOfTodaysOrders();

    countOfTodaysOrders = 7;

    //extract Today's Order details and store them
    if (countOfTodaysOrders > 0) {

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
            return [IntradayBuyOrders, IntradaySellOrders, DeliveryBuyOrders, DeliverySellOrders];

        }, countOfTodaysOrders);

    }
    Growwbrowser.close();
    GroupOrdersOfSameCompany(IntradayBuyOrders,IntradaySellOrders,DeliveryBuyOrders,DeliverySellOrders);

    let IntradayProfit,DeliveryProfit;

    [IntradayProfit,DeliveryProfit]= await PerformCalculation(IntradayBuyOrders,IntradaySellOrders,DeliveryBuyOrders,DeliverySellOrders,OldDeliveryBuyOrders,HoldingFilePath);

    AddProfitToFile(IntradayProfit,DeliveryProfit, filePath);


}
catch(err){
    console.log("ERROR: ",err);
}

})();



function AddProfitToFile(IntradayProfit,DeliveryProfit, filePath) {
    
    
    let TodaysProfit=(IntradayProfit+DeliveryProfit).toFixed(2);
    IntradayProfit=IntradayProfit.toFixed(2);
    DeliveryProfit=DeliveryProfit.toFixed(2);
    let TodaysDate = new Date().toDateString().split(' ').slice(1).join(' ');
    let todaysRow = TodaysDate + "," + IntradayProfit+ "," +DeliveryProfit;
  
    let FileData = fs.readFileSync(filePath).toString();
    if (FileData.length < 4) {
        let heading="Date, Intraday Profit, Delivery Profit"
      let totalRow = "Net Profit," + TodaysProfit;
      FileData = heading+ "\n" + todaysRow + "\n" + totalRow;
      fs.writeFileSync(filePath, FileData);
      return;
    }
  
    let FileDataRows = FileData.split("\n");
    let TotalProfit = FileDataRows.pop();
    let NewTotal = Number(TotalProfit.split(",")[1]) + Number(TodaysProfit);
    let totalRow = "Net Profit," + NewTotal;
    FileData = FileDataRows.join("\n")
    FileData = FileData + "\n" + todaysRow + "\n" + totalRow;
  
    fs.writeFileSync(filePath, FileData);
  }

