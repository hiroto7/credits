import React, { useState } from 'react';
import { Accordion, Badge, Button, Dropdown, ListGroup } from "react-bootstrap";
import Course from "./Course";
import CourseList from "./CourseList";
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";

const CreditsCountLabelDelimiter = () => (<span className="text-muted"> / </span>)

const ExceededCreditsCountLabel = ({ creditsCount }: { creditsCount: number }) => (
    <>
        <span className="text-muted">(</span>
        +{creditsCount}
        <span className="text-muted">)</span>
    </>
)

const CreditsCountLabels = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement }: {
    requirement: Requirements,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
}) => {
    const acquiredCreditsCount = requirement.getRegisteredCreditsCount({ status: RegistrationStatus.Acquired, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: false });
    const exceededAcquiredCreditsCount = requirement.getRegisteredCreditsCount({ status: RegistrationStatus.Acquired, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: true });
    const registeredCreditsCount = requirement.getRegisteredCreditsCount({ status: RegistrationStatus.Registered, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: false });
    const exceededRegisteredCreditsCount = requirement.getRegisteredCreditsCount({ status: RegistrationStatus.Registered, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: true });
    const requiredCreditsCount = requirement.getRequiredCreditsCount(selectionToRequirement);
    return (
        <div>
            <span>
                <span className="text-muted">習得</span>
                <> </>
                <strong className="text-success">{acquiredCreditsCount}</strong>
                {exceededAcquiredCreditsCount > acquiredCreditsCount ? (<ExceededCreditsCountLabel creditsCount={exceededRegisteredCreditsCount - registeredCreditsCount} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">履修</span>
                <> </>
                <strong className="text-primary">{registeredCreditsCount}</strong>
                {exceededRegisteredCreditsCount > registeredCreditsCount ? (<ExceededCreditsCountLabel creditsCount={exceededRegisteredCreditsCount - registeredCreditsCount} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">必要</span>
                <> </>
                <strong>{requiredCreditsCount}</strong>
            </span>
        </div>
    )
};

export const RequirementSummaryView = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement }: {
    requirement: Requirements,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
}) => {
    const status = requirement.getStatus({ courseToStatus, courseToRequirement, selectionToRequirement });
    return (
        <>
            <h5 className="d-flex justify-content-between align-items-center">
                <div>{requirement.title}</div>
                <Badge className="flex-shrink-0" variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                    {status === RegistrationStatus.Acquired ? '修得OK' : status === RegistrationStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </h5>
            <div>
                {requirement.description === undefined ? (<></>) : (<div className="text-muted">{requirement.description}</div>)}
                <CreditsCountLabels requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
            </div>
        </>
    );
}

const RequirementWithChildrenView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, selectionToRequirement, onCourseClick, onSelectionChange }: {
    requirement: RequirementWithChildren,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => (
        <>
            <RequirementSummaryView requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
            <ListGroup className="mt-2">
                {
                    requirement.children.map(child => (
                        <ListGroup.Item key={child.title}>
                            <RequirementView requirement={child} showsOnlyRegistered={showsOnlyRegistered}
                                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement}
                                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange} />
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    );

const RequirementWithCoursesView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, onCourseClick, selectionToRequirement }: {
    requirement: RequirementWithCourses,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const courses = requirement.courses.filter(course =>
        !showsOnlyRegistered || (courseToStatus.get(course) !== RegistrationStatus.Unregistered &&
            requirement === courseToRequirement.get(course)));

    return (
        <>
            <Accordion activeKey={isOpen ? '0' : ''}>
                <div className={`bg-white ${isOpen ? 'sticky-top' : ''}`}>
                    <RequirementSummaryView requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
                    {
                        courses.length === 0 ? (
                            <Button block className="mt-2" variant="outline-secondary" disabled>
                                {showsOnlyRegistered ? '履修する' : ''}科目はありません
                            </Button>
                        ) : (
                                <Button block className="mt-2"
                                    onClick={() => setIsOpen(!isOpen)}
                                    variant={isOpen ? 'primary' : 'outline-secondary'} >
                                    {showsOnlyRegistered ? '履修する' : ''}科目を{isOpen ? '非' : ''}表示
                                </Button>
                            )
                    }
                </div>
                <Accordion.Collapse eventKey="0">
                    {
                        courses.length === 0 ? (<></>) : (
                            <div className="mt-2">
                                <CourseList requirement={requirement} courses={courses}
                                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                                    onCourseClick={course => onCourseClick(course, requirement)} />
                            </div>
                        )
                    }
                </Accordion.Collapse>
            </Accordion>
        </>
    );
}

const SelectionRequirementView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, onCourseClick, selectionToRequirement, onSelectionChange }: {
    requirement: SelectionRequirement,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
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
            <div className="mt-2">
                <RequirementView requirement={selectionToRequirement.get(requirement) || requirement.choices[0]}
                    showsOnlyRegistered={showsOnlyRegistered}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                    selectionToRequirement={selectionToRequirement} />
            </div>
        </>
    );

const RequirementView = ({ requirement, showsOnlyRegistered, courseToStatus, courseToRequirement, onCourseClick, onSelectionChange, selectionToRequirement }: {
    requirement: Requirements,
    showsOnlyRegistered: boolean,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, RequirementWithCourses>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) =>
    requirement instanceof RequirementWithChildren ? (<RequirementWithChildrenView showsOnlyRegistered={showsOnlyRegistered} onCourseClick={onCourseClick} requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} onSelectionChange={onSelectionChange} />) :
        requirement instanceof RequirementWithCourses ? (<RequirementWithCoursesView showsOnlyRegistered={showsOnlyRegistered} onCourseClick={onCourseClick} requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} onSelectionChange={onSelectionChange} />) :
            (<SelectionRequirementView requirement={requirement} showsOnlyRegistered={showsOnlyRegistered} onCourseClick={onCourseClick} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} onSelectionChange={onSelectionChange} />);


export default RequirementView;
