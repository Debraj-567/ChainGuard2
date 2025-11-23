// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    event ProductRegistered(string uid, string cid, address owner);

    mapping(string => string) public cidOf;

    function registerProduct(string calldata uid, string calldata cid) external {
        cidOf[uid] = cid;
        emit ProductRegistered(uid, cid, msg.sender);
    }
}
