// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Eternity is ERC20 {
    constructor(uint256 initialSupply) ERC20("Eternity", "ETERN") {
        _mint(msg.sender, initialSupply * 10 ** uint256(decimals())); 
    }
}