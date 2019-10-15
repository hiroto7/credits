import React, { useState } from 'react';
import { Accordion, Badge, Button, Dropdown, ListGroup } from "react-bootstrap";
import Course from "./Course";
import CourseList from "./CourseList";
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RegisteredCreditsCounts, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";

const CreditsCountLabelDelimiter = () => (<span className="text-muted"> / </span>)

const ExceededCreditsCountLabel = ({ creditsCount }: { creditsCount: number }) => (
    <>
        <span className="text-muted">(</span>
        +{creditsCount}
        <span className="text-muted">)</span>
    </>
);

const CreditsCountLabels = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
    requirement: Requirements,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
}) => {
    const creditsCount = requirement.getRegisteredCreditsCount({ courseToRequirement, courseToStatus, selectionToRequirement, requirementToOthersCount, includesExcess: false });
    const exceededCreditsCount = requirement.getRegisteredCreditsCount({ courseToRequirement, courseToStatus, selectionToRequirement, requirementToOthersCount, includesExcess: true });
    const requiredCreditsCount = requirement.getRequiredCreditsCount(selectionToRequirement);

    return (
        <div>
            <span>
                <span className="text-muted">習得</span>
                <> </>
                <strong className="text-success">{creditsCount.acquired}</strong>
                {exceededCreditsCount.acquired > creditsCount.acquired ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.acquired - creditsCount.acquired} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">履修</span>
                <> </>
                <strong className="text-primary">{creditsCount.registered}</strong>
                {exceededCreditsCount.registered > creditsCount.registered ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.registered - creditsCount.registered} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">必要</span>
                <> </>
                <strong>
                    {
                        requiredCreditsCount.min === requiredCreditsCount.max ?
                            requiredCreditsCount.min :
                            `${requiredCreditsCount.min}~${requiredCreditsCount.max}`
                    }
                </strong>
            </span>
        </div>
    )
};

export const RequirementSummaryView = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount }: {
    requirement: Requirements,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
}) => {
    const status = requirement.getStatus({ courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount });
    return (
        <>
            <h5 className="d-flex justify-content-between align-items-center">
                <div>{requirement.title}</div>
                <Badge className="ml-2 flex-shrink-0" variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                    {status === RegistrationStatus.Acquired ? '修得OK' : status === RegistrationStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </h5>
            <div>
                {requirement.description === undefined ? (<></>) : (<div className="text-muted">{requirement.description}</div>)}
                <CreditsCountLabels
                    requirement={requirement}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                />
            </div>
        </>
    );
}

const RequirementWithChildrenView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount, onCourseClick, onOthersClick, onSelectionChange }: {
    requirement: RequirementWithChildren,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersClick: (requirement: RequirementWithCourses) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => (
        <>
            <RequirementSummaryView
                requirement={requirement}
                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
            />
            <ListGroup className="mt-3">
                {
                    requirement.children.map(child => (
                        <ListGroup.Item key={child.title}>
                            <RequirementView
                                requirement={child} showsOnlyRegistered={showsOnlyRegistered}
                                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement}
                                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                                onOthersClick={onOthersClick} requirementToOthersCount={requirementToOthersCount}
                            />
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    );

const RequirementWithCoursesView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, onCourseClick, onOthersClick, selectionToRequirement, requirementToOthersCount }: {
    requirement: RequirementWithCourses,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersClick: () => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => {
    const useIsOpen = () => {
        const [isOpenWhenFalse, setIsOpenWhenFalse] = useState(false);
        const [isOpenWhenTrue, setIsOpenWhenTrue] = useState(true);
        return showsOnlyRegistered ? [isOpenWhenTrue, setIsOpenWhenTrue] as const : [isOpenWhenFalse, setIsOpenWhenFalse] as const;
    };

    const [isOpen, setIsOpen] = useIsOpen();

    const allCourses = requirement.courses;
    const registeredCourses = requirement.courses.filter(course =>
        courseToStatus.get(course) !== RegistrationStatus.Unregistered &&
        requirement === courseToRequirement.get(course)
    );

    return (
        <>
            <Accordion activeKey={isOpen ? '0' : ''}>
                <div className={`bg-white ${isOpen ? 'sticky-top' : ''}`}>
                    <RequirementSummaryView
                        requirement={requirement}
                        courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                        selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    />
                    {
                        (showsOnlyRegistered ? registeredCourses : allCourses).length === 0 ?
                            requirement.allowsOthers ? (
                                <Button block className="mt-3" variant="secondary" onClick={onOthersClick}>
                                    単位数を入力
                                </Button>
                            ) : (
                                    <Button block className="mt-3" variant="outline-secondary" disabled>
                                        {showsOnlyRegistered ? '履修する' : ''}科目はありません
                                    </Button>
                                ) : (
                                <Button
                                    block className="mt-3"
                                    onClick={() => setIsOpen(!isOpen)}
                                    variant={isOpen ? 'primary' : 'outline-secondary'}
                                >
                                    {showsOnlyRegistered ? '履修する' : ''}科目を{isOpen ? '非' : ''}表示
                                </Button>
                            )
                    }
                </div>
                {
                    [
                        { courses: allCourses, key: 'all', hidden: showsOnlyRegistered },
                        { courses: registeredCourses, key: 'registered', hidden: !showsOnlyRegistered },
                    ].map(({ courses, key, hidden }) => (
                        <Accordion.Collapse eventKey="0" key={key} hidden={hidden}>
                            {
                                courses.length === 0 ? (<></>) : (
                                    <div className="mt-3">
                                        <CourseList requirement={requirement} courses={courses}
                                            courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                                            onCourseClick={course => onCourseClick(course, requirement)}
                                        />
                                    </div>
                                )
                            }
                        </Accordion.Collapse>
                    ))
                }
            </Accordion>
        </>
    );
}

const SelectionRequirementView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount, onCourseClick, onOthersClick, onSelectionChange }: {
    requirement: SelectionRequirement,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersClick: (requirement: RequirementWithCourses) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => (
        <>
            <Dropdown>
                <Dropdown.Toggle id="" variant="secondary">{requirement.title} を変更</Dropdown.Toggle>

                <Dropdown.Menu style={{ zIndex: 1100 }}>
                    {
                        requirement.choices.map(choice => (
                            <Dropdown.Item key={choice.title}
                                active={choice === (selectionToRequirement.get(requirement) || requirement.choices[0])}
                                onClick={() => onSelectionChange(requirement, choice)}>
                                {choice.title}
                            </Dropdown.Item>
                        ))
                    }
                </Dropdown.Menu>
            </Dropdown>
            <div className="mt-3">
                <RequirementView
                    requirement={selectionToRequirement.get(requirement) || requirement.choices[0]}
                    showsOnlyRegistered={showsOnlyRegistered}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    onCourseClick={onCourseClick} onOthersClick={onOthersClick}
                    onSelectionChange={onSelectionChange}
                />
            </div>
        </>
    );

const RequirementView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, onCourseClick, onOthersClick, onSelectionChange, selectionToRequirement, requirementToOthersCount }: {
    requirement: Requirements,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersClick: (requirement: RequirementWithCourses) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) =>
    requirement instanceof RequirementWithChildren ? (
        <RequirementWithChildrenView
            requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
            courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
            selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
            onCourseClick={onCourseClick} onOthersClick={onOthersClick} onSelectionChange={onSelectionChange}
        />
    ) :
        requirement instanceof RequirementWithCourses ? (
            <RequirementWithCoursesView
                requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                onOthersClick={() => onOthersClick(requirement)}
            />) :
            (
                <SelectionRequirementView
                    requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    onCourseClick={onCourseClick} onOthersClick={onOthersClick} onSelectionChange={onSelectionChange}
                />
            );


export default RequirementView;
