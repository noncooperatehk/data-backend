import {highLevelParser} from 'noncooperatehk-data-handler';
import fs from 'fs';
import _ from 'lodash';
import Ajv from "ajv";
import frontMatterSchema from './schema/frontMatterSchema.json'
import geolocationSchema from './schema/geolocationSchema.json'
import indexJson from './location/locations.json'


const fsPromises = fs.promises;

if (process.argv.length < 3) {
  console.log(`usage: node index.js filePath`);
  process.exit(1);
}

let fileName = process.argv[2];

async function main(fileName) {
  let fullPath = `${__dirname}/${fileName}`;
  let [frontMatterJson, ast, mdStr] = await highLevelParser.parseFile(fullPath);
  if (!_.get(frontMatterJson, 'referenceArticleId')) throw new FormatException(`missing referenceArticleId in frontMatter. received: ${JSON.stringify(frontMatterJson)}`);

  await updateInputFileJson(fullPath, mdStr, frontMatterJson);
  console.log('inputFile json updated');

  await validateFrontMatter(frontMatterJson);

  await updateIndexJson(frontMatterJson);
  console.log('locations.json updated')

  let isDirectReference = frontMatterJson.referenceInformation === null
  if (isDirectReference) {
    await updateAstJson(frontMatterJson.referenceArticleId, ast);
    console.log('ast.json updated')

    await updateMarkDownJson(frontMatterJson.referenceArticleId, mdStr);
    console.log('markdown updated')
  } else {
    console.log('ast.json update skipped');
    console.log('markdown update skipped');
  }
}

async function updateInputFileJson(filePath, mdStr, frontMatter) {
  let outputFilePath = `${__dirname}/inputFile/${frontMatter.inputId}.json`;
  return fsPromises.writeFile(outputFilePath, JSON.stringify({md: mdStr, frontMatter}, null, '  '));
}

async function validateFrontMatter(frontMatterJson) {
  const ajv = new Ajv({schemas: [frontMatterSchema, geolocationSchema]}); // options can be passed, e.g. {allErrors: true}
  const validate = ajv.getSchema('http://noncooperatehk.com/frontmatter.schema.json');
  const valid = validate(frontMatterJson);
  if (!valid) {
    throw new FormatException(JSON.stringify(validate.errors, null, "  "))
  }
}

async function updateAstJson(referenceArticleId, markdownAST) {
  let filePath = `${__dirname}/article/ast/${referenceArticleId}.json`;
  return fsPromises.writeFile(filePath, JSON.stringify(markdownAST, null, '  '));
}

async function updateMarkDownJson(referenceArticleId, markDownStr) {
  let filePath = `${__dirname}/article/md/${referenceArticleId}.json`;
  let jsonContent = {
    md: markDownStr
  };
  return fsPromises.writeFile(filePath, JSON.stringify(jsonContent, null, '  '));
}

async function updateIndexJson(frontMatterJson) {
  /*input
    * output
    * location
    * {
    *   name: String,
    *   inputId: UUID, //for updating data
    *   referenceArticleId: UUID, //to relate an article
    *   referenceInformation: String, //for indirect reference, e.g. sub-companies
    *   previewImageUrl: String,
    *   address: String,
    *   latitude: Number,
    *   longitude: Number,
    *   status: String,
    *   tags: Array[String] //move company-wide tag into this tags, for searching purpose
    * }
    *
    * article md
    * {
    *   id: UUID,
    *   md: String
    * }
    *
    * article ast
    * {
    *   id: UUID,
    *   ast: JSON
    * }
  */
  let locations = frontMatterJson.addresses.map(address => {
    let tags = _.concat(frontMatterJson.tags, address.tags);
    let component = _.omit(frontMatterJson, ['tags', 'addresses']);
    return _.assign({...component}, address, {tags});
  })

  let filePath = `${__dirname}/location/locations.json`;
  let updated = _.chain(indexJson)
    .filter(x => x.inputId !== frontMatterJson.inputId)
    .concat(locations)
    .sortBy(['inputId', 'address'])
    .value();
  return fsPromises.writeFile(filePath, JSON.stringify(updated, null, '  '));
}

function FormatException(message) {
  this.message = message;
  this.name = 'FormatException';
}

main(fileName).then(r => console.log(`done`)).catch(e => console.log(e));
