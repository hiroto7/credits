import { ListGroup } from "react-bootstrap";
import type Course from "../Course";
import type FilterType from "../FilterType";
import type Plan from "../Plan";
import type { RegisteredCreditCounts } from "../Plan";
import type RegistrationStatusLockTarget from "../RegistrationStatusLockTarget";
import type {
  RequirementWithChildren,
  RequirementWithCourses,
} from "../Requirements";
import InnerRequirementView from "./InnerRequirementView";
import { RequirementSummaryView } from "./RequirementSummaryView";

const RequirementWithChildrenView: React.FC<{
  requirement: RequirementWithChildren;
  filterType: FilterType;
  lockTarget: RegistrationStatusLockTarget;
  plan: Plan;
  onCourseClick: (course: Course, requirement: RequirementWithCourses) => void;
  onOthersCountsChange: (
    requirement: RequirementWithCourses,
    newOthersCount: RegisteredCreditCounts
  ) => void;
  onSelectionChange: (selectionName: string, newOptionName: string) => void;
}> = ({
  requirement,
  filterType,
  lockTarget,
  plan,
  onCourseClick,
  onOthersCountsChange,
  onSelectionChange,
}) => (
  <>
    <RequirementSummaryView requirement={requirement} plan={plan} />
    <ListGroup className="mt-3">
      {requirement.children.map((child) => (
        <ListGroup.Item key={child.id}>
          <InnerRequirementView
            requirement={child}
            plan={plan}
            filterType={filterType}
            lockTarget={lockTarget}
            onCourseClick={onCourseClick}
            onSelectionChange={onSelectionChange}
            onOthersCountsChange={onOthersCountsChange}
          />
        </ListGroup.Item>
      ))}
    </ListGroup>
  </>
);

export default RequirementWithChildrenView;
