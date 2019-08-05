import {highLevelParser} from "noncooperatehk-data-handler";
import indexJson from "./index.json"
import fs from "fs";
import _ from "lodash";

const fsPromises = fs.promises;

if (process.argv.length < 3) {
  console.log(`usage: node index.js filePath`);
  process.exit(1);
}

let filName = process.argv[2];

async function main(fileName) {
  let fullPath = `${__dirname}/${fileName}`;
  let [frontMatterJson, ast, mdStr] = await highLevelParser.parseFile(fullPath);
  await updateIndexJson(frontMatterJson);
}

async function updateIndexJson(frontMatterJson) {
  if (!_.get(frontMatterJson, 'id')) throw new FormatException(`missing id in frontMatter. received: ${frontMatterJson}`);
  let objectWithKeyRenamed = _.mapKeys(frontMatterJson, (value, key) => key === 'id' ? 'companyId' : key);
  let filePath = `${__dirname}/index.json`;
  let updated = indexJson
    .filter(x => x.companyId !== frontMatterJson.id)
    .concat([objectWithKeyRenamed]);
  return fsPromises.writeFile(filePath, JSON.stringify(updated, null, "  "));
}

function FormatException(message) {
  this.message = message;
  this.name = 'FormatException';
}

main(filName).then(r => console.log(r)).catch(e => console.log(e.stack));
