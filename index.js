import {highLevelParser} from 'noncooperatehk-data-handler';
import indexJson from './index.json'
import fs from 'fs';
import _ from 'lodash';
import Ajv from "ajv";
import frontMatterSchema from './schema/frontMatterSchema.json'
import geolocationSchema from './schema/geolocationSchema.json'


const fsPromises = fs.promises;

if (process.argv.length < 3) {
  console.log(`usage: node index.js filePath`);
  process.exit(1);
}

let fileName = process.argv[2];

async function main(fileName) {
  let fullPath = `${__dirname}/${fileName}`;
  let [frontMatterJson, ast, mdStr] = await highLevelParser.parseFile(fullPath);
  if (!_.get(frontMatterJson, 'id')) throw new FormatException(`missing id in frontMatter. received: ${frontMatterJson}`);

  await validateFrontMatter(frontMatterJson);

  await updateIndexJson(frontMatterJson);
  console.log('index.json updated')

  await updateAstJson(frontMatterJson.id, ast);
  console.log('ast.json updated')

  await updateMarkDownJson(frontMatterJson.id, mdStr);
  console.log('markdown updated')
}

async function validateFrontMatter(frontMatterJson) {
  const ajv = new Ajv({schemas: [frontMatterSchema, geolocationSchema]}); // options can be passed, e.g. {allErrors: true}
  const validate = ajv.getSchema('http://noncooperatehk.com/frontmatter.schema.json');
  const valid = validate(frontMatterJson);
  if (!valid) {
    throw new FormatException(JSON.stringify(validate.errors, null, "  "))
  }
}

async function updateAstJson(companyId, markdownAST) {
  let filePath = `${__dirname}/company/ast/${companyId}.json`;
  return fsPromises.writeFile(filePath, JSON.stringify(markdownAST, null, '  '));
}

async function updateMarkDownJson(companyId, markDownStr) {
  let filePath = `${__dirname}/company/md/${companyId}.json`;
  let jsonContent = {
    md: markDownStr
  };
  return fsPromises.writeFile(filePath, JSON.stringify(jsonContent, null, '  '));
}

async function updateIndexJson(frontMatterJson) {
  let objectWithKeyRenamed = _.mapKeys(frontMatterJson, (value, key) => key === 'id' ? 'companyId' : key);
  let filePath = `${__dirname}/index.json`;
  let updated = _.chain(indexJson)
    .filter(x => x.companyId !== frontMatterJson.id)
    .concat([objectWithKeyRenamed])
    .sortBy('companyId')
    .value();
  return fsPromises.writeFile(filePath, JSON.stringify(updated, null, '  '));
}

function FormatException(message) {
  this.message = message;
  this.name = 'FormatException';
}

main(fileName).then(r => console.log(`done`)).catch(e => console.log(e));
