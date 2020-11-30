import codeToCourse from "../courses";
import { getRequirementAndDictionaryFromJSON } from "../Requirements";
import coins17_0 from "./coins17.json";
import klis17_0 from "./klis17.json";
import mast17_0 from "./mast17.json";

const requirementAndDictionaryPairs = new Map([
  [
    "coins17",
    {
      id: "coins17",
      name: "情報科学類 / 2017年度入学",
      ...getRequirementAndDictionaryFromJSON(coins17_0, codeToCourse),
    },
  ],
  [
    "mast17",
    {
      id: "mast17",
      name: "情報メディア創成学類 / 2017年度入学",
      ...getRequirementAndDictionaryFromJSON(mast17_0, codeToCourse),
    },
  ],
  [
    "klis17",
    {
      id: "klis17",
      name: "知識情報・図書館学類 / 2017年度入学",
      ...getRequirementAndDictionaryFromJSON(klis17_0, codeToCourse),
    },
  ],
]);

export default requirementAndDictionaryPairs;
