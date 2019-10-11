import React from 'react'
import { Badge, ListGroup } from "react-bootstrap";
import Course from "./Course";
import CourseList from "./CourseList";
import CourseStatus from "./CourseStatus";
import Requirements, { RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";

const RequirementWithChildrenView = ({ requirement, courseToStatus, courseToRequirement, onCourseClick }: {
    requirement: RequirementWithChildren,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus, requirement: Requirements) => void,
}) => (
        <>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <div>{requirement.title}</div>
                    {requirement.description === undefined ? (<div>{requirement.description}</div>) : ''}
                </div>
                <Badge className="flex-shrink-0" variant={CourseStatus.Acquired ? 'success' : CourseStatus.Registered ? 'primary' : 'secondary'}>
                    {CourseStatus.Acquired ? '修得OK' : CourseStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                <div><span className="text-muted">習得</span> <strong>{requirement.creditsCount}</strong></div>
                <div><span className="text-muted">履修</span> <strong>{requirement.creditsCount}</strong></div>
                <div><span className="text-muted">必要</span> <strong>{requirement.creditsCount}</strong></div>
            </div>
            <ListGroup>
                {
                    requirement.children.map(child => (
                        <ListGroup.Item>
                            <RequirementView onCourseClick={onCourseClick} requirement={child} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} />
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    );

const RequirementWithCoursesView = ({ requirement, courseToStatus, courseToRequirement, onCourseClick }: {
    requirement: RequirementWithCourses,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus, requirement: Requirements) => void,
}) => (
        <>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <div>{requirement.title}</div>
                    {requirement.description === undefined ? (<div>{requirement.description}</div>) : ''}
                </div>
                <Badge className="flex-shrink-0" variant={CourseStatus.Acquired ? 'success' : CourseStatus.Registered ? 'primary' : 'secondary'}>
                    {CourseStatus.Acquired ? '修得OK' : CourseStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                <div><span className="text-muted">習得</span> <strong>{requirement.creditsCount}</strong></div>
                <div><span className="text-muted">履修</span> <strong>{requirement.creditsCount}</strong></div>
                <div><span className="text-muted">必要</span> <strong>{requirement.creditsCount}</strong></div>
            </div>
            <CourseList courses={requirement.courses} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                onCourseClick={(course, nextStatus) => onCourseClick(course, nextStatus, requirement)} />
        </>
    );

const SelectionRequirementView = ({ requirement: _ }: { requirement: SelectionRequirement }) => (<>{_.title}SelectionRequirementView</>);

const RequirementView = ({ requirement, courseToStatus, courseToRequirement, onCourseClick }: {
    requirement: Requirements,
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus, requirement: Requirements) => void,
}) =>
    requirement instanceof RequirementWithChildren ? (<RequirementWithChildrenView onCourseClick={onCourseClick} requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} />) :
        requirement instanceof RequirementWithCourses ? (<RequirementWithCoursesView onCourseClick={onCourseClick} requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} />) :
            (<SelectionRequirementView requirement={requirement} />);


export default RequirementView;
