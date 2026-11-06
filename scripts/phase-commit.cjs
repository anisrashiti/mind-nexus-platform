/* eslint-disable @typescript-eslint/no-require-imports */
// Local fallback for environments without the Git executable. Uses existing .git metadata.
const fs = require('node:fs');
const path = require('node:path');
const git = require(path.resolve('.tools/node_modules/isomorphic-git'));
async function main(){
  const dir=process.cwd();const matrix=await git.statusMatrix({fs,dir});
  const changed=matrix.filter(([file,head,work,stage])=>file!=='AGENTS.md'&&!(head===work&&work===stage));
  for(const [filepath,,work] of changed){if(work===0)await git.remove({fs,dir,filepath});else await git.add({fs,dir,filepath});}
  const sha=await git.commit({fs,dir,message:process.argv[2],author:{name:'Codex',email:'codex@local.invalid'}});
  console.log(sha);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
