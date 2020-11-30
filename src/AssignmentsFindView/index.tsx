import { useCallback, useEffect, useState } from "react";
import { Button, ListGroup, Modal, Spinner } from "react-bootstrap";
// eslint-disable-next-line import/no-webpack-loader-syntax
import AssignmentsFindWorker from "worker-loader!./findAssignments.worker";
import { RequirementRegistrationStatusBadge } from "../badges";
import type Course from "../Course";
import Plan, { fromJSON, PlanJSON, toJSON } from "../Plan";
import type Requirements from "../Requirements";
import type { RequirementWithCourses } from "../Requirements";

const AssignmentsFindView: React.FC<{
  show: boolean;
  requirement: Requirements;
  idToRequirement: ReadonlyMap<string, RequirementWithCourses>;
  codeToCourse: ReadonlyMap<string, Course>;
  plan: Plan;
  selectsAutomatically: boolean;
  additionalInformation: React.ReactNode;
  cancelButtonLabel: string;
  onCancel: () => void;
  onSubmit: (plan: Plan) => void;
}> = ({
  show,
  requirement,
  idToRequirement,
  codeToCourse,
  plan,
  selectsAutomatically,
  additionalInformation,
  cancelButtonLabel,
  onCancel,
  onSubmit,
}) => {
  const [worker, setWorker] = useState<Worker | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<readonly Plan[] | undefined>(undefined);

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data === "done") {
        if (selectsAutomatically) {
          if (plans === undefined) {
            onCancel();
          } else if (plans[0] !== undefined && plans.length === 1) {
            onSubmit(plans[0]);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else {
        const planJSONList: readonly PlanJSON[] = event.data;
        const nextPlans: readonly Plan[] = planJSONList.map((planJSON) =>
          fromJSON(planJSON, { codeToCourse, idToRequirement })
        );
        setPlans(nextPlans);
      }
    },
    [
      codeToCourse,
      idToRequirement,
      onCancel,
      onSubmit,
      plans,
      selectsAutomatically,
    ]
  );

  useEffect(() => {
    if (show) {
      setIsLoading(true);
      setPlans(undefined);
      const worker = new AssignmentsFindWorker();
      setWorker(worker);
      worker.postMessage({
        codeToCourse,
        planJSON: toJSON(plan),
        requirementJSON: requirement.toJSON(),
      });

      return () => {
        worker.terminate();
        setWorker(undefined);
      };
    }
  }, [codeToCourse, plan, requirement, show]);

  useEffect(() => {
    worker?.addEventListener("message", onMessage);
    return () => worker?.removeEventListener("message", onMessage);
  }, [onMessage, worker]);

  return (
    <Modal show={show} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>最適な割り当ての自動探索</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <>
            <p>
              全体として修得単位数や履修単位数が最大となるような割り当てを探しています。
              この処理は短時間で終わらない場合があります。
            </p>
            {plans === undefined ? (
              <></>
            ) : (
              <p>
                これまでに見つかった割り当てが以下に表示されています。
                まだ最適な割り当てがほかにないか探していますが、選択してすぐに適用することもできます。
              </p>
            )}
          </>
        ) : plans === undefined ? (
          <p>
            割り当てを探しましたが、要件を満たす割り当ては見つかりませんでした。
          </p>
        ) : (
          <p>
            全体として修得単位数や履修単位数が最大となるような割り当てとして、以下のものが見つかりました。
            適用するものを選択してください。
          </p>
        )}

        {additionalInformation}

        {plans === undefined ? (
          <></>
        ) : (
          <ListGroup className={isLoading ? "mb-3" : undefined}>
            {plans.map((plan1) => {
              const status = requirement.getStatus(plan1);
              const creditsCounts = requirement.getRegisteredCreditCounts(
                plan1,
                false
              );
              return (
                <ListGroup.Item
                  key={`${creditsCounts.acquired}-${creditsCounts.registered}`}
                  action
                  onClick={() => onSubmit(plan1)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      修得
                      <> </>
                      <strong className="text-success">
                        {creditsCounts.acquired}
                      </strong>
                      <> / </>
                      履修
                      <> </>
                      <strong className="text-primary">
                        {creditsCounts.registered}
                      </strong>
                    </div>
                    <RequirementRegistrationStatusBadge status={status} />
                  </div>
                  {[...plan1.selectionNameToOptionName].map(
                    ([selectionName, optionName]) => (
                      <div key={selectionName}>
                        {selectionName}
                        <> : </>
                        <strong>{optionName}</strong>
                      </div>
                    )
                  )}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
        {isLoading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <></>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelButtonLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignmentsFindView;

export const AssignmentsFindButton: React.FC<{
  requirement: Requirements;
  idToRequirement: ReadonlyMap<string, RequirementWithCourses>;
  codeToCourse: ReadonlyMap<string, Course>;
  plan: Plan;
  onSubmit: (plan: Plan) => void;
}> = ({ requirement, idToRequirement, codeToCourse, plan, onSubmit }) => {
  const [show, setShow] = useState(false);

  const onCancel = useCallback(() => setShow(false), []);
  const handleSubmit = useCallback(
    (nextPlan) => {
      setShow(false);
      onSubmit(nextPlan);
    },
    [onSubmit]
  );

  return (
    <>
      <Button variant="secondary" onClick={() => setShow(true)}>
        最適な割り当ての自動探索
      </Button>
      <AssignmentsFindView
        show={show}
        onCancel={onCancel}
        requirement={requirement}
        idToRequirement={idToRequirement}
        codeToCourse={codeToCourse}
        plan={plan}
        selectsAutomatically={false}
        additionalInformation={
          <p>
            先に<b>履修状況の設定</b>と<b>単位数の入力</b>
            を行っておいてください。
          </p>
        }
        cancelButtonLabel="キャンセル"
        onSubmit={handleSubmit}
      />
    </>
  );
};
