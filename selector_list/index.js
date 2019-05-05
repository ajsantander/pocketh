const program = require('commander');
const fs = require('fs');
const Web3 = require('web3');

program
  .version('0.1.0')
  .command('list <contractPath>')
  .action((contractPath) => {

    // Validate input.
    // TODO

    // Retrieve contract artifacts and abi.
    if(!fs.existsSync(contractPath)) throw new Error(`Cannot find ${contractPath}.`);
    const contractArtifacts = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // Print contract name.
    console.log(`${contractArtifacts.contractName}`);

    // Retrieve abi.
    const abi = contractArtifacts.abi;

    // Given an abi item, build the signature string.
    function abiItemToSigStr(item) {
      const inputs = [];
      if(item.inputs && item.inputs.length > 0) {
        item.inputs.map(input => inputs.push(input.type));
      }
      return `${item.name}(${inputs.join(',')})`;
    }

    // Initialize a dummy web3 object, just to use the utils package.
    const web3 = new Web3();

    // Given an abi item, calculate the signature hash.
    function getAbiItemSigHash(item) {
      const sig = abiItemToSigStr(item);
      const hash = web3.utils.sha3(sig);
      return hash.substring(0, 10);
    }

    // Print 'table' headers.
    console.log(``);
    console.log(`HASH:      SIGNATURE:`);

    // Scan the abi and identify function signatures.
    abi.map((item) => {
      if(item.type === 'function') {
        const hash = item.signature ? item.signature : getAbiItemSigHash(item);
        console.log(`${hash} ${abiItemToSigStr(item)}`);
      }
    });
  });

program.parse(process.argv);