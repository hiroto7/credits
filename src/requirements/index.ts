import { codeToCourse } from '../courses';
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

interface SelectionRequirementJSON {
    readonly name?: string;
    readonly selectionName: string;
    readonly options: readonly ({
        name: string;
        requirement: RequirementsJSON;
    } | RequirementsJSON)[];
}

const numberOrRangeToRange = (numberOrRange: number | Range): Range =>
    isRange(numberOrRange) ? numberOrRange : {
        min: numberOrRange,
        max: numberOrRange,
    };

const convertJSONToRichRequirement = (json: RequirementsJSON, selectionNameToCount: Map<string, number>): Requirements => {
    if ('courses' in json) {
        return new RequirementWithCourses({
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
    } else if ('children' in json) {
        return new RequirementWithChildren({
            name: json.name,
            description: json.description,
            children: json.children.map(child => convertJSONToRichRequirement(child, selectionNameToCount)),
            creditsCount: json.creditsCount === undefined ? undefined : numberOrRangeToRange(json.creditsCount),
        });
    } else {
        const selectionCount = selectionNameToCount.get(json.selectionName) || 0;
        selectionNameToCount.set(json.selectionName, selectionCount + 1);
        return new SelectionRequirement({
            name: `${json.selectionName}_${selectionCount}`,
            selectionName: json.selectionName,
            options: json.options.map(option => {
                if ('requirement' in option) {
                    return {
                        name: option.name,
                        requirement: convertJSONToRichRequirement(option.requirement, selectionNameToCount),
                    };
                } else {
                    const requirement = convertJSONToRichRequirement(option, selectionNameToCount);
                    return {
                        name: requirement.name,
                        requirement
                    };
                }
            }),
        })
    }
}

export const { coins17, mast17, klis17 } = {
    coins17: convertJSONToRichRequirement(coins17_0, new Map()),
    mast17: convertJSONToRichRequirement(mast17_0, new Map()),
    klis17: convertJSONToRichRequirement(klis17_0, new Map()),
}

export const requirementsAndNames = {
    coins17: { name: 'coins17', requirement: coins17 },
    mast17: { name: 'mast17', requirement: mast17 },
    klis17: { name: 'klist17', requirement: klis17 },
}