const fs = require("fs");
const path = require("path");

// This is the directory for the transaction files
const transactionFolder = path.join(__dirname, "transactionFiles");

// A function to get all the transaction lines from transaction files
const getTransactionLines = () => {
  let allTransactionLines = [];
  const transactionFiles = fs.readdirSync(transactionFolder);

  for (const file of transactionFiles) {
    if (file.endsWith(".txt")) {
      const filePath = path.join(transactionFolder, file);
      const fileData = fs.readFileSync(filePath, "utf-8");
      const lines = fileData.split("\n").filter((line) => line.trim() !== "");
      allTransactionLines.push(...lines);
    }
  }
  return allTransactionLines;
};

// This function analyzes the transaction data
const analyzeTransaction = (transactionLines) => {
  const salesByDate = {};
  const salesAmountByDate = {};
  const productCount = {};
  const staffSalesTotal = {};
  const hourSales = {};

  for (const line of transactionLines) {
    const [staffId, time, productList, totalAmount] = line.split(",");
    const amount = parseFloat(totalAmount);
    const productEntries = productList.slice(1, -1).split("|");

    let totalQuantity = 0;
    for (const entry of productEntries) {
      const [, quantity] = entry.split(":");
      const qty = parseInt(quantity, 10);
      totalQuantity += qty;
    }

    // Splitting to extract the date and hour from the transaction time
    const date = time.split("T")[0];
    const hour = time.split("T")[1].split(":")[0];

    // Updating daily sales volume
    salesByDate[date] = (salesByDate[date] || 0) + totalQuantity;

    salesAmountByDate[date] = (salesAmountByDate[date] || 0) + amount;

    for (const entry of productEntries) {
      const [productId, quantity] = entry.split(":");
      productCount[productId] =
        (productCount[productId] || 0) + parseInt(quantity, 10);
    }

    staffSalesTotal[staffId] = (staffSalesTotal[staffId] || 0) + amount;

    //updating the hourly sales volume
    const hourKey = `${date} ${hour}`;
    hourSales[hourKey] = (hourSales[hourKey] || 0) + totalQuantity;
  }

  //identification of the metrics
  let highestSalesVolume = { date: "", volume: 0 };
  let highestSalesValue = { date: "", value: 0 };
  let bestSoldProduct = { id: "", quantity: 0 };
  let bestSellingStaff = { id: "", amount: 0 };
  let peakHour = { date: "", average: 0 };

  for (const date in salesByDate) {
    if (salesByDate[date] > highestSalesVolume.volume) {
      highestSalesVolume = { date, volume: salesByDate[date] };
    }
    if (salesAmountByDate[date] > highestSalesValue.value) {
      highestSalesValue = { date, value: salesAmountByDate[date] };
    }
  }

  for (const productId in productCount) {
    if (productCount[productId] > bestSoldProduct.quantity) {
      bestSoldProduct = { id: productId, quantity: productCount[productId] };
    }
  }

  for (const staffId in staffSalesTotal) {
    if (staffSalesTotal[staffId] > bestSellingStaff.amount) {
      bestSellingStaff = { id: staffId, amount: staffSalesTotal[staffId] };
    }
  }

  //Calculating the average hourly sales volume
  const hourSalesAverage = {};
  for (const key in hourSales) {
    const [date] = key.split(" ");
    if (!hourSalesAverage[date]) {
      hourSalesAverage[date] = { total: 0, count: 0 };
    }
    hourSalesAverage[date].total += hourSales[key];
    hourSalesAverage[date].count++;
  }

  for (const date in hourSalesAverage) {
    const avg = hourSalesAverage[date].total / hourSalesAverage[date].count;
    if (avg > peakHour.average) {
      peakHour = { date, average: avg };
    }
  }

  return {
    maxSalesVolume: highestSalesVolume,
    maxSalesValue: highestSalesValue,
    bestSoldProductId: bestSoldProduct.id,
    bestSellingStaffId: bestSellingStaff.id,
    peakSalesHourDate: peakHour.date,
  };
};

// Main execution function
const executeAnalysis = () => {
  const transactionLines = getTransactionLines();
  const transactionAnalysis = analyzeTransaction(transactionLines);

  console.log("Analytic Report:");
  console.log(
    "Highest Sales Volume in a Day:",
    transactionAnalysis.maxSalesVolume
  );
  console.log(
    "Highest Sales Value in a Day:",
    transactionAnalysis.maxSalesValue
  );
  console.log(
    "Most Sold Product ID by Value:",
    transactionAnalysis.bestSoldProductId
  );
  console.log(
    "Highest Staff ID for Each Month:",
    transactionAnalysis.bestSellingStaffId
  );
  console.log(
    "Highest Hour of the Day by Average Transaction Volume:",
    transactionAnalysis.peakSalesHourDate
  );
};

executeAnalysis();
