import React, { useState } from 'react'
import { Badge, ListGroup, Button, Accordion } from "react-bootstrap";
import Course from "./Course";
import CourseList from "./CourseList";
import CourseStatus from "./CourseStatus";
import Requirements, { RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";

const CreditsCountLabelDelimiter = () => (<span className="text-muted"> / </span>)

const CreditsCountLabels = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement }: {
    requirement: Requirements,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
}) => {
    const acquiredCreditsCount = requirement.getRegisteredCreditsCount({ status: CourseStatus.Acquired, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: false });
    const exceededAcquiredCreditsCount = requirement.getRegisteredCreditsCount({ status: CourseStatus.Acquired, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: true });
    const registeredCreditsCount = requirement.getRegisteredCreditsCount({ status: CourseStatus.Registered, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: false });
    const exceededRegisteredCreditsCount = requirement.getRegisteredCreditsCount({ status: CourseStatus.Registered, courseToRequirement, courseToStatus, selectionToRequirement, includesExcess: true });
    const requiredCreditsCount = requirement.getRequiredCreditsCount(selectionToRequirement);
    return (
        <div>
            <span>
                <span className="text-muted">習得</span> <strong className="text-success">
                    {acquiredCreditsCount}
                </strong>{exceededAcquiredCreditsCount > acquiredCreditsCount ? `(+${exceededAcquiredCreditsCount - acquiredCreditsCount})` : ''}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">履修</span> <strong className="text-primary">
                    {registeredCreditsCount}
                </strong>{exceededRegisteredCreditsCount > registeredCreditsCount ? `(+${exceededRegisteredCreditsCount - registeredCreditsCount})` : ''}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">必要</span> <strong className="text-secondary">
                    {requiredCreditsCount}
                </strong>
            </span>
        </div>
    )
};

const RequirementSummaryView = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement }: {
    requirement: Requirements,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
}) => (
        <>
            <h5 className="d-flex justify-content-between align-items-center">
                <div>{requirement.title}</div>
                <Badge className="flex-shrink-0" variant={CourseStatus.Acquired ? 'success' : CourseStatus.Registered ? 'primary' : 'secondary'}>
                    {CourseStatus.Acquired ? '修得OK' : CourseStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </h5>
            <div>
                <div>{requirement.description === undefined ? (<div>{requirement.description}</div>) : ''}</div>
                <CreditsCountLabels requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
            </div>
        </>
    );

const RequirementWithChildrenView = ({ requirement, courseToStatus, courseToRequirement, selectionToRequirement, onCourseClick, onSelectionChange }: {
    requirement: RequirementWithChildren,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus, requirement: Requirements) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => (
        <>
            <RequirementSummaryView requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
            <ListGroup className="mt-2">
                {
                    requirement.children.map(child => (
                        <ListGroup.Item>
                            <RequirementView requirement={child} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement}
                                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange} />
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    );

const RequirementWithCoursesView = ({ requirement, courseToStatus, courseToRequirement, onCourseClick, selectionToRequirement }: {
    requirement: RequirementWithCourses,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus, requirement: Requirements) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Accordion activeKey={isOpen ? '0' : ''}>
                <div className="sticky-top bg-white">
                    <RequirementSummaryView requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
                    <Button block size="sm" className="mt-2"
                        onClick={() => setIsOpen(!isOpen)}
                        variant={isOpen ? 'primary' : 'outline-secondary'} >
                        科目を{isOpen ? '非' : ''}表示
                    </Button>
                </div>
                <Accordion.Collapse eventKey="0">
                    <div className="mt-2">
                        <CourseList courses={requirement.courses} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                            onCourseClick={(course, nextStatus) => onCourseClick(course, nextStatus, requirement)} />
                    </div>
                </Accordion.Collapse>
            </Accordion>
        </>
    );
}

const SelectionRequirementView = ({ requirement, courseToStatus, courseToRequirement, onCourseClick, selectionToRequirement, onSelectionChange }: {
    requirement: SelectionRequirement,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus, requirement: Requirements) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) => (
        <>
            <div>{requirement.title}<Button variant="secondary" size="sm">変更</Button></div>
            <RequirementView requirement={selectionToRequirement.get(requirement) || requirement.choices[0]}
                courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                selectionToRequirement={selectionToRequirement} />
        </>
    );

const RequirementView = ({ requirement, courseToStatus, courseToRequirement, onCourseClick, onSelectionChange, selectionToRequirement }: {
    requirement: Requirements,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus, requirement: Requirements) => void,
    onSelectionChange: (selection: SelectionRequirement, chosen: Requirements) => void,
}) =>
    requirement instanceof RequirementWithChildren ? (<RequirementWithChildrenView onCourseClick={onCourseClick} requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} onSelectionChange={onSelectionChange} />) :
        requirement instanceof RequirementWithCourses ? (<RequirementWithCoursesView onCourseClick={onCourseClick} requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} onSelectionChange={onSelectionChange} />) :
            (<SelectionRequirementView requirement={requirement} onCourseClick={onCourseClick} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} onSelectionChange={onSelectionChange} />);


export default RequirementView;
