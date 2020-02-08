import { Range } from ".";

type RequirementsJSON = RequirementWithChildrenJSON | RequirementWithCoursesJSON | SelectionRequirementJSON;
export default RequirementsJSON;

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
