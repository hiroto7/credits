import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";
import { RegisteredCreditsCounts, RequirementWithCourses } from "./Requirements";

export type CourseCode = string;
export type RequirementName = string;

export interface PlanJSON {
    readonly courseToStatus: readonly [CourseCode, RegistrationStatus][];
    readonly courseToRequirement: readonly [CourseCode, RequirementName][];
    readonly requirementToOthersCount: readonly [RequirementName, RegisteredCreditsCounts][];
    readonly selectionNameToOptionName: readonly [string, string][];
}

export default interface Plan {
    readonly courseToStatus: ReadonlyMap<Course, RegistrationStatus>;
    readonly courseToRequirement: ReadonlyMap<Course, RequirementWithCourses>;
    readonly requirementToOthersCount: ReadonlyMap<RequirementWithCourses, RegisteredCreditsCounts>;
    readonly selectionNameToOptionName: ReadonlyMap<string, string>;
}

export const toJSON =
    ({ courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName }: Plan): PlanJSON => ({
        courseToStatus: [...courseToStatus].map(([course, status]) => [course.code, status]),
        courseToRequirement: [...courseToRequirement].map(([course, requirement]) => [course.code, requirement.name]),
        requirementToOthersCount: [...requirementToOthersCount].map(([requirement, creditsCounts]) => [requirement.name, creditsCounts]),
        selectionNameToOptionName: [...selectionNameToOptionName],
    });

export const emptyPlan: Plan = {
    courseToStatus: new Map(),
    courseToRequirement: new Map(),
    requirementToOthersCount: new Map(),
    selectionNameToOptionName: new Map(),
};