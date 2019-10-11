import Course from "./Course";

type Requirements = RequirementWithChildren | RequirementWithCourses | SelectionRequirement;
export default Requirements;

abstract class Requirement {
    constructor(readonly title: string, readonly description?: string) { }
}

export interface RequirementWithChildrenInit {
    readonly title: string;
    readonly description?: string;
    readonly children: Iterable<Requirements>;
    readonly creditsCount?: number;
}

export class RequirementWithChildren extends Requirement implements RequirementWithChildrenInit {
    readonly children: readonly Requirements[];
    readonly creditsCount?: number;
    constructor({ title, description, children, creditsCount }: RequirementWithChildrenInit) {
        super(title, description);
        this.children = [...children];
        this.creditsCount = creditsCount;
    }
}

export interface RequirementWithCoursesInit {
    readonly title: string;
    readonly description?: string;
    readonly courses: Iterable<Course>;
    readonly creditsCount: number;
    readonly allowsOthers?: boolean;
}

export class RequirementWithCourses extends Requirement {
    readonly courses: readonly Course[];
    readonly creditsCount: number;
    readonly allowsOthers: boolean;
    constructor({ title, description, courses, creditsCount, allowsOthers = false }: RequirementWithCoursesInit) {
        super(title, description);
        this.courses = [...courses];
        this.creditsCount = creditsCount;
        this.allowsOthers = allowsOthers;
    }
}

export interface SelectionRequirementInit {
    readonly title: string;
    readonly description?: string;
    readonly choices: Iterable<Requirements>
}

export class SelectionRequirement extends Requirement implements SelectionRequirementInit {
    readonly choices: readonly Requirements[]
    constructor({ title, description, choices }: SelectionRequirementInit) {
        super(title, description);
        this.choices = [...choices];
    }
}