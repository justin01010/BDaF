// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract constantPriceAMM {

    /* --- Parameters Definition --- */

    address public token0;
    address public token1;

    uint public conversionRate;

    // total liquidity in the pool
    uint public reserve_token0;
    uint public reserve_token1;

    // Stores liquidity provided by each address
    mapping(address => uint) public liquidityToken0;
    mapping(address => uint) public liquidityToken1;


    // set conversion rate at constructor to be constant
    constructor(address _token0, address _token1, uint _conversionRate){
        token0 = _token0;
        token1 = _token1;
        conversionRate = _conversionRate;
    }

    function trade(address tokenFrom, uint256 fromAmount) external {
        if (tokenFrom == token0) {
            // calculate trade amount and check if reserve is enough
            uint256 toAmount = fromAmount * conversionRate / 10000;
            require(reserve_token1 >= toAmount, "Insufficient liquidity");

            // token transfer
            ERC20(token0).transferFrom(msg.sender, address(this), fromAmount);
            reserve_token0 += fromAmount;
            ERC20(token1).transfer(msg.sender, toAmount);
            reserve_token1 -= toAmount;
        } else if (tokenFrom == token1) {
            // calculate trade amount and check if reserve is enough
            uint256 toAmount = fromAmount * 10000 / conversionRate;
            require(reserve_token0 >= toAmount, "Insufficient liquidity");

            // token transfer
            ERC20(token1).transferFrom(msg.sender, address(this), fromAmount);
            reserve_token1 += fromAmount;
            ERC20(token0).transfer(msg.sender, toAmount);
            reserve_token0 -= toAmount;
        } else {
            // revert when the token provided isn't token0, token1
            revert("Invalid Token");
        }
    }
    
    function provideLiquidity(uint amount0, uint amount1) external returns(uint,uint){
        /* --- Liquidity Provider Principles --- */
        // if reserve0 & reserve1 both 0, can define ratio with liquidity provided (do nothing with amount)
        // if reserve0 = 0, reserve1 != 0, can only provide reserve1 liquidity (vise versa)
        // if both reserve != 0, provide liquidity based on current ratio

        require(amount0 > 0 || amount1 > 0, "Must provide some liquidity");

        /* --- change the amount that can provide liquidity --- */
        if (reserve_token0 == 0) {
            if (reserve_token1 != 0) { 
                // can only provide reserve1
                amount0 = 0; 
            }
            // do nothing when both reserve = 0
        } else if (reserve_token1 == 0){
            // can only provide reserve0
            amount1 = 0; 
        } else {  // both reserve not 0: change the amount to maintain the current ratio

            // find the largest amount that can be transmitted for one token (regardless of the token_amount itself)
            uint256 token0Max = (amount1 * reserve_token0) / reserve_token1;
            uint256 token1Max = (amount0 * reserve_token1) / reserve_token0;

            // get the final token amount that is transmitted
            amount0 = amount0 > token0Max ? token0Max : amount0;
            amount1 = amount1 > token1Max ? token1Max : amount1;

            require(amount0 > 0 || amount1 > 0, "Invalid liquidity amounts");
        }
        
        // add to reserve pool and make token transactions
        if (amount0 != 0) {
            reserve_token0 += amount0;
            require(ERC20(token0).transferFrom(msg.sender, address(this), amount0), "Transfer failed");
        }
        if (amount1 != 0) {
            reserve_token1 += amount1;
            require(ERC20(token1).transferFrom(msg.sender, address(this), amount1), "Transfer failed");
        }

        // add the amount of token added to the pool by user for further withdrawal
        liquidityToken0[msg.sender] += amount0;
        liquidityToken1[msg.sender] += amount1;

        return (amount0, amount1);
    }

    function withdrawLiquidity() external returns(uint,uint){

        uint256 liquidity_token0 = liquidityToken0[msg.sender];
        uint256 liquidity_token1 = liquidityToken1[msg.sender];
        
        require(liquidity_token0 > 0 || liquidity_token1 > 0, "No liquidity to withdraw");
        
        // calculate the token amount to withdraw (based on current reserve ratio)
        uint total_reserve_value = reserve_token0 + reserve_token1 * conversionRate / 10000;
        uint user_total_token_value = liquidity_token0 + liquidity_token1 * conversionRate / 10000;

        // withdrawal_token value
        uint withdraw_token0 = reserve_token0 * user_total_token_value / total_reserve_value;
        uint withdraw_token1 = reserve_token1 * user_total_token_value / total_reserve_value;


        // transfer token out of the reserved pool
        ERC20(token0).transfer(msg.sender, withdraw_token0);
        reserve_token0 -= withdraw_token0;
        ERC20(token1).transfer(msg.sender, withdraw_token1);
        reserve_token1 -= withdraw_token1;

        liquidityToken0[msg.sender] = 0;
        liquidityToken1[msg.sender] = 0;

        return (withdraw_token0, withdraw_token1);
    }

}
