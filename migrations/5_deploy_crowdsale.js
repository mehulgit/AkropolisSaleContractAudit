const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const AkropolisToken = artifacts.require('./AkropolisToken.sol');
function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}
module.exports = async function(deployer, network, accounts) {

	const startTime = (new Date().getTime()/1000 | 0) + 3600; //Custom time 1hr from now, set to UNIX (Epoch) Standard Seconds
	const endTime = startTime + 36200; // 10 days

	let bountyFundAddress = '0x6E5244E929BA540Cd83774B6BFee940A197c2A09';
	let developmentFundAddress = '0x447C00fBE180d99969eaBDc643042B3848c2595C';
	let reserveFundAddress = '0x0d95255b0B044242aD7BD63964DfaB5f5D06a21D';

	const wallet = await accounts[0];

	await deployer.deploy(AkropolisCrowdsale, startTime, endTime, wallet, process.deployment.Whitelist, process.deployment.SalesConfiguration);
	let crowdsale = await AkropolisCrowdsale.deployed();
	process.deployment.AkropolisCrowdsale = crowdsale.address;

	await crowdsale.setBountyFund(bountyFundAddress);
	await crowdsale.setDevelopmentFund(developmentFundAddress);
	await crowdsale.setReserveFund(reserveFundAddress);
	await crowdsale.setAdvisorsAllocations(process.deployment.AdvisorsAllocations);
	await crowdsale.setPresaleAllocations(process.deployment.PresaleAllocations);
	await crowdsale.setTeamAllocations(process.deployment.TeamAllocations);

	//Capture a log of this full migration crowdsale and write to JSON
	const fs = require('fs');
	const logFolder = './migrations/migrationLogs';

	var timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/, '_');
	var jsonPackage = JSON.stringify(process.deployment);
	console.log("Creating log file from process variable");
	fs.readdir(logFolder, (err, files) => {
		if(err) throw err;
		var index;
		if (files) {
			index = files.length;
		}
		else {
			index = 0;
		}
		fs.writeFile(logFolder + "/" + index +'_Migration_' + timestamp, jsonPackage, function(err){
			if(err) throw err;
			console.log("Successfully created log file");
		});
	});

};
