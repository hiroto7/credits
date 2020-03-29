import { Range } from "./Requirements";

type RequirementsJSON = RequirementWithChildrenJSON | RequirementWithCoursesJSON | SelectionRequirementJSON;
export default RequirementsJSON;

export interface RequirementWithChildrenJSON {
    readonly name: string;
    readonly description?: string;
    readonly children: readonly RequirementsJSON[];
    readonly creditsCount?: number | Range;
}

export interface RequirementWithCoursesJSON {
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

export interface SelectionRequirementJSON {
    readonly name: string;
    readonly options: readonly OptionJSON[];
}
