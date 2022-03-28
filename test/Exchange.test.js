const Exchange = artifacts.require('./Exchange')
const NToken = artifacts.require('./NToken')

const EVM_REVERT = 'VM Exception while processing transaction: revert';

require('chai')
  .use(require('chai-as-promised'))
  .should()

const ether = (n) => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}

const tokens = (n) => ether(n)

const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('Exchange', ([deployer, feeAccount, user1]) => {
  let token
  let exchange
  let feePercent = 5

  beforeEach(async () => {
    token = await NToken.new()
    token.transfer(user1, tokens(100), { from: deployer })
    exchange = await Exchange.new(feeAccount, feePercent)
  })

  describe('deployment', () => {
    it('tracks the fee account', async () => {
      const result = await exchange.feeAccount()
      result.should.equal(feeAccount)
    })

    it('tracks the fee percent', async () => {
      const result = await exchange.feePercent()
      result.toString().should.equal(feePercent.toString())
    })
  })

  describe('fallback', async () => {
    it('reverts when Ether is sent',async()=>{
      await exchange.sendTransaction({value:1,from:user1}).should.be.rejectedWith(EVM_REVERT)
    })
  })

  describe('depositing ether', () => {
    let result
    let amount

    beforeEach(async () => {
      amount = ether(1)
      result = await exchange.depositEther({ from: user1, value: amount })
    })

    it('tracks the Ether deposit', async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1)
      balance.toString().should.equal(amount.toString())
    })

    it('emit a Deposit event', async () => {
      const log = result.logs[0]
      log.event.should.equal('Deposit')
      const event = log.args
      event._token.should.equal(ETHER_ADDRESS, '_token is correct')
      event._user.should.equal(user1, 'user is correct')
      event._amount.toString().should.equal(amount.toString(), 'amount is correct')
      event._balance.toString().should.equal(amount.toString(), 'balance is correct')
    })

  })

  describe('depositing tokens', () => {
    let result
    let amount


    describe('success', () => {
      beforeEach(async () => {
        amount = tokens(10)
        token.approve(exchange.address, amount, { from: user1 })
        result = await exchange.depositToken(token.address, amount, { from: user1 })
      })

      it('tracks the token deposit', async () => {
        let balance
        //check exchange token balance
        balance = await token.balanceOf(exchange.address)
        balance.toString().should.equal(amount.toString())
        //check tokens on exchange
        balance = await exchange.tokens(token.address, user1)
        balance.toString().should.equal(amount.toString())
      })

      it('emit a Deposit event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Deposit')
        const event = log.args
        event._token.should.equal(token.address, '_token is correct')
        event._user.should.equal(user1, 'user is correct')
        event._amount.toString().should.equal(amount.toString(), 'amount is correct')
        event._balance.toString().should.equal(amount.toString(), 'balance is correct')
      })

    })
    describe('failure', () => {
      it('fails when no tokens are approved', async () => {
        await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })

      it('rejectes Ether deposits', async () => {
        await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })

    })
  })

})