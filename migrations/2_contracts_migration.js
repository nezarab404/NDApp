const NToken = artifacts.require("NToken");
const Exchange = artifacts.require("Exchange");

module.exports = async function (deployer) {
  const accounts = await web3.eth.getAccounts();
  const feeAccount = accounts[0]
  const feePercent = 5
  await deployer.deploy(NToken);
  await deployer.deploy(Exchange,feeAccount,feePercent);
};
