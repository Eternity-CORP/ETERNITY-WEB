const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EternModule", (m) => {
  const initialSupply = m.getParameter("initialSupply", 1000000);
  const myToken = m.contract("Eternity", [initialSupply]);

  return { myToken };
});
