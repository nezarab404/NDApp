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

contract('Exchange', ([deployer, feeAccount, user1 , user2]) => {
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
    it('reverts when Ether is sent', async () => {
      await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
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

  describe('withdrawing ether', () => {
    let result
    let amount

    beforeEach(async () => {
      amount = ether(1)
      result = await exchange.depositEther({ from: user1, value: amount })
    })

    describe('success', async () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 })
      })
      it('tracks the Ether withdraw', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal('0')
      })

      it('emit a Withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event._token.should.equal(ETHER_ADDRESS, '_token is correct')
        event._user.should.equal(user1, 'user is correct')
        event._amount.toString().should.equal(amount.toString(), 'amount is correct')
        event._balance.toString().should.equal('0', 'balance is correct')
      })

    })

    describe('failure', async () => {
      it('rejects withdraws for insufficiant balance', async () => {
        await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
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

  describe('withdrawing tokens', () => {
    let result
    let amount

    describe('success', async()=>{
      beforeEach(async()=>{
        amount = tokens(10)
        await token.approve(exchange.address,amount,{from:user1})
        await exchange.depositToken(token.address,amount,{from:user1})
        result = await exchange.withdrawToken(token.address,amount,{from:user1})
      })

      it('withdraws oken funds', async()=>{
        const balance = await exchange.tokens(token.address,user1)
        balance.toString().should.equal('0')
      })

      it('emit a Withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event._token.should.equal(token.address, '_token is correct')
        event._user.should.equal(user1, 'user is correct')
        event._amount.toString().should.equal(amount.toString(), 'amount is correct')
        event._balance.toString().should.equal('0', 'balance is correct')
      })
    })

    describe('failure', async()=>{
      it('rejects Ether withdraws',async()=>{
        await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), {from:user1}).should.be.rejectedWith(EVM_REVERT)
      })

      it('fails for insufficient balances',async()=>{
        await exchange.withdrawToken(token.address, tokens(10), {from:user1}).should.be.rejectedWith(EVM_REVERT)
      })
    })

  })

  describe('checking balances', async()=>{
    beforeEach(async()=>{
      await exchange.depositEther({from:user1 , value:ether(1)})
    })

    it('returns user balance' ,async()=>{
      const result = await exchange.balanceOf(ETHER_ADDRESS,user1)
      result.toString().should.equal(ether(1).toString()) 
    })
  })

  describe('making orders', async()=>{
    let result

    beforeEach( async () => {
      result = await exchange.makeOrder(token.address,tokens(1),ETHER_ADDRESS,ether(1),{from:user1})
    })

    it('tracks the newly created order', async () => {
      const orderCount = await exchange._orderCount()
      orderCount.toString().should.equal('1')
      const order = await exchange.orders('1')
      order.id.toString().should.equal('1','id is correct')
      order.user.should.equal(user1,'user is correct')
      order.tokenGet.should.equal(token.address, 'tokenGet is correct')
      order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
      order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
      order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })

    it('emits an "Order" event', async () => {
      const log = result.logs[0]
      log.event.should.eq('Order')
      const event = log.args
      event.id.toString().should.equal('1', 'id is correct')
      event.user.should.equal(user1, 'user is correct')
      event.tokenGet.should.equal(token.address, 'tokenGet is correct')
      event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
      event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
      event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
      event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
    })

  })

  describe('order actions', async () => {

    beforeEach(async () => {
      // user1 deposits ether
      await exchange.depositEther({ from: user1, value: ether(1) })
      // user1 makes an order to buy tokens with Ether
      await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
    })

    describe('cancelling orders', async () => {
      let result

      describe('success', async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder('1', { from: user1 })
        })

        it('updates cancelled orders', async () => {
         const orderCancelled = await exchange.canceldOrders(1)
          orderCancelled.should.equal(true)
        })

        it('emits a "Cancel" event', async () => {
          const log = result.logs[0]
          log.event.should.equal('Cancel')
          const event = log.args
          event.id.toString().should.equal('1', 'id is correct')
          event.user.should.equal(user1, 'user is correct')
          event.tokenGet.should.equal(token.address, 'tokenGet is correct')
          event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
          event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
          event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
          event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })

      })

      describe('failure', async () => {
        it('rejects invalid order ids', async () => {
          const invalidOrderId = 99999
          await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects unauthorized cancelations', async () => {
          // Try to cancel the order from another user
          await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })
  })

})