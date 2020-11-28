import type Course from "../Course";
import Plan, { fromJSON, PlanJSON, RegisteredCreditCounts, RegistrationStatus, toJSON } from "../Plan";
import Requirements, { getRequirementAndDictionaryFromJSON, Range, RequirementsJSON, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "../Requirements";

function* simplyEnumerateCourseCombinations(
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
            const slicedUnselectedList = unselectedCourses.slice(index + 1);
            const courseCombinations = simplyEnumerateCourseCombinations(
                requiredCreditsCount,
                slicedUnselectedList,
                selectedCreditsCountSum + course.creditCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditCount),
            )
            yield* courseCombinations;
        }
    }
}

function* enumerateCourseCombinations(
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
            const slicedUnselectedList = registeredCourses.slice(index + 1);
            const courseCombinations = simplyEnumerateCourseCombinations(
                requiredCreditsCount,
                slicedUnselectedList,
                registeredCreditsCountSum + course.creditCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditCount),
            )
            yield* courseCombinations;
        }
        // if (acquiredCreditsCountSum < requiredCreditsCount.max) { // Always true
        for (const [index, course] of acquiredCourses.entries()) {
            const slicedUnselectedList = acquiredCourses.slice(index + 1);
            const courseCombinations = enumerateCourseCombinations(
                requiredCreditsCount,
                registeredCourses,
                slicedUnselectedList,
                registeredCreditsCountSum + course.creditCount,
                acquiredCreditsCountSum + course.creditCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditCount),
            )
            yield* courseCombinations;
        }
        // }
    } else if (acquiredCreditsCountSum < requiredCreditsCount.max) {
        for (const [index, course] of acquiredCourses.entries()) {
            const slicedUnselectedList = acquiredCourses.slice(index + 1);
            const courseCombinations = simplyEnumerateCourseCombinations(
                requiredCreditsCount,
                slicedUnselectedList,
                acquiredCreditsCountSum + course.creditCount,
                [...selectedCourses, course],
                Math.min(selectedCreditsCountMin, course.creditCount),
            )
            yield* courseCombinations;
        }
    }
}

const pickRequirementWithFewestCombinations = (requirementAndGeneratorPairs: readonly {
    requirement: RequirementWithCourses,
    generator: Generator<readonly Course[], void, undefined>,
}[]): {
    requirement: RequirementWithCourses,
    combinations: readonly (readonly Course[])[],
} => {
    const withCombinationArray: readonly {
        requirement: RequirementWithCourses,
        generator: Generator<readonly Course[], void, undefined>,
        combinations: (readonly Course[])[],
    }[] = requirementAndGeneratorPairs.map(({ requirement, generator }) => ({
        requirement, generator,
        combinations: [],
    }));
    while (true) {
        for (const { requirement, generator, combinations } of withCombinationArray) {
            const result = generator.next();
            if (result.done) {
                return { requirement, combinations };
            } else {
                combinations.push(result.value);
            }
        }
    }
}

function* constructAssignments(requirements: readonly RequirementWithCourses[], plan: Plan): Generator<Plan, void, undefined> {
    if (requirements.length === 0) {
        yield plan;
        return;
    }

    const requirementAndGeneratorPairs: readonly {
        requirement: RequirementWithCourses,
        generator: Generator<readonly Course[], void, undefined>,
    }[] = requirements.map(requirement => {
        const registeredCourses = requirement.courses.filter(course => plan.courseToRequirement.get(course) === undefined && plan.courseToStatus.get(course) === RegistrationStatus.Registered);
        const acquiredCourses = requirement.courses.filter(course => plan.courseToRequirement.get(course) === undefined && plan.courseToStatus.get(course) === RegistrationStatus.Acquired);
        const generator = enumerateCourseCombinations(
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

    const {
        requirement: pickedRequirement,
        combinations: pickedCombinations
    } = pickRequirementWithFewestCombinations(requirementAndGeneratorPairs);

    for (const combination of pickedCombinations) {
        const plan0: Plan = {
            ...plan,
            courseToRequirement: new Map([
                ...plan.courseToRequirement,
                ...combination.map(course => [course, pickedRequirement] as const),
            ])
        };
        const plans = constructAssignments(requirements.filter(requirement => requirement !== pickedRequirement), plan0)
        yield* plans;
    }
}

function* findAssignments0(requirement: Requirements, plan: Plan): Generator<readonly Plan[], void, undefined> {
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
    for (const plan1 of constructAssignments(requirements, plan0)) {
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
    if (requirements[0] === undefined) {
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
            if (child !== undefined) {
                yield* enumerateOptionsSelections(child, selectionNameToOptionName);
            }
        }
    } else if (requirement instanceof RequirementWithChildren) {
        yield* enumerateOptionsSelections0(requirement.children, selectionNameToOptionName);
    } else {
        yield selectionNameToOptionName;
    }
}

function* findAssignments(requirement: Requirements, plan: Plan): Generator<readonly Plan[], void, undefined> {
    let plans0: readonly Plan[] = [];
    for (const selectionNameToOptionName of enumerateOptionsSelections(requirement, new Map())) {
        let plans1: readonly Plan[] = plans0;
        for (const plans2 of findAssignments0(requirement, { ...plan, selectionNameToOptionName })) {
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

    for (const plans of findAssignments(requirement, plan)) {
        postMessage(plans.map(toJSON));
    }
    postMessage('done');
});
