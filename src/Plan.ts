import Course from "./Course";
import { RequirementWithCourses } from "./Requirements";

export interface RegisteredCreditCounts {
    acquired: number;
    registered: number;
}

export default interface Plan {
    readonly courseToStatus: ReadonlyMap<Course, RegistrationStatus>;
    readonly courseToRequirement: ReadonlyMap<Course, RequirementWithCourses>;
    readonly requirementToOthersCount: ReadonlyMap<RequirementWithCourses, RegisteredCreditCounts>;
    readonly selectionNameToOptionName: ReadonlyMap<string, string>;
}

export type CourseCode = string;
export type RequirementId = string;

export enum RegistrationStatus {
    Unregistered = 0,
    Registered = 1,
    Acquired = 2,
}

export interface PlanJSON {
    readonly courseToStatus: readonly [CourseCode, RegistrationStatus][];
    readonly courseToRequirement: readonly [CourseCode, RequirementId][];
    readonly requirementToOthersCount: readonly [RequirementId, RegisteredCreditCounts][];
    readonly selectionNameToOptionName: readonly [string, string][];
}

export const toJSON =
    ({ courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName }: Plan): PlanJSON => ({
        courseToStatus: [...courseToStatus].map(([course, status]) => [course.code, status]),
        courseToRequirement: [...courseToRequirement].map(([course, requirement]) => [course.code, requirement.id]),
        requirementToOthersCount: [...requirementToOthersCount].map(([requirement, creditsCounts]) => [requirement.id, creditsCounts]),
        selectionNameToOptionName: [...selectionNameToOptionName],
    });

export const fromJSON = (json: PlanJSON, { codeToCourse, idToRequirement }: {
    codeToCourse: ReadonlyMap<CourseCode, Course>,
    idToRequirement: ReadonlyMap<RequirementId, RequirementWithCourses>,
}): Plan => {
    const courseToStatus = new Map([...json.courseToStatus].map(([code, status]) => {
        const course = codeToCourse.get(code);
        if (course === undefined) { throw new Error(); }
        return [course, status];
    }));

    const courseToRequirement = new Map([...json.courseToRequirement].map(([courseCode, requirementId]) => {
        const course = codeToCourse.get(courseCode);
        const requirement = idToRequirement.get(requirementId);

        if (course === undefined) { throw new Error(); }
        if (requirement === undefined) { throw new Error(); }

        return [course, requirement];
    }));

    const requirementToOthersCount = new Map([...json.requirementToOthersCount].map(([requirementId, creditsCounts]) => {
        const requirement = idToRequirement.get(requirementId);
        if (requirement === undefined) { throw new Error(); }
        return [requirement, creditsCounts];
    }));

    const selectionNameToOptionName = new Map(json.selectionNameToOptionName);

    return { courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName }
}

export const emptyPlan: Plan = {
    courseToStatus: new Map(),
    courseToRequirement: new Map(),
    requirementToOthersCount: new Map(),
    selectionNameToOptionName: new Map(),
};
