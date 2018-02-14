import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const IncreasingCapCrowdsale = artifacts.require('./TieredCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfigurationMock = artifacts.require('./SaleConfigurationMock.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('IncreasingCapCrowdsale Crowdsale', function ([owner, other, wallet]) {

	let token, crowdsale, whitelist, config;
	let startTime, endTime;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(5);

		whitelist = await Whitelist.new();
		token = await AkropolisToken.new();
		config = await SaleConfigurationMock.new();
		await token.pause();
    var akropolisCrowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address);

		await token.transferOwnership(akropolisCrowdsale.address);
		await akropolisCrowdsale.setToken(token.address);

		crowdsale = IncreasingCapCrowdsale.at(akropolisCrowdsale.address);
	});



	it('should not allow 0 as the base cap', async function () {
		await crowdsale.setBaseCap(0, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow anyone other than owner to set the base cap', async function () {
		await crowdsale.setBaseCap(ether(1), {from: other}).should.be.rejectedWith('revert');
		await crowdsale.setBaseCap(ether(1), {from: wallet}).should.be.rejectedWith('revert');
	});


	it('should set the correct base cap', async function () {
		await crowdsale.setBaseCap(ether(1), {from: owner}).should.be.fulfilled;
	});


	it('should not allow 0 as the max cap', async function () {
		await crowdsale.setMaxCap(0, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow anyone other than owner to set the max cap', async function () {
		await crowdsale.setMaxCap(ether(1), {from: other}).should.be.rejectedWith('revert');
		await crowdsale.setMaxCap(ether(1), {from: wallet}).should.be.rejectedWith('revert');
	});


	it('should not allow setting the max cap lower than base cap', async function () {
		await crowdsale.setMaxCap(ether(0.99), {from: owner}).should.be.rejectedWith('revert');
	});


	it('should set the correct max cap', async function () {
		await crowdsale.setMaxCap(ether(10), {from: owner}).should.be.fulfilled;
	});


	it('should not allow setting the base cap higher than the max cap', async function () {
		await crowdsale.setBaseCap(ether(10.01), {from: owner}).should.be.rejectedWith('revert');
	});

	//TODO: test duration setters

	it('should not allow for a round duration of 0', async function () {
		await crowdsale.setRoundDuration(duration.days(0), {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow the duration of 4 rounds to exceed the end time', async function() {
		await crowdsale.setRoundDuration(duration.days(7), {from: owner}).should.be.rejectedWith('revert');
	});


    it('should set the correct round duration', async function () {
		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;
	});


	it('should calculate the correct cap (Round 1)', async function () {
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		(await crowdsale.getCurrentCap()).should.be.bignumber.equal(ether(1));
	});


	it('should calculate the correct cap (Round 2)', async function () {
		await increaseTimeTo(startTime + duration.days(1));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);
		(await crowdsale.getCurrentCap()).should.be.bignumber.equal(ether(2));
	});


	it('should calculate the correct cap (Round 3)', async function () {
		await increaseTimeTo(startTime + duration.days(2));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);
		(await crowdsale.getCurrentCap()).should.be.bignumber.equal(ether(4));
	});


	it('should calculate the correct cap (Round 4)', async function () {
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(4);
		(await crowdsale.getCurrentCap()).should.be.bignumber.equal(ether(10));
	});

	it('should not return more than 4 rounds after the end time', async function () {
		await increaseTimeTo(startTime + duration.days(7));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(4);
	});

});