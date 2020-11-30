import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { RegistrationStatus } from "./Plan";

export const CourseRegistrationStatusBadge: React.FC<{
  status: RegistrationStatus;
}> = ({ status }) => {
  switch (status) {
    case RegistrationStatus.Acquired:
      return <Badge variant="success">修得済み</Badge>;
    case RegistrationStatus.Registered:
      return <Badge variant="primary">履修する</Badge>;
    default:
      return <Badge variant="secondary">履修しない</Badge>;
  }
};

export const RequirementRegistrationStatusBadge: React.FC<{
  status: RegistrationStatus;
}> = ({ status }) => {
  switch (status) {
    case RegistrationStatus.Acquired:
      return <Badge variant="success">修得OK</Badge>;
    case RegistrationStatus.Registered:
      return <Badge variant="primary">履修OK</Badge>;
    default:
      return <Badge variant="secondary">不足</Badge>;
  }
};

export const DisabledCourseBadge: React.FC<{ id: string }> = ({ id }) => (
  <OverlayTrigger
    overlay={
      <Tooltip id={id}>
        ほかに同名の科目を履修しているため、この科目は履修できません。
      </Tooltip>
    }
  >
    <Badge variant="secondary">履修不可</Badge>
  </OverlayTrigger>
);
