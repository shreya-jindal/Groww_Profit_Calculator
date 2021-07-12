
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function writeIntradayChargesToCSV(IntradayChargesArray) {
  const csvWriter = createCsvWriter({
    path: 'TodaysIntradayBuyCharges.csv',
    header: [
      { id: 'Name', title: 'Name' },
      { id: 'Quantity', title: 'Quantity' },
      { id: 'BuyPrice', title: 'Buy Price' },
      { id: 'SellPrice', title: 'Sell Price' },
      { id: 'Brokerage', title: 'Brokerage' },
      { id: 'STTCharges', title: 'STT Charges' },
      { id: 'ExchangeTxnCharges', title: 'Exchange Txn Charges' },
      { id: 'SEBICharges', title: 'SEBI Charges' },
      { id: 'GST', title: 'GST' },
      { id: 'StampDuty', title: 'Stamp Duty' },
      { id: 'TotalCharges', title: 'Total Charges' },
      { id: 'NetValue', title: 'Net Value' }
    ]
  });

  csvWriter.writeRecords(IntradayChargesArray);
}


function writeDeliveryBuyChargesToCSV(TodayDeliveryBuyChargesArray) {
  const csvWriter = createCsvWriter({
    path: 'TodaysDeliveryBuyCharges.csv',
    header: [
      { id: 'name', title: 'Name' },
      { id: 'quantity', title: 'Quantity' },
      { id: 'price', title: 'Buy Price' },
      { id: 'Brokerage', title: 'Brokerage' },
      { id: 'STTCharges', title: 'STT Charges' },
      { id: 'ExchangeTxnCharges', title: 'Exchange Txn Charges' },
      { id: 'SEBICharges', title: 'SEBI Charges' },
      { id: 'GST', title: 'GST' },
      { id: 'StampDuty', title: 'Stamp Duty' },
      { id: 'TotalCharges', title: 'Total Charges' },
      { id: 'NetValue', title: 'Net Value' }
    ]
  });

  csvWriter.writeRecords(TodayDeliveryBuyChargesArray);
}


function writeDeliverySellChargesToCSV(TodayDeliverySellChargesArray) {
  const csvWriter = createCsvWriter({
    path: 'TodaysDeliverySellCharges.csv',
    header: [
      { id: 'name', title: 'Name' },
      { id: 'quantity', title: 'Quantity' },
      { id: 'price', title: 'Sell Price' },
      { id: 'Brokerage', title: 'Brokerage' },
      { id: 'STTCharges', title: 'STT Charges' },
      { id: 'ExchangeTxnCharges', title: 'Exchange Txn Charges' },
      { id: 'SEBICharges', title: 'SEBI Charges' },
      { id: 'GST', title: 'GST' },
      { id: 'TotalCharges', title: 'Total Charges' },
      { id: 'NetValue', title: 'Net Value' }
    ]
  });

  csvWriter.writeRecords(TodayDeliverySellChargesArray);
}


module.exports = {writeIntradayChargesToCSV,writeDeliveryBuyChargesToCSV,writeDeliverySellChargesToCSV};
