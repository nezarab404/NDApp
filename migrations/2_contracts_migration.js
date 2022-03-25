const NToken = artifacts.require("NToken");

module.exports = function (deployer) {
  deployer.deploy(NToken);
};
