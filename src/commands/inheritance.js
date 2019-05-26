const path = require('path');
const treeify = require('treeify');
const getArtifacts = require('../utils/getArtifacts');
const astUtil = require('../utils/astUtil');
const chalk = require('chalk');

const signature = 'inheritance <contractPath>';
const description = 'Displays the inheritance tree of a contract.';
const help = chalk`
Displays the inheritance tree of the provided contract (compiled or not).

{red Eg:}

{blue > pocketh inheritance test/artifacts/Test.json }
└─ Test
   ├─ Parent1
   │  └─ GrandParent
   └─ Parent2
`;

const tree = {};

module.exports = {
  signature,
  description,
  register: (program) => {
    program
      .command(signature, {noHelp: true})
      .description(description)
      .on('--help', () => console.log(help))
      .action(async (contractPath) => {
        
        // Retrieve contract artifacts.
        const { artifacts, basedir } = await getArtifacts(contractPath);

        // Retrieve the ast.
        const ast = artifacts.ast;
        if(!ast) throw new Error('AST data not found.');

        // Retrieve the target contract definition node.
        const rootContractName = path.basename(contractPath).split('.')[0];
        const rootContractDefinition = astUtil.findNodeWithTypeAndName(ast, 'ContractDefinition', rootContractName);

        // Start the inheritance tree structure.
        tree[rootContractName] = {};
        await traverseContractParents(ast, rootContractDefinition, tree[rootContractName], basedir);

        // Print tree after all branches
        // have been traversed.
        console.log(treeify.asTree(tree, true));
      });
  }
};

async function traverseContractParents(ast, contractDefinition, branch, basedir) {
  const parents = contractDefinition.baseContracts;
  for(let i = 0; i < parents.length; i++) {
    const parent = parents[i];
    const parentName = parent.baseName.name;
    branch[parentName] = {};
    let parentDefinition = astUtil.findNodeWithTypeAndName(ast, 'ContractDefinition', parentName);
    if(parentDefinition) traverseContractParents(ast, parentDefinition, branch[parentName], basedir);
    else { // Target definition may be in another file.
      const baseContractPath = `${basedir}/${parentName}.json`;
      const { artifacts }= await getArtifacts(baseContractPath);
      const baseContractAst = artifacts.ast;
      if(!baseContractAst) throw new Error('AST data not found.');
      parentDefinition = astUtil.findNodeWithTypeAndName(baseContractAst, 'ContractDefinition', parentName);
      if(parentDefinition) traverseContractParents(ast, parentDefinition, branch[parentName], basedir);
      else throw new Error(`Parent contract definition not found: ${parentName}`);
    }
  }
}
