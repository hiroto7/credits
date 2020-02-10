import Requirements, { isRange, Range, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from ".";
import Course from "../Course";
import RequirementsJSON from "./RequirementsJSON";

interface RequirementAndDictionary {
    readonly requirement: Requirements;
    readonly nameToRequirement: ReadonlyMap<string, RequirementWithCourses>;
}

const numberOrRangeToRange = (numberOrRange: number | Range): Range =>
    isRange(numberOrRange) ? numberOrRange : {
        min: numberOrRange,
        max: numberOrRange,
    };

const getInnerRequirementAndDictionaryFromJSON = (
    json: RequirementsJSON,
    codeToCourse: ReadonlyMap<string, Course>,
    selectionNameToCount: Map<string, number>
): RequirementAndDictionary => {
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
            nameToRequirement: new Map([[requirement.name, requirement]]),
        };
    } else if ('children' in json) {
        const requirementAndDictionaryPairs = json.children.map(child => getInnerRequirementAndDictionaryFromJSON(child, codeToCourse, selectionNameToCount));
        const requirement = new RequirementWithChildren({
            name: json.name,
            description: json.description,
            children: requirementAndDictionaryPairs.map(({ requirement }) => requirement),
            creditsCount: json.creditsCount === undefined ? undefined : numberOrRangeToRange(json.creditsCount),
        });
        return {
            requirement,
            nameToRequirement: new Map(
                requirementAndDictionaryPairs.flatMap(({ nameToRequirement: dictionary }) => [...dictionary.entries()])
            ),
        };
    } else {
        const selectionCount = selectionNameToCount.get(json.selectionName) || 0;
        selectionNameToCount.set(json.selectionName, selectionCount + 1);
        const optionAndDictionaryArray = json.options.map(optionJSON => {
            if ('requirement' in optionJSON) {
                const { requirement, nameToRequirement: dictionary } = getInnerRequirementAndDictionaryFromJSON(optionJSON.requirement, codeToCourse, selectionNameToCount);
                return {
                    option: { requirement, name: optionJSON.name },
                    dictionary,
                };
            } else {
                const { requirement, nameToRequirement: dictionary } = getInnerRequirementAndDictionaryFromJSON(optionJSON, codeToCourse, selectionNameToCount);
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
            nameToRequirement: new Map(
                optionAndDictionaryArray.flatMap(({ dictionary }) => [...dictionary.entries()])
            )
        };
    }
};

const getRequirementAndDictionaryFromJSON = (
    json: RequirementsJSON,
    codeToCourse: ReadonlyMap<string, Course>
) => getInnerRequirementAndDictionaryFromJSON(json, codeToCourse, new Map())

export default getRequirementAndDictionaryFromJSON;