import { useCallback } from "react";
import { Badge, ListGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { CourseRegistrationStatusBadge, DisabledCourseBadge } from "../badges";
import type Course from "../Course";
import Plan, {
  getNextStatus,
  isRegistrable,
  RegistrationStatus,
} from "../Plan";
import type RegistrationStatusLockTarget from "../RegistrationStatusLockTarget";
import type Requirements from "../Requirements";
import type { RequirementWithCourses } from "../Requirements";

const CourseListItem: React.FC<{
  course: Course;
  newRequirement: Requirements;
  plan: Plan;
  lockTarget: RegistrationStatusLockTarget;
  onClick: () => void;
}> = ({ course, onClick, newRequirement, plan, lockTarget }) => {
  const status =
    plan.courseToStatus.get(course) ?? RegistrationStatus.Unregistered;
  const currentRequirement = plan.courseToRequirement.get(course);
  const isRegisteredButInvalid =
    status !== RegistrationStatus.Unregistered &&
    currentRequirement !== newRequirement;
  const isRegistrable0 = isRegistrable({
    course,
    courseToStatus: plan.courseToStatus,
  });
  const action =
    (getNextStatus({ currentStatus: status, lockTarget }) !== status &&
      isRegistrable0) ||
    isRegisteredButInvalid;
  const handleClick = useCallback(() => {
    if (isRegistrable0) {
      onClick();
    }
  }, [isRegistrable0, onClick]);

  return (
    <ListGroup.Item
      action={action}
      onClick={handleClick}
      variant={
        isRegisteredButInvalid
          ? "dark"
          : status === RegistrationStatus.Acquired
          ? "success"
          : status === RegistrationStatus.Registered
          ? "primary"
          : undefined
      }
    >
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <div>{course.title}</div>
          <code>{course.code}</code>
        </div>
        <div className="ml-2 text-right flex-shrink-0">
          {isRegisteredButInvalid ? (
            <OverlayTrigger
              overlay={
                <Tooltip id="tooltip1">
                  {currentRequirement === undefined
                    ? "この科目はどの科目群にも割り当てられていないため、合計単位数の計算に含まれません。"
                    : "この科目はほかの科目群に割り当てられているため、ここでは合計単位数の計算に含まれません。"}
                </Tooltip>
              }
            >
              {currentRequirement === undefined ? (
                <Badge variant="secondary">?</Badge>
              ) : (
                <Badge variant="warning">!</Badge>
              )}
            </OverlayTrigger>
          ) : (
            <></>
          )}
          {isRegistrable0 ? (
            <CourseRegistrationStatusBadge status={status} />
          ) : (
            <DisabledCourseBadge id="tooltip2" />
          )}
          <div>
            <span className="text-muted">単位数</span>{" "}
            <strong>{course.creditCount}</strong>
          </div>
        </div>
      </div>
    </ListGroup.Item>
  );
};

const CourseList = ({
  requirement,
  courses,
  plan,
  onCourseClick,
  lockTarget,
}: {
  requirement: RequirementWithCourses;
  courses: readonly Course[];
  plan: Plan;
  lockTarget: RegistrationStatusLockTarget;
  onCourseClick: (course: Course) => void;
}) => (
  <ListGroup>
    {courses.map((course: Course) => (
      <CourseListItem
        key={course.code}
        course={course}
        plan={plan}
        newRequirement={requirement}
        lockTarget={lockTarget}
        onClick={() => onCourseClick(course)}
      />
    ))}
  </ListGroup>
);

export default CourseList;
