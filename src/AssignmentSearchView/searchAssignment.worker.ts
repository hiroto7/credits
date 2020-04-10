import Course from "../Course";
import Plan, { fromJSON, PlanJSON, RegisteredCreditCounts, RegistrationStatus, toJSON } from "../Plan";
import Requirements, { getRequirementAndDictionaryFromJSON, Range, RequirementsJSON, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "../Requirements";

function* f0(
    requiredCreditsCount: Range,
    unselectedCourses: readonly Course[],
    selectedCreditsCountSum: number,
    selectedCourses: readonly Course[],
    selectedCreditsCountMin: number,
): Generator<readonly Course[], void, undefined> {
    if (
        selectedCreditsCountSum >= requiredCreditsCount.min &&
        selectedCreditsCountMin > selectedCreditsCountSum - requiredCreditsCount.max
    ) {
        yield selectedCourses;
    }
    if (selectedCreditsCountSum < requiredCreditsCount.max) {
        for (const [index, course] of unselectedCourses.entries()) {
            const slicedCourseList = unselectedCourses.slice(index + 1);
            const courseLists = f0(
                requiredCreditsCount,
                slicedCourseList,
                selectedCreditsCountSum + course.creditCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditCount),
            )
            yield* courseLists;
        }
    }
}

function* f1(
    requiredCreditsCount: Range,
    registeredCourses: readonly Course[],
    acquiredCourses: readonly Course[],
    registeredCreditsCountSum: number,
    acquiredCreditsCountSum: number,
    selectedCourses: readonly Course[],
    selectedCreditsCountMin: number,
): Generator<readonly Course[], void, undefined> {
    if ((
        acquiredCreditsCountSum >= requiredCreditsCount.min &&
        selectedCreditsCountMin > acquiredCreditsCountSum - requiredCreditsCount.max
    ) || (
            registeredCreditsCountSum >= requiredCreditsCount.min &&
            selectedCreditsCountMin > registeredCreditsCountSum - requiredCreditsCount.max
        )) {
        yield selectedCourses;
    }
    if (registeredCreditsCountSum < requiredCreditsCount.max) {
        for (const [index, course] of registeredCourses.entries()) {
            const slicedCourseList = registeredCourses.slice(index + 1);
            const courseLists = f0(
                requiredCreditsCount,
                slicedCourseList,
                registeredCreditsCountSum + course.creditCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditCount),
            )
            yield* courseLists;
        }
        // if (acquiredCreditsCountSum < requiredCreditsCount.max) {
        for (const [index, course] of acquiredCourses.entries()) {
            const slicedCourseList = acquiredCourses.slice(index + 1);
            const courseLists = f1(
                requiredCreditsCount,
                registeredCourses,
                slicedCourseList,
                registeredCreditsCountSum + course.creditCount,
                acquiredCreditsCountSum + course.creditCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditCount),
            )
            yield* courseLists;
        }
        // }
    } else {
        if (acquiredCreditsCountSum < requiredCreditsCount.max) {
            for (const [index, course] of acquiredCourses.entries()) {
                const slicedCourseList = acquiredCourses.slice(index + 1);
                const courseLists = f0(
                    requiredCreditsCount,
                    slicedCourseList,
                    acquiredCreditsCountSum + course.creditCount,
                    [...selectedCourses, course],
                    Math.min(selectedCreditsCountMin, course.creditCount),
                )
                yield* courseLists;
            }
        }
    }
}

const f2 = (array: readonly {
    requirement: RequirementWithCourses,
    generator: Generator<readonly Course[], void, undefined>,
}[]): {
    requirement: RequirementWithCourses,
    courseLists: readonly (readonly Course[])[],
} => {
    const array1: readonly {
        requirement: RequirementWithCourses,
        generator: Generator<readonly Course[], void, undefined>,
        courseLists: (readonly Course[])[],
    }[] = array.map(({ requirement, generator }) => ({
        requirement, generator,
        courseLists: [],
    }));
    while (true) {
        for (const { requirement, generator, courseLists } of array1) {
            const result = generator.next();
            if (result.done) {
                return { requirement, courseLists };
            } else {
                courseLists.push(result.value);
            }
        }
    }
}

function* f3(requirements: readonly RequirementWithCourses[], plan: Plan): Generator<Plan, void, undefined> {
    if (requirements.length === 0) {
        yield plan;
        return;
    }

    const t0: readonly {
        requirement: RequirementWithCourses,
        generator: Generator<readonly Course[], void, undefined>,
    }[] = requirements.map(requirement => {
        const registeredCourses = requirement.courses.filter(course => plan.courseToRequirement.get(course) === undefined && plan.courseToStatus.get(course) === RegistrationStatus.Registered);
        const acquiredCourses = requirement.courses.filter(course => plan.courseToRequirement.get(course) === undefined && plan.courseToStatus.get(course) === RegistrationStatus.Acquired);
        const generator = f1(
            requirement.creditCount,
            registeredCourses,
            acquiredCourses,
            plan.requirementToOthersCount.get(requirement)?.registered ?? 0,
            plan.requirementToOthersCount.get(requirement)?.acquired ?? 0,
            [],
            Infinity,
        );
        return { requirement, generator };
    });

    const t1 = f2(t0);

    for (const courses of t1.courseLists) {
        const plan0: Plan = {
            ...plan,
            courseToRequirement: new Map([
                ...plan.courseToRequirement,
                ...courses.map(course => [course, t1.requirement] as const),
            ])
        };
        const plans = f3(requirements.filter(requirement => requirement !== t1.requirement), plan0)
        yield* plans;
    }
}

function* searchAssignment0(requirement: Requirements, plan: Plan): Generator<readonly Plan[], void, undefined> {
    const requirements = requirement.getVisibleRequirements(plan.selectionNameToOptionName);
    const plan0 = { ...plan, courseToRequirement: new Map() };
    let planAndCreditCountsPairs: {
        acquired: {
            readonly plan: Plan,
            readonly creditCounts: RegisteredCreditCounts,
        },
        registered: {
            readonly plan: Plan,
            readonly creditCounts: RegisteredCreditCounts,
        }
    } | undefined = undefined;
    for (const plan1 of f3(requirements, plan0)) {
        const creditCounts = requirement.getRegisteredCreditCounts(plan1, false);
        if (planAndCreditCountsPairs === undefined) {
            planAndCreditCountsPairs = {
                acquired: {
                    plan: plan1,
                    creditCounts,
                },
                registered: {
                    plan: plan1,
                    creditCounts,
                },
            }
            yield [plan1];
        } else {
            const acquired: {
                readonly plan: Plan;
                readonly creditCounts: RegisteredCreditCounts;
            } = creditCounts.acquired > planAndCreditCountsPairs.acquired.creditCounts.acquired || (
                creditCounts.acquired === planAndCreditCountsPairs.acquired.creditCounts.acquired &&
                creditCounts.registered > planAndCreditCountsPairs.acquired.creditCounts.registered
            ) ? {
                        plan: plan1,
                        creditCounts,
                    } : planAndCreditCountsPairs.acquired;

            const registered: {
                readonly plan: Plan;
                readonly creditCounts: RegisteredCreditCounts;
            } = creditCounts.registered > planAndCreditCountsPairs.registered.creditCounts.registered || (
                creditCounts.registered === planAndCreditCountsPairs.registered.creditCounts.registered &&
                creditCounts.acquired > planAndCreditCountsPairs.registered.creditCounts.acquired
            ) ? {
                        plan: plan1,
                        creditCounts,
                    } : planAndCreditCountsPairs.registered;

            if (acquired !== planAndCreditCountsPairs.acquired || registered !== planAndCreditCountsPairs.registered) {
                planAndCreditCountsPairs = { acquired, registered };
                if (acquired.plan === registered.plan) {
                    yield [plan1];
                } else {
                    yield [acquired.plan, registered.plan];
                }
            }
        }
    }
}

function* enumerateOptionsSelections0(requirements: readonly Requirements[], selectionNameToOptionName: ReadonlyMap<string, string>): Generator<ReadonlyMap<string, string>, void, unknown> {
    if (requirements.length === 0) {
        yield selectionNameToOptionName;
    } else {
        const firstRequirement = requirements[0];
        const remainingRequirements = requirements.slice(1);
        for (const selectionNameToOptionName1 of enumerateOptionsSelections(firstRequirement, selectionNameToOptionName)) {
            yield* enumerateOptionsSelections0(remainingRequirements, selectionNameToOptionName1);
        }
    }
}

function* enumerateOptionsSelections(requirement: Requirements, selectionNameToOptionName: ReadonlyMap<string, string>): Generator<ReadonlyMap<string, string>, void, undefined> {
    if (requirement instanceof SelectionRequirement) {
        const optionName = selectionNameToOptionName.get(requirement.name);
        if (optionName === undefined) {
            for (const option of requirement.options) {
                yield* enumerateOptionsSelections(option.requirement, new Map([
                    ...selectionNameToOptionName,
                    [requirement.name, option.name],
                ]));
            }
        } else {
            const child = requirement.optionNameToRequirement.get(optionName);
            if (child === undefined) {
                yield selectionNameToOptionName;
            } else {
                yield* enumerateOptionsSelections(child, selectionNameToOptionName);
            }
        }
    } else if (requirement instanceof RequirementWithChildren) {
        yield* enumerateOptionsSelections0(requirement.children, selectionNameToOptionName);
    } else {
        yield selectionNameToOptionName;
    }
}

function* searchAssignment(requirement: Requirements, plan: Plan): Generator<readonly Plan[], void, undefined> {
    let plans0: readonly Plan[] = [];
    for (const selectionNameToOptionName of enumerateOptionsSelections(requirement, new Map())) {
        let plans1: readonly Plan[] = [];
        for (const plans2 of searchAssignment0(requirement, { ...plan, selectionNameToOptionName })) {
            plans1 = [...plans0, ...plans2];
            yield plans1;
        }
        plans0 = plans1;
    }
}

globalThis.addEventListener('message', event => {
    const { requirementJSON, planJSON, codeToCourse }: {
        requirementJSON: RequirementsJSON,
        planJSON: PlanJSON,
        codeToCourse: ReadonlyMap<string, Course>,
    } = event.data;

    const { requirement, idToRequirement } = getRequirementAndDictionaryFromJSON(requirementJSON, codeToCourse);
    const plan = fromJSON(planJSON, { codeToCourse, idToRequirement });

    for (const plans of searchAssignment(requirement, plan)) {
        postMessage(plans.map(toJSON));
    }
    postMessage('done');
});
