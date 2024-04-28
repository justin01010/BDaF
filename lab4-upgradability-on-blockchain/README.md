# Bdaf lab4

## Usage
Install dependencies:
```
$ npm i
```

Compile smart contract:
```
$ npx hardhat compile
```

Test script in ```test/proxy.test.js``` & retrieve gas-report
```
$ npx hardhat test
```

Get test coverage:
```
$ npx hardhat coverage
```

### Contract Deployment & Interaction:
Deploy contract:
```
$ npx hardhat run deploy/deploy.js --network zircuit
```
Verify contract:
```
$ npx hardhat verify --network zircuit {CONTRACT_ADDRESS}
```
Interact with contract:
- add interaction scripts in ```scripts/```
```
$ npx hardhat run scripts/{filename}.js --network zircuit
```

## Contract Results

### Test Coverage


### Gas Report