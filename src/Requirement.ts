import Course from "./Course";

abstract class Requirement {
    constructor(readonly title: string, readonly description?: string) { }
}

export interface RequirementWithChildrenInit {
    readonly title: string;
    readonly description?: string;
    readonly children: Iterable<Requirement>;
    readonly creditsCount?: number;
}

export class RequirementWithChildren extends Requirement implements RequirementWithChildrenInit {
    readonly children: readonly Requirement[];
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

export interface SelectionRequirementsInit {
    readonly title: string;
    readonly description?: string;
    readonly choices: Iterable<Requirement>
}

export class SelectionRequirements extends Requirement implements SelectionRequirementsInit {
    readonly choices: readonly Requirement[]
    constructor({ title, description, choices }: SelectionRequirementsInit) {
        super(title, description);
        this.choices = [...choices];
    }
}