import type Course from "../Course";
import Plan, { RegisteredCreditCounts, RegistrationStatus } from "../Plan";
import type { RequirementWithChildrenJSON, RequirementWithCoursesJSON, SelectionRequirementJSON } from './RequirementsJSON';

type Requirements = RequirementWithChildren | RequirementWithCourses | SelectionRequirement;
export default Requirements;

abstract class Requirement {
    readonly id: string
    readonly name: string;
    abstract getRegisteredCreditCounts(plan: Plan, includesExcess: boolean): RegisteredCreditCounts;
    abstract getRequiredCreditCount(selectionNameToOptionName: ReadonlyMap<string, string>): Range;
    abstract getVisibleRequirements(selectionNameToOptionName: ReadonlyMap<string, string>): readonly RequirementWithCourses[];
    constructor({ id, name }: { id: string, name: string }) {
        this.id = id;
        this.name = name;
    }
    getStatus(plan: Plan): RegistrationStatus {
        const requiredCreditCount = this.getRequiredCreditCount(plan.selectionNameToOptionName);
        const registeredCreditCounts = this.getRegisteredCreditCounts(plan, false);
        return registeredCreditCounts.acquired >= requiredCreditCount.min ?
            RegistrationStatus.Acquired :
            registeredCreditCounts.registered >= requiredCreditCount.min ?
                RegistrationStatus.Registered :
                RegistrationStatus.Unregistered;
    }
}

export interface Range {
    min: number;
    max: number;
}

export interface RequirementWithChildrenInit {
    readonly id: string;
    readonly name: string;
    readonly description?: string;
    readonly children: Iterable<Requirements>;
    readonly creditCount?: Range;
}

export class RequirementWithChildren extends Requirement implements RequirementWithChildrenInit {
    readonly description?: string;
    readonly children: readonly Requirements[];
    readonly creditCount?: Range;
    constructor({ id, name, description, children, creditCount }: RequirementWithChildrenInit) {
        super({ id, name });
        this.description = description
        this.children = [...children];
        this.creditCount = creditCount;
    }
    getRegisteredCreditCounts(plan: Plan, includesExcess: boolean): RegisteredCreditCounts {
        const creditCounts = this.children.reduce(
            (previous, child) => {
                const childRegisteredCreditCount = child.getRegisteredCreditCounts(plan, includesExcess);
                return {
                    acquired: previous.acquired + childRegisteredCreditCount.acquired,
                    registered: previous.registered + childRegisteredCreditCount.registered,
                }
            },
            { acquired: 0, registered: 0 }
        );
        return includesExcess || this.creditCount === undefined ? creditCounts : {
            acquired: Math.min(this.creditCount.max, creditCounts.acquired),
            registered: Math.min(this.creditCount.max, creditCounts.registered),
        };
    }
    getRequiredCreditCount(selectionNameToOptionName: ReadonlyMap<string, string>): Range {
        return this.creditCount === undefined ? this.children.reduce((previous, child) => {
            const childRequiredCreditCount = child.getRequiredCreditCount(selectionNameToOptionName);
            return {
                min: previous.min + childRequiredCreditCount.min,
                max: previous.max + childRequiredCreditCount.max,
            }
        }, { min: 0, max: 0 }) : this.creditCount;
    }
    getStatus(plan: Plan): RegistrationStatus {
        return Math.min(
            super.getStatus(plan),
            ...this.children.map(child => child.getStatus(plan))
        );
    }
    getVisibleRequirements(selectionNameToOptionName: ReadonlyMap<string, string>): readonly RequirementWithCourses[] {
        return this.children.flatMap(requirement => requirement.getVisibleRequirements(selectionNameToOptionName));
    }
    toJSON(): RequirementWithChildrenJSON {
        return {
            name: this.name,
            description: this.description,
            children: this.children.map(child => child.toJSON()),
            creditCount: this.creditCount,
        }
    }
}

export interface RequirementWithCoursesInit {
    readonly id: string;
    readonly name: string;
    readonly description?: string;
    readonly courses: Iterable<Course>;
    readonly creditCount: Range;
    readonly allowsOthers?: boolean;
}

export class RequirementWithCourses extends Requirement {
    readonly description?: string;
    readonly courses: readonly Course[];
    readonly creditCount: Range;
    readonly allowsOthers: boolean;
    constructor({ id, name, description, courses, creditCount, allowsOthers = false }: RequirementWithCoursesInit) {
        super({ id, name });
        this.description = description;
        this.courses = [...courses];
        this.creditCount = creditCount;
        this.allowsOthers = allowsOthers;
    }
    getRegisteredCreditCounts(plan: Plan, includesExcess: boolean): RegisteredCreditCounts {
        const othersCount = plan.requirementToOthersCount.get(this) || { acquired: 0, registered: 0 };
        const creditCounts = this.courses.reduce((previous, course): RegisteredCreditCounts => {
            const courseStatus = plan.courseToStatus.get(course) || RegistrationStatus.Unregistered;
            if (plan.courseToRequirement.get(course) === this) {
                return courseStatus === RegistrationStatus.Acquired ?
                    {
                        acquired: previous.acquired + course.creditCount,
                        registered: previous.registered + course.creditCount,
                    } :
                    courseStatus === RegistrationStatus.Registered ?
                        {
                            acquired: previous.acquired,
                            registered: previous.registered + course.creditCount,
                        } :
                        previous;
            } else {
                return previous;
            }
        }, othersCount);
        return includesExcess || this.creditCount === undefined ? creditCounts : {
            acquired: Math.min(this.creditCount.max, creditCounts.acquired),
            registered: Math.min(this.creditCount.max, creditCounts.registered),
        };
    }
    getRequiredCreditCount() {
        return this.creditCount;
    }
    getVisibleRequirements() {
        return [this] as const;
    }
    toJSON(): RequirementWithCoursesJSON {
        return {
            name: this.name,
            description: this.description,
            courses: this.courses.map(course => course.code),
            creditCount: this.creditCount,
            allowsOthers: this.allowsOthers,
        }
    }
}

interface Option {
    name: string;
    requirement: Requirements;
}

export interface SelectionRequirementInit {
    readonly id: string;
    readonly name: string;
    readonly options: Iterable<Option>;
}

export class SelectionRequirement extends Requirement implements SelectionRequirementInit {
    readonly name: string;
    readonly options: readonly Option[];
    readonly optionNameToRequirement: ReadonlyMap<string, Requirements>;
    constructor({ id, name, options: options0 }: SelectionRequirementInit) {
        super({ id, name });
        this.name = name;
        const options = [...options0]
        this.options = options;
        this.optionNameToRequirement = new Map(options.map(({ name, requirement }) => [name, requirement]));
    }
    getSelectedOptionName(selectionNameToOptionName: ReadonlyMap<string, string>) {
        const selectedOptionName = selectionNameToOptionName.get(this.name) || this.options[0].name;
        return selectedOptionName;
    }
    getSelectedRequirement(selectionNameToOptionName: ReadonlyMap<string, string>) {
        const selectedOptionName = this.getSelectedOptionName(selectionNameToOptionName);
        const selectedRequirement = this.optionNameToRequirement.get(selectedOptionName);
        return selectedRequirement;
    }
    getRegisteredCreditCounts(plan: Plan, includesExcess: boolean): RegisteredCreditCounts {
        const selectedRequirement = this.getSelectedRequirement(plan.selectionNameToOptionName);
        if (selectedRequirement === undefined) {
            return { acquired: 0, registered: 0 };
        } else {
            return selectedRequirement.getRegisteredCreditCounts(plan, includesExcess);
        }
    }
    getRequiredCreditCount(selectionNameToOptionName: ReadonlyMap<string, string>): Range {
        const selectedRequirement = this.getSelectedRequirement(selectionNameToOptionName);
        if (selectedRequirement === undefined) {
            return { min: 0, max: 0 };
        } else {
            return selectedRequirement.getRequiredCreditCount(selectionNameToOptionName);
        }
    }
    getVisibleRequirements(selectionNameToOptionName: ReadonlyMap<string, string>): readonly RequirementWithCourses[] {
        const selectedRequirement = this.getSelectedRequirement(selectionNameToOptionName);
        if (selectedRequirement === undefined) {
            return [];
        } else {
            return selectedRequirement.getVisibleRequirements(selectionNameToOptionName);
        }
    }
    toJSON(): SelectionRequirementJSON {
        return {
            name: this.name,
            options: this.options.map(({ name, requirement }) => ({
                name,
                requirement: requirement.toJSON(),
            }))
        }
    }
}
