// lumenaut payments export

var loadedPayments = [];

document.getElementById("load").onclick = function () {

	lumenaut = 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT';
	address = document.getElementById('address').value;

	if (!address) {
		console.error("Your Public Key is missing!");
		return;
	}

	var timeFrameValue = document.getElementById("timeframe").value;
	endDate = moment();
	startDate = moment().subtract(30, 'days').startOf('day');

	switch (timeFrameValue) {
		case 'year':
			startDate = moment().subtract(1, 'year').startOf('day');
			break;
		case 'prevYear':
			endDate = moment().startOf('year');
			timeFrameValue
			startDate = moment().startOf('year').subtract(1, 'year');
			break;
	}

	var url = 'https://horizon.stellar.org/accounts/' + address + '/payments?limit=200&order=desc'

	getData(url, lumenaut, startDate, endDate, function (payments) {
		loadedPayments = payments;
		var dataTable = document.getElementById("data");
		dataTable.innerHTML = '';

		payments.forEach(function (payment) {
			dataTable.innerHTML += `<tr><td>${payment.date.format()}</td><td>${payment.amount}</td></tr>`;
		});

		document.getElementById("csv").disabled = false;
	});
}

document.getElementById("csv").onclick = function () {
	var timeFrameValue = document.getElementById("timeframe").value;
	var lumenaut = 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT';

	//create csv
	var csvFile = 'Date,Amount(XLM)';
	loadedPayments.forEach(function (payment) {
		csvFile += '\n' + payment.date.format() + ',' + payment.amount;
	})

	//download as file
	var a = document.createElement('a');
	var file = new Blob([csvFile], {
		type: 'csv'
	});
	a.href = URL.createObjectURL(file);
	a.download = `${lumenaut.substring(0,5)}_${timeFrameValue}_PaymentsExport.csv`;
	a.click();
}

function getData(url, lumenaut, startDate, endDate, callback) {

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			var payments = JSON.parse(xmlHttp.responseText);
			processPayments(payments, lumenaut, startDate, endDate, callback);
		}
		else if (xmlHttp.status == 404) {
			callback([]);
		}
	}

	xmlHttp.open("GET", url, true);
	xmlHttp.send(null);
}

function processPayments(payments, lumenaut, startDate, endDate, callback) {
	var paymentsOfInterest = [];
	var lastPaymentDate;
	var records = payments['_embedded'].records;

	if (records.length == 0) {
		callback(paymentsOfInterest);
		return;
	}

	records.forEach(function (payment) {
		lastPaymentDate = moment(payment['created_at']);

		if (!lastPaymentDate.isBetween(startDate, endDate)) {
			return;
		}

		if (payment['source_account'] == lumenaut) {

			paymentsOfInterest.push({
				date: lastPaymentDate,
				amount: payment.amount
			});
		}
	});

	if (lastPaymentDate.isAfter(startDate))
		getData(payments['_links'].prev.href, lumenaut, startDate, endDate, function (newPayments) {
			callback(paymentsOfInterest.concat(newPayments));
	});
	else
		callback(paymentsOfInterest);
}
