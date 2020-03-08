import React, { useState } from 'react';
import { Button, ListGroup, Modal } from "react-bootstrap";
import Course from './Course';
import Plan, { RegistrationStatus } from './Plan';
import Requirements, { Range, RequirementWithCourses } from './Requirements';

function* f0(requiredCreditsCount: Range, unselectedCourses: readonly Course[], selectedCourses: readonly Course[], selectedCreditsCount: number): Generator<readonly Course[], void, undefined> {
    if (selectedCreditsCount >= requiredCreditsCount.max) {
        yield selectedCourses;
    } else if (unselectedCourses.length === 0) {
        if (selectedCreditsCount >= requiredCreditsCount.min) {
            yield selectedCourses;
        }
    } else {
        for (const [index, course] of unselectedCourses.entries()) {
            const slicedCourseList = unselectedCourses.slice(index + 1);
            yield* f0(requiredCreditsCount, slicedCourseList, [...selectedCourses, course], selectedCreditsCount + course.creditsCount);
        }
    }
}

const f1 = (requirement: Requirements, requirements: readonly RequirementWithCourses[], plan: Plan): {
    registered: { plan: Plan, creditsCount: number },
    acquired: { plan: Plan, creditsCount: number },
} | undefined => {
    if (requirements.length === 0) {
        const registeredCreditsCounts = requirement.getRegisteredCreditsCounts(plan, false);
        return {
            registered: {
                plan,
                creditsCount: registeredCreditsCounts.registered,
            },
            acquired: {
                plan,
                creditsCount: registeredCreditsCounts.acquired,
            },
        };
    }

    const t0 = requirements.reduce<{
        requirement: RequirementWithCourses,
        courseLists: readonly (readonly Course[])[],
    } | undefined>((previous, current) => {
        const courses0 = current.courses.filter(course => plan.courseToRequirement.get(course) === undefined && (plan.courseToStatus.get(course) ?? RegistrationStatus.Unregistered) !== RegistrationStatus.Unregistered);
        let courseLists: (readonly Course[])[] = [];
        for (const courses of f0(current.creditsCount, courses0, [], 0)) {
            if (previous !== undefined && courseLists.length + 1 >= previous.courseLists.length) {
                return previous;
            }
            courseLists.push(courses);
        }
        return {
            requirement: current,
            courseLists,
        }
    }, undefined);

    if (t0 === undefined) {
        throw new Error();
    }

    return t0.courseLists
        .map(courses => {
            const nextPlan: Plan = {
                ...plan,
                courseToRequirement: new Map([
                    ...plan.courseToRequirement,
                    ...courses.map(course => [course, t0.requirement] as const),
                ])
            };
            return nextPlan;
        })
        .reduce<{
            registered: { plan: Plan, creditsCount: number },
            acquired: { plan: Plan, creditsCount: number },
        } | undefined>((previous, current) => {
            const plans = f1(requirement, requirements.filter(requirement => requirement !== t0.requirement), current);
            if (plans === undefined) {
                return previous;
            } else {
                if (previous === undefined) {
                    return plans;
                } else {
                    return {
                        registered: plans.registered.creditsCount > previous.registered.creditsCount ?
                            plans.registered :
                            previous.registered,
                        acquired: plans.acquired.creditsCount > previous.acquired.creditsCount ?
                            plans.acquired :
                            previous.acquired,
                    };
                }
            }
        }, undefined);
}

const V0: React.FC<{
    requirement: Requirements,
    plan: Plan,
    onSubmit: (plan: Plan) => void,
}> = ({ requirement, plan, onSubmit }) => {
    const [show, setShow] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof f1>>(undefined);

    return (
        <>
            <Button
                variant="secondary"
                onClick={
                    () => {
                        setShow(true);
                        const requirements = requirement.f(plan.selectionNameToOptionName);
                        setResult(f1(requirement, requirements, { ...plan, courseToRequirement: new Map() }));
                    }
                }
            >
                要件を満たす割り当てを見つける
            </Button>
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>要件を満たす割り当てを見つける</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        result === undefined ? '要件を満たす割り当ては見つかりませんでした。' : (
                            <ListGroup>
                                <ListGroup.Item action onClick={() => { setShow(false); onSubmit(result.acquired.plan); }}>
                                    修得 {result.acquired.creditsCount}
                                </ListGroup.Item>
                                <ListGroup.Item action onClick={() => { setShow(false); onSubmit(result.registered.plan); }}>
                                    履修 {result.registered.creditsCount}
                                </ListGroup.Item>
                            </ListGroup>
                        )
                    }
                </Modal.Body>
            </Modal>
        </>
    );
}

export default V0;