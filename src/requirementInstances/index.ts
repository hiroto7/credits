import codeToCourse from '../courses';
import { getRequirementAndDictionaryFromJSON } from '../Requirements';
import coins17_0 from './coins17.json';
import klis17_0 from './klis17.json';
import mast17_0 from './mast17.json';

const requirementAndDictionaryMap = new Map([
    ['coins17', { name: 'coins17', ...getRequirementAndDictionaryFromJSON(coins17_0, codeToCourse, new Map()) }],
    ['mast17', { name: 'mast17', ...getRequirementAndDictionaryFromJSON(mast17_0, codeToCourse, new Map()) }],
    ['klis17', { name: 'klis17', ...getRequirementAndDictionaryFromJSON(klis17_0, codeToCourse, new Map()) }],
]);

export default requirementAndDictionaryMap;