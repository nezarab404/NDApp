// import { tokens, EVM_REVERT } from './helpers'

const Token = artifacts.require('./NToken')

const EVM_REVERT = 'VM Exception while processing transaction: revert';
require('chai')
  .use(require('chai-as-promised'))
  .should()

  const tokens = (n) => {
    return new web3.utils.BN(
      web3.utils.toWei(n.toString(), 'ether')
    )
  }

contract('Nezz Token', ([deployer, receiver]) => {
  const name = 'Nezz Token'
  const symbol = 'Nezz'
  const decimals = '18'
  const totalSupply = tokens(1000000).toString()
  let token

  beforeEach(async () => {
    token = await Token.new()
  })

  describe('deployment', () => {
    it('tracks the name', async () => {
      const result = await token.name()
      result.should.equal(name)
    })

    it('tracks the symbol', async ()  => {
      const result = await token.symbol()
      result.should.equal(symbol)
    })

    it('tracks the decimals', async ()  => {
      const result = await token.decimals()
      result.toString().should.equal(decimals)
    })

    it('tracks the total supply', async ()  => {
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply)
    })

    it('assigns the total supply to the deployer', async ()  => {
      const result = await token.balanceOf(deployer)
      result.toString().should.equal(totalSupply)
    })
  })

  describe('sending tokens', () => {
    let result
    let amount

    describe('success', async () => {
      beforeEach(async () => {
        amount = tokens(100)
    //    let b
    //     b= await token.balanceOf(deployer)
    //   console.log("sender before transfer : ",b.toString())
    //   b= await token.balanceOf(receiver)
    //   console.log("receiver before transfer : ",b.toString())
        result = await token.transfer(receiver, amount, { from: deployer })
      })
      it('transfers token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
     //   console.log("receiver after transfer : ",balanceOf.toString())
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
      //  console.log("receiver after transfer : ",balanceOf.toString())
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('emit a transfer event' , async()=>{
         const log = result.logs[0]
         log.event.should.equal('Transfer')
         const event = log.args
         event.from.toString().should.equal(deployer,'from is correct')
         event.to.toString().should.equal(receiver,'to is correct')
         event.value.toString().should.equal(amount.toString(),'value is correct')
      })
    // logs[0] =>>>>>
    //   {
    //     logIndex: 0,
    //     transactionIndex: 0,
    //     transactionHash: '0xea22671a17665ddb79e6439507b2a1e0cf31f14ba41f5a2a7172e1e3f5c1ed25',                                                    
    //     blockHash: '0xdaa7218f67b99f92bb8e5497dcac5c8cfdbc0f484f2042a81c0c76cf4405a66d',                                                          
    //     blockNumber: 73,
    //     address: '0xAac53d73269d50f7a7F980Cffb961780D8b1562d',
    //     type: 'mined',
    //     id: 'log_efcd7a9f',
    //     event: 'Transfer',
    //     args: Result {
    //       '0': '0x6722c886EC68ef3D0e544f13953B7523fCE08660',
    //       '1': '0x88Bcb7298655850f7F9d057071D97f7253aa1f0e',
    //       '2': [BN],
    //       __length__: 3,
    //       from: '0x6722c886EC68ef3D0e544f13953B7523fCE08660',
    //       to: '0x88Bcb7298655850f7F9d057071D97f7253aa1f0e',
    //       value: [BN]
    //     }
    //   }
    
    })

    describe('failer' , async()=> {
      it('rejects insufficient balances', async()=>{
        let invalidAmount = tokens(100000000) //greater than totalSupply
        await token.transfer(receiver,invalidAmount,{from:deployer}).should.be.rejectedWith(EVM_REVERT);

        //test when you have none
        invalidAmount = tokens(10) // recipent has no tokens
        await token.transfer(deployer,invalidAmount,{from:receiver}).should.be.rejectedWith(EVM_REVERT);
      })

      it('rejects invalid recipients address', async()=>{
        await token.transfer(0x0,amount,{from:deployer}).should.be.rejected
      })
    })

  })

})