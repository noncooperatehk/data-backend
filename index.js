import {highLevelParser} from "noncooperatehk-data-handler";

const contentStr = "---\n" +
  "test: 1\n" +
  "---" +
  "content";

async function main() {
  return highLevelParser.parseString(contentStr)
}

main().then(r => console.log(r)).catch(e => console.log(e.stack));
