import codeToCourse from '../courses';
import Requirements, { isRange, Range, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from '../Requirements';
import coins17_0 from './coins17.json';
import klis17_0 from './klis17.json';
import mast17_0 from './mast17.json';

type RequirementsJSON = RequirementWithChildrenJSON | RequirementWithCoursesJSON | SelectionRequirementJSON;

interface RequirementWithChildrenJSON {
    readonly name: string;
    readonly description?: string;
    readonly children: readonly RequirementsJSON[];
    readonly creditsCount?: number | Range;
}

interface RequirementWithCoursesJSON {
    readonly name: string;
    readonly description?: string;
    readonly courses: readonly string[];
    readonly creditsCount: number | Range;
    readonly allowsOthers?: boolean;
}

type OptionJSON = {
    readonly name: string;
    readonly requirement: RequirementsJSON;
} | RequirementsJSON;

interface SelectionRequirementJSON {
    readonly name?: string;
    readonly selectionName: string;
    readonly options: readonly OptionJSON[];
}

interface RequirementAndDictionary {
    readonly requirement: Requirements;
    readonly dictionary: ReadonlyMap<string, RequirementWithCourses>;
}

const numberOrRangeToRange = (numberOrRange: number | Range): Range =>
    isRange(numberOrRange) ? numberOrRange : {
        min: numberOrRange,
        max: numberOrRange,
    };

const getRequirementAndDictionaryFromJSON = (json: RequirementsJSON, selectionNameToCount: Map<string, number>): RequirementAndDictionary => {
    if ('courses' in json) {
        const requirement = new RequirementWithCourses({
            name: json.name,
            description: json.description,
            creditsCount: numberOrRangeToRange(json.creditsCount),
            courses: json.courses.map(courseCode => {
                const course = codeToCourse.get(courseCode);
                if (course === undefined) { throw new Error(`科目番号 ${courseCode} は定義されていません。`); }
                return course;
            }),
            allowsOthers: json.allowsOthers,
        });
        return {
            requirement,
            dictionary: new Map([[requirement.name, requirement]]),
        };
    } else if ('children' in json) {
        const requirementAndDictionaryArray = json.children.map(child => getRequirementAndDictionaryFromJSON(child, selectionNameToCount));
        const requirement = new RequirementWithChildren({
            name: json.name,
            description: json.description,
            children: requirementAndDictionaryArray.map(({ requirement }) => requirement),
            creditsCount: json.creditsCount === undefined ? undefined : numberOrRangeToRange(json.creditsCount),
        });
        return {
            requirement,
            dictionary: new Map(
                requirementAndDictionaryArray.flatMap(({ dictionary }) => [...dictionary.entries()])
            ),
        };
    } else {
        const selectionCount = selectionNameToCount.get(json.selectionName) || 0;
        selectionNameToCount.set(json.selectionName, selectionCount + 1);
        const optionAndDictionaryArray = json.options.map(optionJSON => {
            if ('requirement' in optionJSON) {
                const { requirement, dictionary } = getRequirementAndDictionaryFromJSON(optionJSON.requirement, selectionNameToCount);
                return {
                    option: { requirement, name: optionJSON.name },
                    dictionary,
                };
            } else {
                const { requirement, dictionary } = getRequirementAndDictionaryFromJSON(optionJSON, selectionNameToCount);
                return {
                    option: { requirement, name: requirement.name },
                    dictionary,
                };
            }
        })
        const requirement = new SelectionRequirement({
            name: `${json.selectionName}_${selectionCount}`,
            selectionName: json.selectionName,
            options: optionAndDictionaryArray.map(({ option }) => option),
        });
        return {
            requirement,
            dictionary: new Map(
                optionAndDictionaryArray.flatMap(({ dictionary }) => [...dictionary.entries()])
            )
        };
    }
};

const requirementAndDictionaryMap = new Map([
    ['coins17', getRequirementAndDictionaryFromJSON(coins17_0, new Map())],
    ['mast17', getRequirementAndDictionaryFromJSON(mast17_0, new Map())],
    ['klis17', getRequirementAndDictionaryFromJSON(klis17_0, new Map())],
]);

export default requirementAndDictionaryMap;