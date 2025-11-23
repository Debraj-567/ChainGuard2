// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    struct Product {
        string uid;
        string cid;
        address owner;
        uint256 createdAt;
    }

    mapping(string => Product) public products;

    event ProductRegistered(string uid, string cid, address indexed owner);
    event ProductStatusUpdated(string uid, string status, address indexed actor);

    function registerProduct(string calldata uid, string calldata cid) external {
        require(bytes(uid).length > 0, "uid required");
        Product storage p = products[uid];
        p.uid = uid;
        p.cid = cid;
        p.owner = msg.sender;
        p.createdAt = block.timestamp;
        emit ProductRegistered(uid, cid, msg.sender);
    }

    function updateStatus(string calldata uid, string calldata status) external {
        require(bytes(uid).length > 0, "uid required");
        require(bytes(status).length > 0, "status required");
        emit ProductStatusUpdated(uid, status, msg.sender);
    }
}
